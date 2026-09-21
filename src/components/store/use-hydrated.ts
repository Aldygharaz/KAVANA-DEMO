"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * Deteksi rehidrasi (client-only render) tanpa setState di effect.
 * false saat SSR/hydration, true setelah hidrasi selesai di klien.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
