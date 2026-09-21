"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useHydrated } from "@/components/store/use-hydrated";
import { useWishlistStore, type WishlistItem } from "@/lib/wishlist-store";
import { cn } from "@/lib/utils";

interface Props {
  item: WishlistItem;
  variant?: "card" | "page";
}

/** Tombol hati wishlist — dipakai di ProductCard & halaman detail */
export function WishlistButton({ item, variant = "card" }: Props) {
  const hydrated = useHydrated();
  const items = useWishlistStore((s) => s.items);
  const toggle = useWishlistStore((s) => s.toggle);
  const active = hydrated && items.some((i) => i.productId === item.productId);
  const [pulse, setPulse] = useState(false);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nowActive = toggle(item);
    setPulse(true);
    setTimeout(() => setPulse(false), 450);
    toast.success(
      nowActive ? "Ditambahkan ke favorit ❤️" : "Dihapus dari favorit",
      { description: item.name }
    );
  };

  if (variant === "page") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={active ? `Hapus ${item.name} dari favorit` : `Tambahkan ${item.name} ke favorit`}
        className={cn(
          "inline-flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all",
          active
            ? "border-red-500/60 bg-red-500/10 text-red-500"
            : "border-border bg-background text-muted-foreground hover:border-red-400 hover:text-red-500",
          pulse && "scale-110"
        )}
      >
        <Heart className={cn("h-5 w-5 transition-all", active && "fill-red-500")} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? `Hapus ${item.name} dari favorit` : `Tambahkan ${item.name} ke favorit`}
      className={cn(
        "absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-sm backdrop-blur transition-all hover:scale-110",
        pulse && "scale-125"
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          active ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-500"
        )}
      />
    </button>
  );
}

/** Hook kecil untuk animasi masuk saat wishlist page hydrate */
export function useWishlistCount(): number {
  const hydrated = useHydrated();
  const items = useWishlistStore((s) => s.items);
  useEffect(() => {}, [items.length]);
  return hydrated ? items.length : 0;
}
