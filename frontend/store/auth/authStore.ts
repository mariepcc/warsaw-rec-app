import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { email: string } | null;
  setAuthenticated: (value: boolean) => void;
  setUser: (user: { email: string } | null) => void;
  setLoading: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setUser: (user) => set({ user }),
  setLoading: (value) => set({ isLoading: value }),
}));
