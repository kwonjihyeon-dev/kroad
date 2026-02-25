import { osrmApi } from '@shared/api/http';
import { toOsrmCoords } from '@shared/lib/coordinateUtils';
import type { Coordinate } from '@shared/lib/types';

import type { OsrmMatchResponse } from './types';

/**
 * GPS 좌표 배열을 OSRM Match API로 도로 스냅한다.
 * @param coordinates - GPS 수집 좌표 배열
 * @param timestamps - 각 좌표의 수집 시각 (Unix초)
 */
export async function matchCoordinates(
  coordinates: Coordinate[],
  timestamps: number[],
): Promise<OsrmMatchResponse> {
  const coords = toOsrmCoords(coordinates);
  const radiuses = coordinates.map(() => '20').join(';');
  const times = timestamps.join(';');

  return osrmApi.get<OsrmMatchResponse>(
    `/match/v1/driving/${coords}?overview=full&geometries=polyline&radiuses=${radiuses}&timestamps=${times}`,
  );
}
