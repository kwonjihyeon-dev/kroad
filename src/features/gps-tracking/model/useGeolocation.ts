'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { GpsPosition } from '@entities/position/model';
import { GPS_CONFIG } from '@shared/config/gps';

type GeolocationCallback = (position: GpsPosition) => void;

/**
 * 브라우저 Geolocation API watchPosition 래핑 훅
 * @param onPosition - GPS 좌표 수신 시 호출될 콜백
 * @param enabled - 추적 활성화 여부
 */
export function useGeolocation(onPosition: GeolocationCallback, enabled: boolean) {
  const watchIdRef = useRef<number | null>(null);

  const startWatch = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation API를 지원하지 않는 브라우저입니다.');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (geo) => {
        onPosition({
          lat: geo.coords.latitude,
          lng: geo.coords.longitude,
          accuracy: geo.coords.accuracy,
          heading: geo.coords.heading,
          speed: geo.coords.speed,
          timestamp: geo.timestamp,
        });
      },
      (error) => {
        console.error('GPS 오류:', error.message);
      },
      {
        enableHighAccuracy: GPS_CONFIG.HIGH_ACCURACY,
        maximumAge: GPS_CONFIG.MAX_AGE,
        timeout: GPS_CONFIG.TIMEOUT,
      },
    );
  }, [onPosition]);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      startWatch();
    } else {
      stopWatch();
    }

    return stopWatch;
  }, [enabled, startWatch, stopWatch]);
}
