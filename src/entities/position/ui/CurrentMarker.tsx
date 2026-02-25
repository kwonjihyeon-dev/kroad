'use client';

import { useEffect, useRef } from 'react';

import { MAP_CONFIG } from '@shared/config/map';
import type { Coordinate } from '@shared/lib/types';
import { useMapStore } from '@shared/store/mapStore';

interface CurrentMarkerProps {
  position: Coordinate | null;
}

/**
 * 현재 위치 마커 — CSS transition으로 부드럽게 이동
 */
export function CurrentMarker({ position }: CurrentMarkerProps) {
  const map = useMapStore((s) => s.mapInstance);
  const markerRef = useRef<naver.maps.Marker | null>(null);

  useEffect(() => {
    if (!map || !position) return;

    const latlng = new naver.maps.LatLng(position.lat, position.lng);

    if (!markerRef.current) {
      markerRef.current = new naver.maps.Marker({
        position: latlng,
        map,
        icon: {
          content: `
            <div style="
              width: 18px;
              height: 18px;
              background: #4A90D9;
              border: 3px solid #fff;
              border-radius: 50%;
              box-shadow: 0 0 8px rgba(74, 144, 217, 0.5);
              transition: transform ${MAP_CONFIG.MARKER_ANIMATION_DURATION}ms ease;
            "></div>
          `,
          anchor: new naver.maps.Point(9, 9),
        },
      });
    } else {
      markerRef.current.setPosition(latlng);
    }
  }, [map, position]);

  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, []);

  return null;
}
