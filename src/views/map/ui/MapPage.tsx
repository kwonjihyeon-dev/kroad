'use client';

import { useEffect } from 'react';
import { GpsTestPanel } from '@dev/GpsTestPanel';
import { HomePanel } from '@widgets/home-panel/ui';
import { MapView } from '@widgets/map-view/ui';
import { NavigationPanel } from '@widgets/navigation-panel/ui';
import { RoutePanel } from '@widgets/route-panel/ui';
import { SearchPanel } from '@widgets/search-panel/ui';
import { useGpsTracking, useInitialPosition } from '@features/gps-tracking/model';
import { useRouteSearch } from '@features/route-search/model';
import { RouteAlternatives } from '@features/route-search/ui';
import { usePlaceStore } from '@entities/place/model';
import { useGpsStore } from '@entities/position/model';
import { CurrentMarker } from '@entities/position/ui';
import { useRouteStore } from '@entities/route/model';
import { useUiStore } from '@shared/store/uiStore';
import styles from './map-page.module.scss';

const IS_DEV = process.env.NODE_ENV === 'development';

/** 메인 지도 페이지 — currentScreen에 따라 패널 전환 */
export function MapPage() {
  const currentScreen = useUiStore((s) => s.currentScreen);
  const filteredPosition = useGpsStore((s) => s.filteredPosition);
  const selectedPlace = usePlaceStore((s) => s.selectedPlace);
  const isNavigating = useRouteStore((s) => s.navigation.isNavigating);

  useInitialPosition();
  useRouteSearch(filteredPosition, selectedPlace?.coordinate ?? null);

  const { start: startGps, stop: stopGps } = useGpsTracking();

  // 네비게이션 모드 진입/종료 시 GPS 추적 시작/중지
  useEffect(() => {
    if (isNavigating) {
      startGps();
    } else if (currentScreen !== 'navigation') {
      stopGps();
    }
  }, [isNavigating, currentScreen, startGps, stopGps]);

  return (
    <div className={styles.container}>
      <MapView />
      <CurrentMarker position={filteredPosition} />
      {(currentScreen === 'route' || currentScreen === 'navigation') && <RouteAlternatives />}

      {currentScreen === 'home' && <HomePanel />}
      {currentScreen === 'search' && <SearchPanel />}
      {currentScreen === 'route' && <RoutePanel />}
      {currentScreen === 'navigation' && <NavigationPanel />}

      {IS_DEV && <GpsTestPanel />}
    </div>
  );
}
