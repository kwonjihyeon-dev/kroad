import { create } from 'zustand';

/** 앱 화면 상태 */
export type AppScreen = 'home' | 'search' | 'route' | 'navigation';

interface UiStore {
  currentScreen: AppScreen;
  isLoading: boolean;
  error: string | null;

  setScreen: (screen: AppScreen) => void;
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  currentScreen: 'home',
  isLoading: false,
  error: null,

  setScreen: (screen) => set({ currentScreen: screen }),

  setLoading: (value) => set({ isLoading: value }),

  setError: (error) => set({ error }),
}));
