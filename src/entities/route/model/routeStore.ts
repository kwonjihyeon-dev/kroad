import { create } from 'zustand';
import type { Coordinate } from '@shared/lib/types';
import type { DeviationState, NavigationState, RouteResult } from './types';

interface RouteStore {
  destination: Coordinate | null;
  activeRoute: RouteResult | null;
  alternativeRoutes: RouteResult[];
  deviation: DeviationState;
  navigation: NavigationState; // 도로 위에서 현재 진행 상태

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
  destination: null,
  activeRoute: null,
  alternativeRoutes: [],
  deviation: initialDeviation,
  navigation: initialNavigation,

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
      destination: null,
      activeRoute: null,
      alternativeRoutes: [],
      deviation: initialDeviation,
      navigation: initialNavigation,
    }),
}));
