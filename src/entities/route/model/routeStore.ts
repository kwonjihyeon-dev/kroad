import { create } from 'zustand';
import type { Coordinate } from '@shared/lib/types';
import type { DeviationState, RouteResult } from './types';

interface RouteStore {
  origin: Coordinate | null;
  destination: Coordinate | null;
  activeRoute: RouteResult | null;
  alternativeRoutes: RouteResult[];
  deviation: DeviationState;

  setOrigin: (coord: Coordinate) => void;
  setDestination: (coord: Coordinate) => void;
  setActiveRoute: (route: RouteResult) => void;
  setAlternativeRoutes: (routes: RouteResult[]) => void;
  updateDeviation: (state: Partial<DeviationState>) => void;
  clearRoute: () => void;
}

const initialDeviation: DeviationState = {
  isDeviated: false,
  distanceFromRoute: 0,
  deviationStartTime: null,
  isRerouting: false,
};

export const useRouteStore = create<RouteStore>((set) => ({
  origin: null,
  destination: null,
  activeRoute: null,
  alternativeRoutes: [],
  deviation: initialDeviation,

  setOrigin: (coord) => set({ origin: coord }),

  setDestination: (coord) => set({ destination: coord }),

  setActiveRoute: (route) => set({ activeRoute: route }),

  setAlternativeRoutes: (routes) => set({ alternativeRoutes: routes }),

  updateDeviation: (partial) =>
    set((state) => ({
      deviation: { ...state.deviation, ...partial },
    })),

  clearRoute: () =>
    set({
      origin: null,
      destination: null,
      activeRoute: null,
      alternativeRoutes: [],
      deviation: initialDeviation,
    }),
}));
