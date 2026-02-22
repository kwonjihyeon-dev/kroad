import type { Coordinate } from '@shared/lib/types';

export const queryKeys = {
  route: (origin: Coordinate, dest: Coordinate) =>
    ['route', origin.lat, origin.lng, dest.lat, dest.lng] as const,

  match: (coordinates: Coordinate[]) =>
    ['match', coordinates.map((c) => `${c.lat},${c.lng}`).join('|')] as const,

  reroute: (current: Coordinate, dest: Coordinate) =>
    ['reroute', current.lat, current.lng, dest.lat, dest.lng] as const,
};
