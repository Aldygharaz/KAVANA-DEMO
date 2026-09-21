"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Minus, Plus, ShoppingBag, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";
import { WishlistButton } from "@/components/store/wishlist-button";
import { cn } from "@/lib/utils";

interface Props {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  stock: number;
}

/** Kotak aksi: status stok, pemilih jumlah, Add to Cart & Buy Now */
export function ProductActions({ productId, slug, name, price, image, stock }: Props) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);

  const soldOut = stock <= 0;
  const lowStock = stock > 0 && stock <= 5;
  const maxQty = Math.max(1, stock);

  const addToCart = (redirect: boolean) => {
    if (soldOut) return;
    if (redirect) setBuying(true);
    else setAdding(true);

    addItem({ productId, slug, name, price, image, stock }, qty);

    setTimeout(() => {
      setAdding(false);
      setBuying(false);
      if (redirect) {
        toast.success("Siap checkout!", { description: name });
        router.push("/checkout");
      } else {
        toast.success("Ditambahkan ke keranjang", { description: `${name} ×${qty}` });
      }
    }, 350);
  };

  return (
    <div id="product-actions">
      {/* Status stok */}
      <p className="text-sm" aria-live="polite">
        {soldOut ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-destructive">
            <span className="h-2 w-2 rounded-full bg-destructive" /> Habis
          </span>
        ) : lowStock ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-amber-600">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Sisa {stock} — segera checkout!
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Stok: {stock}
          </span>
        )}
      </p>

      {/* Pemilih jumlah */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-sm font-medium">Jumlah</span>
        <div className="inline-flex items-center rounded-full border border-border">
          <button
            type="button"
            aria-label="Kurangi jumlah"
            disabled={soldOut || qty <= 1}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-11 w-11 items-center justify-center rounded-l-full transition-colors hover:bg-accent disabled:opacity-30"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="text"
            inputMode="numeric"
            aria-label="Jumlah produk"
            value={qty}
            onChange={(e) => {
              const v = Number.parseInt(e.target.value, 10);
              if (Number.isNaN(v)) setQty(1);
              else setQty(Math.max(1, Math.min(maxQty, v)));
            }}
            className="h-11 w-12 border-x border-border bg-transparent text-center text-sm font-bold outline-none"
          />
          <button
            type="button"
            aria-label="Tambah jumlah"
            disabled={soldOut || qty >= maxQty}
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            className="flex h-11 w-11 items-center justify-center rounded-r-full transition-colors hover:bg-accent disabled:opacity-30"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {!soldOut && stock <= 10 && (
          <span className="text-xs text-muted-foreground">Maks. {stock}</span>
        )}
      </div>

      {/* Aksi */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={soldOut || adding || buying}
            onClick={() => addToCart(false)}
            className="h-12 rounded-full"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingBag className="h-4 w-4" />
            )}
            {soldOut ? "Stok Habis" : "Tambah ke Keranjang"}
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={soldOut || adding || buying}
            onClick={() => addToCart(true)}
            className={cn("h-12 rounded-full", soldOut && "opacity-50")}
          >
            {buying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Beli Sekarang
          </Button>
        </div>
        <WishlistButton
          variant="page"
          item={{ productId, slug, name, price, image, stock }}
        />
      </div>
    </div>
  );
}
