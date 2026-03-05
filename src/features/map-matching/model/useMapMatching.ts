'use client';

import { useCallback, useRef } from 'react';
import { useGpsStore } from '@entities/position/model';
import type { GpsPosition } from '@entities/position/model';
import { matchCoordinates } from '@shared/api/osrm/matchService';
import { GPS_CONFIG } from '@shared/config/gps';
import { fromOsrmLocation } from '@shared/lib/coordinateUtils';

/**
 * 배치 수집 + OSRM Map Matching 훅
 * GPS 좌표를 일정 간격으로 모아 OSRM Match API로 도로 스냅한다.
 */
export function useMapMatching() {
  const updateFilteredPosition = useGpsStore((s) => s.updateFilteredPosition);
  const batchRef = useRef<GpsPosition[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const processBatch = useCallback(async () => {
    const batch = batchRef.current;
    if (batch.length < 2) return;

    const coordinates = batch.map((p) => ({ lat: p.lat, lng: p.lng }));
    const timestamps = batch.map((p) => Math.floor(p.timestamp / 1000));

    try {
      // OSRM이 각 좌표를 가장 가까운 도로 위로 스냅해서 반환
      const response = await matchCoordinates(coordinates, timestamps);

      if (response.code === 'Ok' && response.tracepoints.length > 0) {
         // 응답의 마지막 tracepoint만 사용 (= 가장 최근 위치)
        const lastTracepoint = response.tracepoints[response.tracepoints.length - 1];
        const lastRaw = batch[batch.length - 1];

        if (lastTracepoint) {
          const snapped = fromOsrmLocation(lastTracepoint.location);
          updateFilteredPosition({
            lat: snapped.lat, // 도로 위 보정 좌표
            lng: snapped.lng,
            raw: lastRaw, // 원본 GPS 좌표 보존
            isSnapped: true, // 스냅 성공 여부
          });
        }
      }
    } catch (error) {
      console.error('Map Matching 실패:', error);
    }

    batchRef.current = [];
  }, [updateFilteredPosition]);

  const addPosition = useCallback((position: GpsPosition) => {
    batchRef.current.push(position);
  }, []);

  const start = useCallback(() => {
    batchRef.current = [];
    timerRef.current = setInterval(processBatch, GPS_CONFIG.BATCH_INTERVAL);
  }, [processBatch]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    batchRef.current = [];
  }, []);

  return { addPosition, start, stop };
}
