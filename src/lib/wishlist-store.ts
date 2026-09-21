"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  stock: number;
}

interface WishlistState {
  items: WishlistItem[];
  toggle: (item: WishlistItem) => boolean; // returns true jika sekarang ter-favorit
  isWishlisted: (productId: string) => boolean;
  remove: (productId: string) => void;
  clear: () => void;
}

/** Wishlist/favorit perangkat — persist di localStorage "kavana-wishlist" */
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) => {
        const exists = get().items.some((i) => i.productId === item.productId);
        if (exists) {
          set((s) => ({ items: s.items.filter((i) => i.productId !== item.productId) }));
          return false;
        }
        set((s) => ({ items: [item, ...s.items].slice(0, 100) }));
        return true;
      },
      isWishlisted: (productId) => get().items.some((i) => i.productId === productId),
      remove: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
    }),
    { name: "kavana-wishlist" }
  )
);
