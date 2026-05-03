import { create } from "zustand";
import { authApi } from "../services/api";

type User = { userId: string; email: string };

type AuthState = {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  checkSession: () => Promise<void>;
  login: (email: string) => Promise<void>;
  verify: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  checkSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await authApi.me();
      set({ user, isLoading: false, isInitialized: true });
    } catch {
      set({ user: null, isLoading: false, isInitialized: true });
    }
  },

  login: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.sendCode(email);
      set({ isLoading: false });
    } catch (err: unknown) {
      set({ isLoading: false, error: err instanceof Error ? err.message : String(err) });
    }
  },

  verify: async (email, code) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authApi.verify(email, code);
      set({ user, isLoading: false });
    } catch (err: unknown) {
      set({ isLoading: false, error: err instanceof Error ? err.message : String(err) });
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {}
    set({ user: null, error: null });
  },
}));
