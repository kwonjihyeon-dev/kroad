'use client';

import { useCallback } from 'react';
import { useGpsStore } from '@entities/position/model';
import type { GpsPosition } from '@entities/position/model';
import { useGeolocation } from './useGeolocation';
import { useKalmanFilter } from './useKalmanFilter';

interface UseGpsTrackingOptions {
  /** GPS 좌표 수신 시 추가로 호출할 콜백 (Map Matching 배치 수집 등) */
  onPosition?: (position: GpsPosition) => void;
}

/**
 * GPS 추적 오케스트레이션 훅
 * Geolocation → 칼만 필터 → 스토어 업데이트
 * Map Matching 등 외부 연동은 onPosition 콜백으로 위임한다.
 */
export function useGpsTracking(options?: UseGpsTrackingOptions) {
  const { isTracking, startTracking, stopTracking, updateRawPosition, updateFilteredPosition } =
    useGpsStore();
  const { filter, reset: resetFilter } = useKalmanFilter();

  const handlePosition = useCallback(
    (raw: GpsPosition) => {
      updateRawPosition(raw);

      // 칼만 필터 적용
      const filtered = filter(raw);
      updateFilteredPosition(filtered);

      // 외부 콜백 호출
      options?.onPosition?.(raw);
    },
    [updateRawPosition, updateFilteredPosition, filter, options],
  );

  useGeolocation(handlePosition, isTracking);

  const start = useCallback(() => {
    startTracking();
  }, [startTracking]);

  const stop = useCallback(() => {
    stopTracking();
    resetFilter();
  }, [stopTracking, resetFilter]);

  return { isTracking, start, stop };
}
