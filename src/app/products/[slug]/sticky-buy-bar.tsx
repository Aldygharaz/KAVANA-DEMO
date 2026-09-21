"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingBag, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  stock: number;
}

/**
 * Bar beli tempel (mobile only) — muncul saat kotak aksi utama
 * (#product-actions) keluar dari viewport. Tap "Beli" = tambah 1 pcs
 * lalu langsung ke checkout.
 */
export function StickyBuyBar(props: Props) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [visible, setVisible] = useState(false);
  const [buying, setBuying] = useState(false);
  const anchorRef = useRef<HTMLElement | null>(null);

  const soldOut = props.stock <= 0;

  useEffect(() => {
    anchorRef.current = document.getElementById("product-actions");
    if (!anchorRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    observer.observe(anchorRef.current);
    return () => observer.disconnect();
  }, []);

  const buyNow = () => {
    if (soldOut || buying) return;
    setBuying(true);
    addItem(
      {
        productId: props.productId,
        slug: props.slug,
        name: props.name,
        price: props.price,
        image: props.image,
        stock: props.stock,
      },
      1
    );
    setTimeout(() => {
      setBuying(false);
      toast.success("Siap checkout!", { description: props.name });
      router.push("/checkout");
    }, 300);
  };

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-transform duration-300 md:hidden",
        visible ? "translate-y-0" : "translate-y-full"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">{props.name}</p>
          <p className="text-base font-bold leading-tight">{formatRupiah(props.price)}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={soldOut}
          aria-label="Tambah ke keranjang dari bar bawah"
          className="h-11 shrink-0 rounded-full px-4"
          onClick={() => {
            if (soldOut) return;
            addItem(
              {
                productId: props.productId,
                slug: props.slug,
                name: props.name,
                price: props.price,
                image: props.image,
                stock: props.stock,
              },
              1
            );
            toast.success("Ditambahkan ke keranjang", { description: props.name });
          }}
        >
          <ShoppingBag className="size-4" aria-hidden />
          Tambah
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={soldOut || buying}
          className="h-11 shrink-0 rounded-full px-5"
          onClick={buyNow}
        >
          {buying ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Zap className="size-4" aria-hidden />}
          Beli
        </Button>
      </div>
    </div>
  );
}
