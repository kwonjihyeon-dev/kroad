export const ROUTE_CONFIG = {
  /** 이탈 판정 거리 (m) */
  DEVIATION_THRESHOLD: 50,
  /** 이탈 지속 시간 (ms) */
  DEVIATION_TIME_THRESHOLD: 5000,
  /** 재탐색 최소 간격 (ms) */
  REROUTE_DEBOUNCE: 10000,
  MAX_ALTERNATIVES: 3,
  SNAP_RADIUS: 20,
} as const;
