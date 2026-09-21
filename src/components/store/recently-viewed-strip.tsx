"use client";

import Image from "next/image";
import Link from "next/link";
import { History } from "lucide-react";
import { useRecentlyViewedStore } from "@/lib/recently-viewed";
import { useHydrated } from "@/components/store/use-hydrated";
import { formatRupiah } from "@/lib/format";

/** Strip horizontal "Terakhir Dilihat" — hanya render bila ada riwayat (perangkat ini). */
export function RecentlyViewedStrip() {
  const hydrated = useHydrated();
  const items = useRecentlyViewedStore((s) => s.items);

  if (!hydrated || items.length === 0) return null;

  return (
    <section aria-label="Produk terakhir dilihat" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold tracking-tight sm:text-xl">Terakhir Dilihat</h2>
      </div>

      <ul className="scrollbar-thin -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:mx-0 sm:px-0">
        {items.map((item) => (
          <li key={item.productId} className="w-36 shrink-0 snap-start sm:w-40">
            <Link
              href={`/products/${item.slug}`}
              className="group block overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="relative block aspect-square overflow-hidden bg-secondary">
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="160px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
              </span>
              <span className="block p-2.5">
                <span className="line-clamp-2 min-h-[2.2rem] text-xs font-medium leading-snug transition-colors group-hover:text-primary">
                  {item.name}
                </span>
                <span className="mt-1 block text-xs font-bold text-primary">{formatRupiah(item.price)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
