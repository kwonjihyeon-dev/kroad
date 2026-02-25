'use client';

import { useEffect, useRef } from 'react';
import { MAP_CONFIG } from '@shared/config/map';
import { useMapStore } from '@shared/store/mapStore';
import styles from './map-view.module.scss';

/** Naver Maps 지도 컴포넌트 */
export function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const setMapInstance = useMapStore((s) => s.setMapInstance);

  useEffect(() => {
    const el = mapRef.current;
    if (!el || mapInstanceRef.current) return;
    if (!window.naver?.maps) return;

    mapInstanceRef.current = new naver.maps.Map(el, {
      center: new naver.maps.LatLng(MAP_CONFIG.DEFAULT_CENTER.lat, MAP_CONFIG.DEFAULT_CENTER.lng),
      zoom: MAP_CONFIG.DEFAULT_ZOOM,
      zoomControl: false,
      mapDataControl: false,
      scaleControl: false,
    });

    setMapInstance(mapInstanceRef.current);
  }, [setMapInstance]);

  return <div ref={mapRef} className={styles.map} />;
}
