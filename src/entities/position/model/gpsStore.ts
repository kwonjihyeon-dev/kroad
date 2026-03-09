import { create } from 'zustand';
import { GPS_CONFIG } from '@shared/config/gps';
import type { FilteredPosition, GpsPosition } from './types';

interface GpsStore {
  rawPosition: GpsPosition | null;
  filteredPosition: FilteredPosition | null; // 현재 위치갱신
  isTracking: boolean;
  positionHistory: FilteredPosition[]; // 최근 20개 이력 유지

  updateRawPosition: (pos: GpsPosition) => void;
  updateFilteredPosition: (pos: FilteredPosition) => void;
  startTracking: () => void;
  stopTracking: () => void;
}

export const useGpsStore = create<GpsStore>((set) => ({
  rawPosition: null,
  filteredPosition: null,
  isTracking: false,
  positionHistory: [],

  updateRawPosition: (pos) => set({ rawPosition: pos }),

  updateFilteredPosition: (pos) =>
    set((state) => ({
      filteredPosition: pos,
      positionHistory: [...state.positionHistory, pos].slice(-GPS_CONFIG.HISTORY_SIZE),
    })),

  startTracking: () => set({ isTracking: true }),

  stopTracking: () =>
    set({
      isTracking: false,
      rawPosition: null,
      positionHistory: [],
    }),
}));
