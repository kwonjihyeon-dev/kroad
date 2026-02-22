import { create } from 'zustand';

interface UiStore {
  isSearchPanelOpen: boolean;
  isNavigating: boolean;
  isLoading: boolean;
  error: string | null;

  toggleSearchPanel: () => void;
  setNavigating: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  isSearchPanelOpen: false,
  isNavigating: false,
  isLoading: false,
  error: null,

  toggleSearchPanel: () => set((state) => ({ isSearchPanelOpen: !state.isSearchPanelOpen })),

  setNavigating: (value) => set({ isNavigating: value }),

  setLoading: (value) => set({ isLoading: value }),

  setError: (error) => set({ error }),
}));
