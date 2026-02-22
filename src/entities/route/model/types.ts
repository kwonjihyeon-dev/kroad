import type { Coordinate } from '@shared/lib/types';

export interface RouteResult {
  geometry: Coordinate[];
  duration: number;
  distance: number;
  steps: RouteStep[];
}

export interface RouteStep {
  maneuver: {
    type: string;
    modifier?: string;
    location: Coordinate;
  };
  name: string;
  distance: number;
  duration: number;
}

export interface DeviationState {
  isDeviated: boolean;
  distanceFromRoute: number;
  deviationStartTime: number | null;
  isRerouting: boolean;
}
