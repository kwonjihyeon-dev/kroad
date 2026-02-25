'use client';

import { HomePanel } from '@widgets/home-panel';
import { MapView } from '@widgets/map-view';
import { RoutePanel } from '@widgets/route-panel';
import { SearchPanel } from '@widgets/search-panel';

import { CurrentMarker, useGpsStore } from '@entities/position';

import { useUiStore } from '@shared/store/uiStore';

import { GpsTestPanel } from '@dev/GpsTestPanel';
import styles from './map-page.module.scss';

const IS_DEV = process.env.NODE_ENV === 'development';

/** 메인 지도 페이지 — currentScreen에 따라 패널 전환 */
export function MapPage() {
  const currentScreen = useUiStore((s) => s.currentScreen);
  const filteredPosition = useGpsStore((s) => s.filteredPosition);

  return (
    <div className={styles.container}>
      <MapView />
      <CurrentMarker position={filteredPosition} />

      {currentScreen === 'home' && <HomePanel />}
      {currentScreen === 'search' && <SearchPanel />}
      {currentScreen === 'route' && <RoutePanel />}

      {IS_DEV && <GpsTestPanel />}
    </div>
  );
}
