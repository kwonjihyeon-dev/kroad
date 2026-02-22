import type { Coordinate } from './types';

/**
 * Coordinate → OSRM URL 파라미터 변환 (lng,lat 순서)
 */
export function toOsrmCoord(coord: Coordinate): string {
  return `${coord.lng},${coord.lat}`;
}

/**
 * 여러 좌표를 OSRM URL 파라미터로 변환
 */
export function toOsrmCoords(coords: Coordinate[]): string {
  return coords.map(toOsrmCoord).join(';');
}

/**
 * OSRM [lng, lat] 배열 → Coordinate 변환
 */
export function fromOsrmLocation(location: [number, number]): Coordinate {
  return { lat: location[1], lng: location[0] };
}

/**
 * Google Encoded Polyline 디코딩
 * @see https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(encoded: string): Coordinate[] {
  const coordinates: Coordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return coordinates;
}

/**
 * 두 좌표 간 거리 (m) — Haversine 공식
 */
export function distanceBetween(a: Coordinate, b: Coordinate): number {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
