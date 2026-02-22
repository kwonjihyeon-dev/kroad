import type { Coordinate } from '@shared/lib/types';

export type { Coordinate };

export interface GpsPosition extends Coordinate {
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface FilteredPosition extends Coordinate {
  raw: GpsPosition;
  isSnapped: boolean;
}
