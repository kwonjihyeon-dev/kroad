'use client';

import { useCallback, useState } from 'react';
import { usePlaceStore } from '@entities/place/model';
import { useRouteStore } from '@entities/route/model';
import { formatArrivalTime } from '@shared/lib/format';
import { useUiStore } from '@shared/store/uiStore';
import styles from './route-panel.module.scss';
import { RouteCard } from './RouteCard';
import { RouteHeader } from './RouteHeader';

/** 경로 탐색 결과 패널 — 헤더 + 경로 카드 + 안내 시작 CTA */
export function RoutePanel() {
  const setScreen = useUiStore((s) => s.setScreen);
  const selectedPlace = usePlaceStore((s) => s.selectedPlace);
  const { activeRoute, alternativeRoutes, setActiveRoute } = useRouteStore();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allRoutes = activeRoute ? [activeRoute, ...alternativeRoutes] : [];

  const handleBack = useCallback(() => {
    setScreen('search');
  }, [setScreen]);

  const handleSelectRoute = (index: number) => {
    setSelectedIndex(index);
    if (allRoutes[index]) {
      setActiveRoute(allRoutes[index]);
    }
  };

  const handleStartNavigation = () => {
    setScreen('navigation');
  };

  return (
    <div className={styles.panel}>
      <RouteHeader
        originName="현위치"
        destinationName={selectedPlace?.title.replace(/<[^>]*>/g, '') ?? '목적지'}
        onBack={handleBack}
      />
      <div className={styles.routeList}>
        {allRoutes.length > 0 ? (
          allRoutes.map((route, i) => (
            <RouteCard
              key={i}
              index={i}
              duration={route.duration}
              distance={route.distance}
              arrivalStr={formatArrivalTime(route.departureTime, route.duration)}
              isSelected={i === selectedIndex}
              onSelect={() => handleSelectRoute(i)}
            />
          ))
        ) : (
          <div className={styles.empty}>
            <p>경로를 검색 중입니다...</p>
          </div>
        )}
      </div>
      {allRoutes.length > 0 && (
        <div className={styles.cta}>
          <button className={styles.startButton} onClick={handleStartNavigation}>
            안내 시작
          </button>
        </div>
      )}
    </div>
  );
}
