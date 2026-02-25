import { create } from 'zustand';
import { GPS_CONFIG } from '@shared/config/gps';
import type { FilteredPosition, GpsPosition } from './types';

interface GpsStore {
  rawPosition: GpsPosition | null;
  filteredPosition: FilteredPosition | null;
  isTracking: boolean;
  positionHistory: FilteredPosition[];

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
      filteredPosition: null,
      positionHistory: [],
    }),
}));
