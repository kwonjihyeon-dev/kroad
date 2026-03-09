'use client';

import { useEffect, useRef } from 'react';
import { useGpsStore } from '@entities/position/model';
import { useMapStore } from '@shared/store/mapStore';

/**
 * 앱 진입 시 Geolocation API로 현재 위치를 1회 조회하여
 * gpsStore에 초기 위치를 저장하고 지도 중심을 이동한다.
 */
export function useInitialPosition() {
  const updateFilteredPosition = useGpsStore((s) => s.updateFilteredPosition);
  const filteredPosition = useGpsStore((s) => s.filteredPosition);
  const mapInstance = useMapStore((s) => s.mapInstance);
  const didFetch = useRef(false);

  useEffect(() => {
    if (filteredPosition || didFetch.current) return;
    didFetch.current = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        const raw = { lat, lng, accuracy, timestamp: pos.timestamp, heading: null, speed: null};

        updateFilteredPosition({ lat, lng, raw, isSnapped: false });
      },
      () => {
        // 위치 권한 거부 시 무시 — 기본 좌표 유지
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }, [filteredPosition, updateFilteredPosition]);

  // 초기 위치가 설정되면 지도 중심 1회 이동
  const didCenter = useRef(false);

  useEffect(() => {
    if (!filteredPosition || !mapInstance || didCenter.current) return;
    didCenter.current = true;

    mapInstance.setCenter(new naver.maps.LatLng(filteredPosition.lat, filteredPosition.lng));
  }, [filteredPosition, mapInstance]);
}
