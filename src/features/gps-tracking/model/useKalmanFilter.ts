'use client';

import { useCallback, useRef } from 'react';
import { KalmanFilter } from '@features/gps-tracking/lib';
import type { FilteredPosition, GpsPosition } from '@entities/position/model';

/**
 * 칼만 필터 훅 — GPS 원시 좌표를 필터링하여 부드러운 좌표를 반환한다
 */
export function useKalmanFilter() {
  const latFilterRef = useRef(new KalmanFilter());
  const lngFilterRef = useRef(new KalmanFilter());

  const filter = useCallback((raw: GpsPosition): FilteredPosition => {
    const filteredLat = latFilterRef.current.filter(raw.lat);
    const filteredLng = lngFilterRef.current.filter(raw.lng);

    return {
      lat: filteredLat,
      lng: filteredLng,
      raw,
      isSnapped: false,
    };
  }, []);

  const reset = useCallback(() => {
    latFilterRef.current.reset();
    lngFilterRef.current.reset();
  }, []);

  return { filter, reset };
}
