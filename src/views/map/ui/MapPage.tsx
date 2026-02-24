'use client';

import Script from 'next/script';

import { HomePanel } from '@widgets/home-panel';
import { MapView } from '@widgets/map-view';
import { RoutePanel } from '@widgets/route-panel';
import { SearchPanel } from '@widgets/search-panel';
import { useUiStore } from '@shared/store/uiStore';

import styles from './map-page.module.scss';

/** 메인 지도 페이지 — currentScreen에 따라 패널 전환 */
export function MapPage() {
  const currentScreen = useUiStore((s) => s.currentScreen);

  return (
    <div className={styles.container}>
      <MapView />

      {currentScreen === 'home' && <HomePanel />}
      {currentScreen === 'search' && <SearchPanel />}
      {currentScreen === 'route' && <RoutePanel />}
    </div>
  );
}
