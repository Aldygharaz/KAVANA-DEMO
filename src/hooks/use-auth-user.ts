"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

/**
 * Hook autentikasi global untuk KAVANA storefront & admin.
 * Membaca single source of truth dari useAuthStore agar seluruh komponen
 * (Navbar, Admin, Checkout, dsb.) tersinkronisasi instan tanpa loop render.
 */
export function useAuthUser() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const initialized = useAuthStore((s) => s.initialized);
  const refresh = useAuthStore((s) => s.refresh);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const pathname = usePathname();

  useEffect(() => {
    if (!initialized) {
      refresh();
    }
  }, [initialized, refresh]);

  return { user, loading, refresh, setUser, logout };
}

