"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface RecentlyViewedItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  stock: number;
}

interface RecentlyViewedState {
  items: RecentlyViewedItem[];
  record: (item: RecentlyViewedItem) => void;
  clear: () => void;
}

const MAX_ITEMS = 8;

/** Riwayat produk terakhir dilihat — persist di localStorage "kavana-recent", maksimal 8 item. */
export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      items: [],
      record: (item) => {
        const rest = get().items.filter((i) => i.productId !== item.productId);
        set({ items: [item, ...rest].slice(0, MAX_ITEMS) });
      },
      clear: () => set({ items: [] }),
    }),
    { name: "kavana-recent" }
  )
);
