import { osrmApi } from '@shared/api/http';
import { toOsrmCoord } from '@shared/lib/coordinateUtils';
import type { Coordinate } from '@shared/lib/types';
import type { OsrmRouteResponse } from './types';

/**
 * 출발지 → 목적지 경로를 OSRM Route API로 탐색한다.
 * @param origin - 출발 좌표
 * @param destination - 도착 좌표
 */
export async function fetchRoute(
  origin: Coordinate,
  destination: Coordinate,
): Promise<OsrmRouteResponse> {
  const coords = `${toOsrmCoord(origin)};${toOsrmCoord(destination)}`;

  return osrmApi.get<OsrmRouteResponse>(
    `/route/v1/driving/${coords}?overview=full&geometries=polyline&alternatives=true&steps=true`,
  );
}
