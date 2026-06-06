import { create } from 'zustand';

interface AppState {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  // We can add auction-specific states later, like active filters
  filters: {
    make: string | null;
    model: string | null;
    maxPrice: number | null;
  };
  setFilter: (key: keyof AppState['filters'], value: any) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isMobileMenuOpen: false,
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  filters: {
    make: null,
    model: null,
    maxPrice: null,
  },
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
}));
