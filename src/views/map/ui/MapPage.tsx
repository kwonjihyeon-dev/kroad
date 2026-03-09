'use client';

import { GpsTestPanel } from '@dev/GpsTestPanel';
import { HomePanel } from '@widgets/home-panel/ui';
import { MapView } from '@widgets/map-view/ui';
import { NavigationPanel } from '@widgets/navigation-panel/ui';
import { RoutePanel } from '@widgets/route-panel/ui';
import { SearchPanel } from '@widgets/search-panel/ui';
import { useInitialPosition } from '@features/gps-tracking/model';
import { RouteAlternatives } from '@features/route-search/ui';
import { useGpsStore } from '@entities/position/model';
import { CurrentMarker } from '@entities/position/ui';
import { useUiStore } from '@shared/store/uiStore';
import styles from './map-page.module.scss';

const IS_DEV = process.env.NODE_ENV === 'development';

/** 메인 지도 페이지 — currentScreen에 따라 패널 전환 */
export function MapPage() {
  const currentScreen = useUiStore((s) => s.currentScreen);
  const filteredPosition = useGpsStore((s) => s.filteredPosition);

  useInitialPosition();

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
