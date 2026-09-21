"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  stock: number;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  addItem: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clear: () => void;
  refreshStock: (updates: { productId: string; stock: number; price: number }[]) => void;
}

/**
 * Cart persisten di localStorage (zustand persist) — survive refresh (FR-2).
 * Stok disimpan sebagai snapshot untuk validasi cepat di klien; server
 * selalu melakukan validasi ulang saat checkout (FR-3).
 */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      addItem: (line, qty = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.productId === line.productId);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.productId === line.productId
                  ? { ...l, ...line, quantity: Math.min(l.quantity + qty, Math.max(l.stock, 1)) }
                  : l
              ),
            };
          }
          return { lines: [...state.lines, { ...line, quantity: Math.min(qty, Math.max(line.stock, 1)) }] };
        }),
      removeItem: (productId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.productId !== productId) })),
      updateQuantity: (productId, qty) =>
        set((state) => ({
          lines: state.lines.map((l) =>
            l.productId === productId
              ? { ...l, quantity: Math.max(1, Math.min(qty, Math.max(l.stock, 1))) }
              : l
          ),
        })),
      clear: () => set({ lines: [] }),
      refreshStock: (updates) =>
        set((state) => ({
          lines: state.lines.map((l) => {
            const u = updates.find((x) => x.productId === l.productId);
            if (!u) return l;
            return {
              ...l,
              stock: u.stock,
              price: u.price,
              quantity: Math.min(l.quantity, Math.max(u.stock, 1)),
            };
          }),
        })),
    }),
    { name: "kavana-cart" }
  )
);

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

export function cartHasStockIssue(lines: CartLine[]): boolean {
  return lines.some((l) => l.quantity > l.stock || l.stock <= 0);
}
