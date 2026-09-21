"use client";

import { useEffect, useRef } from "react";
import { useRecentlyViewedStore, type RecentlyViewedItem } from "@/lib/recently-viewed";

/**
 * Tracker passif — dipasang di halaman detail produk (server component).
 * Mencatat produk ke riwayat "Terakhir Dilihat" sekali per mount.
 */
export function RecentlyViewedTracker({ item }: { item: RecentlyViewedItem }) {
  const record = useRecentlyViewedStore((s) => s.record);
  // Guard ketat agar effect tidak jalan dua kali (StrictMode dev)
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    record(item);
  }, [item, record]);

  return null;
}
