'use client';

import { useCallback } from 'react';
import { fetchRoute } from '@shared/api/osrm/routeService';
import { decodePolyline, fromOsrmLocation } from '@shared/lib/coordinateUtils';
import type { Coordinate } from '@shared/lib/types';
import type { OsrmRoute } from '@shared/api/osrm/types';
import { useRouteStore } from '@entities/route/model';
import type { RouteResult } from '@entities/route/model';

/**
 * OsrmRoute → RouteResult 변환
 */
function toRouteResult(route: OsrmRoute, departureTime: number): RouteResult {
  return {
    geometry: decodePolyline(route.geometry),
    duration: route.duration,
    distance: route.distance,
    departureTime,
    steps: route.legs.flatMap((leg) =>
      leg.steps.map((step) => ({
        maneuver: {
          type: step.maneuver.type,
          modifier: step.maneuver.modifier,
          location: fromOsrmLocation(step.maneuver.location),
        },
        name: step.name,
        distance: step.distance,
        duration: step.duration,
      })),
    ),
  };
}

/**
 * OSRM 경로 탐색 함수를 반환하는 훅.
 * 유저가 장소를 선택한 시점에 searchRoute를 명시적으로 호출한다.
 */
export function useRouteSearch() {
  const setActiveRoute = useRouteStore((s) => s.setActiveRoute);
  const setAlternativeRoutes = useRouteStore((s) => s.setAlternativeRoutes);

  const searchRoute = useCallback(
    async (origin: Coordinate, destination: Coordinate) => {
      try {
        const response = await fetchRoute(origin, destination);

        if (response.code !== 'Ok' || response.routes.length === 0) return;

        const departureTime = Date.now();
        const [first, ...rest] = response.routes;

        setActiveRoute(toRouteResult(first, departureTime));
        setAlternativeRoutes(rest.map((r) => toRouteResult(r, departureTime)));
      } catch {
        // 네트워크 오류 시 무시 — UI에서 빈 상태로 표시
      }
    },
    [setActiveRoute, setAlternativeRoutes],
  );

  return { searchRoute };
}
