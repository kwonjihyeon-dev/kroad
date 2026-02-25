import { create } from 'zustand';

interface MapStore {
  mapInstance: naver.maps.Map | null;
  setMapInstance: (map: naver.maps.Map) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  mapInstance: null,
  setMapInstance: (map) => set({ mapInstance: map }),
}));
