// lib/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  admin: any | null;
  token: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setAuth: (admin: any, token: string) => void;
  clearAuth: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false,
      setAuth: (admin, token) => set({ admin, token, isAuthenticated: true }),
      clearAuth: () => set({ admin: null, token: null, isAuthenticated: false }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: 'admin-auth', 
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
