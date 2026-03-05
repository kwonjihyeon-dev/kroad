'use client';

import { useCallback } from 'react';
import { MAP_CONFIG } from '@shared/config/map';
import { useRouteStore } from '@entities/route/model';
import { RoutePolyline } from '@entities/route/ui';

/**
 * 활성 경로 + 대안 경로 폴리라인을 지도 위에 렌더링한다.
 * 대안 경로를 클릭하면 활성 경로와 교체한다.
 */
export function RouteAlternatives() {
  const activeRoute = useRouteStore((s) => s.activeRoute);
  const alternativeRoutes = useRouteStore((s) => s.alternativeRoutes);
  const setActiveRoute = useRouteStore((s) => s.setActiveRoute);
  const setAlternativeRoutes = useRouteStore((s) => s.setAlternativeRoutes);

  const handleAlternativeClick = useCallback(
    (index: number) => {
      if (!activeRoute) return;

      const clicked = alternativeRoutes[index];
      const newAlternatives = [...alternativeRoutes];
      newAlternatives[index] = activeRoute;

      setActiveRoute(clicked);
      setAlternativeRoutes(newAlternatives);
    },
    [activeRoute, alternativeRoutes, setActiveRoute, setAlternativeRoutes],
  );

  return (
    <>
      {alternativeRoutes.map((route, i) => (
        <RoutePolyline
          key={`alt-${i}`}
          path={route.geometry}
          color={MAP_CONFIG.ALT_POLYLINE_COLOR}
          width={MAP_CONFIG.POLYLINE_WIDTH}
          opacity={0.6}
          zIndex={1}
          onClick={() => handleAlternativeClick(i)}
        />
    ))}
      {activeRoute && (
        <RoutePolyline
          path={activeRoute.geometry}
          color={MAP_CONFIG.POLYLINE_COLOR}
          width={MAP_CONFIG.POLYLINE_WIDTH}
          opacity={1}
          zIndex={10}
        />
      )}
    </>
  );
}
