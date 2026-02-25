import type { Coordinate } from '@shared/lib/types';

export interface RouteResult {
  geometry: Coordinate[];
  duration: number;
  distance: number;
  steps: RouteStep[];
  /** 경로 탐색 시점의 타임스탬프(ms) — 도착 예정 시각 계산 기준 */
  departureTime: number;
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
