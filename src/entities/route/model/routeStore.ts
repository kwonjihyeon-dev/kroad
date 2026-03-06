import { create } from 'zustand';
import type { Coordinate } from '@shared/lib/types';
import type { DeviationState, NavigationState, RouteResult } from './types';

interface RouteStore {
  origin: Coordinate | null;
  destination: Coordinate | null;
  activeRoute: RouteResult | null;
  alternativeRoutes: RouteResult[];
  deviation: DeviationState;
  navigation: NavigationState;

  setOrigin: (coord: Coordinate) => void;
  setDestination: (coord: Coordinate) => void;
  setActiveRoute: (route: RouteResult) => void;
  setAlternativeRoutes: (routes: RouteResult[]) => void;
  updateDeviation: (state: Partial<DeviationState>) => void;
  updateNavigation: (state: Partial<NavigationState>) => void;
  clearRoute: () => void;
}

const initialDeviation: DeviationState = {
  isDeviated: false,
  distanceFromRoute: 0,
  deviationStartTime: null,
  isRerouting: false,
};

const initialNavigation: NavigationState = {
  currentStepIndex: 0,
  distanceToNextManeuver: 0,
  isNavigating: false,
};

export const useRouteStore = create<RouteStore>((set) => ({
  origin: null,
  destination: null,
  activeRoute: null,
  alternativeRoutes: [],
  deviation: initialDeviation,
  navigation: initialNavigation,

  setOrigin: (coord) => set({ origin: coord }),

  setDestination: (coord) => set({ destination: coord }),

  setActiveRoute: (route) => set({ activeRoute: route }),

  setAlternativeRoutes: (routes) => set({ alternativeRoutes: routes }),

  updateDeviation: (partial) =>
    set((state) => ({
      deviation: { ...state.deviation, ...partial },
    })),

  updateNavigation: (partial) =>
    set((state) => ({
      navigation: { ...state.navigation, ...partial },
    })),

  clearRoute: () =>
    set({
      origin: null,
      destination: null,
      activeRoute: null,
      alternativeRoutes: [],
      deviation: initialDeviation,
      navigation: initialNavigation,
    }),
}));
