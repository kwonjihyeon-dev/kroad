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
 * GPS 위치가 없을 때 Geolocation API로 현재 위치를 1회 조회한다.
 */
function getCurrentPosition(): Promise<Coordinate> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 5000 },
    );
  });
}

/**
 * 출발지·목적지가 모두 존재하면 OSRM 경로 탐색을 실행하고 routeStore에 저장한다.
 * origin이 없으면 Geolocation API로 현재 위치를 1회 조회하여 출발지로 사용한다.
 */
export function useRouteSearch(origin: Coordinate | null, destination: Coordinate | null) {
  const setActiveRoute = useRouteStore((s) => s.setActiveRoute);
  const setAlternativeRoutes = useRouteStore((s) => s.setAlternativeRoutes);

  useEffect(() => {
    if (!destination) return;

    let cancelled = false;

    async function search() {
      try {
        const start = origin ?? (await getCurrentPosition());

        if (cancelled) return;

        const response = await fetchRoute(start, destination!);

        if (cancelled || response.code !== 'Ok' || response.routes.length === 0) return;

        const departureTime = Date.now();
        const [first, ...rest] = response.routes;

        setActiveRoute(toRouteResult(first, departureTime));
        setAlternativeRoutes(rest.map((r) => toRouteResult(r, departureTime)));
      } catch {
        // 네트워크 오류 또는 위치 조회 실패 시 무시 — UI에서 빈 상태로 표시
      }
    }

    search();

    return () => {
      cancelled = true;
    };
  }, [origin, destination, setActiveRoute, setAlternativeRoutes]);
}
