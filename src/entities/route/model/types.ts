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

export interface NavigationState {
  /** 현재 진행 중인 step 인덱스 */
  currentStepIndex: number;
  /** 다음 maneuver 지점까지 거리 (m) */
  distanceToNextManeuver: number;
  /** 네비게이션 모드 활성화 여부 */
  isNavigating: boolean;
}
