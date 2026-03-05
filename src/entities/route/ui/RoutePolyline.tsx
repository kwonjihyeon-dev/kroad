'use client';

import { useEffect, useRef } from 'react';
import type { Coordinate } from '@shared/lib/types';
import { useMapStore } from '@shared/store/mapStore';

interface RoutePolylineProps {
  path: Coordinate[];
  color: string;
  width: number;
  opacity: number;
  zIndex: number;
  onClick?: () => void;
}

/**
 * 지도 위에 경로 폴리라인을 렌더링한다.
 */
export function RoutePolyline({ path, color, width, opacity, zIndex, onClick }: RoutePolylineProps) {
  const map = useMapStore((s) => s.mapInstance);
  const polylineRef = useRef<naver.maps.Polyline | null>(null);
  const listenerRef = useRef<naver.maps.MapEventListener | null>(null);

  useEffect(() => {
    if (!map || path.length === 0) return;

    const naverPath = path.map((c) => new naver.maps.LatLng(c.lat, c.lng));

    if (!polylineRef.current) {
      polylineRef.current = new naver.maps.Polyline({
        map,
        path: naverPath,
        strokeColor: color,
        strokeWeight: width,
        strokeOpacity: opacity,
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        zIndex,
      });
    } else {
      polylineRef.current.setOptions({
        path: naverPath,
        strokeColor: color,
        strokeWeight: width,
        strokeOpacity: opacity,
        zIndex,
      });
    }

    // 클릭 리스너 갱신
    if (listenerRef.current) {
      naver.maps.Event.removeListener(listenerRef.current);
      listenerRef.current = null;
    }
    if (onClick && polylineRef.current) {
      listenerRef.current = naver.maps.Event.addListener(polylineRef.current, 'click', onClick);
    }
  }, [map, path, color, width, opacity, zIndex, onClick]);

  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        naver.maps.Event.removeListener(listenerRef.current);
        listenerRef.current = null;
      }
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, []);

  return null;
}
