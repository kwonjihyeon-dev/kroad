import { create } from 'zustand';
import type { Place } from './types';

interface PlaceStore {
  searchQuery: string;
  searchResults: Place[];
  selectedPlace: Place | null;
  isSearching: boolean;

  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Place[]) => void;
  setSelectedPlace: (place: Place | null) => void;
  setIsSearching: (value: boolean) => void;
  clearSearch: () => void;
}

export const usePlaceStore = create<PlaceStore>((set) => ({
  searchQuery: '',
  searchResults: [],
  selectedPlace: null,
  isSearching: false,

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSearchResults: (results) => set({ searchResults: results }),

  setSelectedPlace: (place) => set({ selectedPlace: place }),

  setIsSearching: (value) => set({ isSearching: value }),

  clearSearch: () =>
    set({
      searchQuery: '',
      searchResults: [],
      isSearching: false,
    }),
}));
