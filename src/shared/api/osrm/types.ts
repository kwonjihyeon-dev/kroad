export interface OsrmRouteResponse {
  code: string;
  routes: OsrmRoute[];
  waypoints: OsrmWaypoint[];
}

export interface OsrmRoute {
  geometry: string;
  duration: number;
  distance: number;
  legs: OsrmLeg[];
}

export interface OsrmLeg {
  steps: OsrmStep[];
  duration: number;
  distance: number;
}

export interface OsrmStep {
  maneuver: {
    type: string;
    modifier?: string;
    /** [lng, lat] */
    location: [number, number];
  };
  name: string;
  distance: number;
  duration: number;
}

export interface OsrmWaypoint {
  hint: string;
  distance: number;
  name: string;
  /** [lng, lat] */
  location: [number, number];
}

export interface OsrmMatchResponse {
  code: string;
  matchings: OsrmMatching[];
  tracepoints: (OsrmTracepoint | null)[];
}

export interface OsrmMatching {
  geometry: string;
  duration: number;
  distance: number;
  legs: OsrmLeg[];
}

export interface OsrmTracepoint {
  /** [lng, lat] */
  location: [number, number];
  name: string;
}
