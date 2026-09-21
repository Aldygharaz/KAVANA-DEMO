"use client";

import { create } from "zustand";
import type { AuthUser } from "@/lib/types";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: AuthUser | null) => void;
  refresh: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
}

let activeFetch: Promise<AuthUser | null> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user) => {
    set({ user, loading: false, initialized: true });
  },

  refresh: async () => {
    if (activeFetch) {
      return activeFetch;
    }

    activeFetch = (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });
        const data = res.ok ? await res.json() : null;
        const user = (data?.user as AuthUser) ?? null;
        set({ user, loading: false, initialized: true });
        return user;
      } catch {
        set({ user: null, loading: false, initialized: true });
        return null;
      } finally {
        activeFetch = null;
      }
    })();

    return activeFetch;
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore network issue on logout */
    } finally {
      set({ user: null, loading: false, initialized: true });
    }
  },
}));
