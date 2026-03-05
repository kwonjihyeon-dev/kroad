'use client';

import { useEffect } from 'react';
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
 * 출발지·목적지가 모두 존재하면 OSRM 경로 탐색을 실행하고 routeStore에 저장한다.
 */
export function useRouteSearch(origin: Coordinate | null, destination: Coordinate | null) {
  const setActiveRoute = useRouteStore((s) => s.setActiveRoute);
  const setAlternativeRoutes = useRouteStore((s) => s.setAlternativeRoutes);

  useEffect(() => {
    if (!origin || !destination) return;

    let cancelled = false;

    async function search() {
      try {
        const response = await fetchRoute(origin!, destination!);

        if (cancelled || response.code !== 'Ok' || response.routes.length === 0) return;

        const departureTime = Date.now();
        const [first, ...rest] = response.routes;

        setActiveRoute(toRouteResult(first, departureTime));
        setAlternativeRoutes(rest.map((r) => toRouteResult(r, departureTime)));
      } catch {
        // 네트워크 오류 시 무시 — UI에서 빈 상태로 표시
      }
    }

    search();

    return () => {
      cancelled = true;
    };
  }, [origin, destination, setActiveRoute, setAlternativeRoutes]);
}
