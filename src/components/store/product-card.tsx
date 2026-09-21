"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ShoppingBag, Flame, Check } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/cart-store";
import { formatRupiah } from "@/lib/format";
import { StarRating } from "@/components/store/star-rating";
import { WishlistButton } from "@/components/store/wishlist-button";
import type { ProductCardData } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const soldOut = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;
  // Diskon produk: compareAtPrice > price → tampil harga coret + badge -X%
  const hasDiscount =
    product.compareAtPrice != null && product.compareAtPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / (product.compareAtPrice as number)) * 100)
    : 0;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: product.stock,
    });
    setAdded(true);
    toast.success("Ditambahkan ke keranjang", { description: product.name });
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">Tanpa gambar</div>
        )}

        {/* Wishlist heart */}
        <WishlistButton
          item={{
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            image: product.image,
            stock: product.stock,
          }}
        />

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {hasDiscount && (
            <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-white shadow">
              -{discountPct}%
            </span>
          )}
          {lowStock && (
            <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
              Sisa {product.stock}
            </span>
          )}
          {(product.reviewCount ?? 0) >= 5 && (product.avgRating ?? 0) >= 4.5 && (
            <span className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow">
              <Flame className="h-3 w-3" /> Terlaris
            </span>
          )}
        </div>

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
            <span className="rounded-full bg-foreground px-3 py-1 text-xs font-bold text-background">
              Stok Habis
            </span>
          </div>
        )}

        {/* Quick add */}
        <button
          type="button"
          onClick={quickAdd}
          disabled={soldOut}
          aria-label={`Tambah ${product.name} ke keranjang`}
          className={cn(
            "absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-all duration-300",
            "translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100",
            soldOut && "cursor-not-allowed opacity-60",
            added && "translate-y-0 opacity-100"
          )}
        >
          {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {product.categoryName && (
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {product.categoryName}
          </span>
        )}
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</h3>
        <div className="mt-auto space-y-1 pt-1">
          {(product.reviewCount ?? 0) > 0 || (product.soldCount ?? 0) > 0 ? (
            <div className="flex items-center gap-1.5">
              {(product.reviewCount ?? 0) > 0 ? (
                <>
                  <StarRating rating={product.avgRating ?? 0} />
                  <span className="text-[11px] text-muted-foreground">({product.reviewCount})</span>
                </>
              ) : (
                <span className="text-[11px] text-muted-foreground">Belum ada rating</span>
              )}
              {(product.soldCount ?? 0) > 0 && (
                <span className="ml-auto text-[11px] font-medium text-muted-foreground">
                  Terjual {product.soldCount}
                </span>
              )}
            </div>
          ) : (
            <div className="h-[14px]" />
          )}
          <div className="flex items-baseline gap-1.5">
            <p className={cn("text-base font-bold", hasDiscount && "text-destructive")}>
              {formatRupiah(product.price)}
            </p>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {formatRupiah(product.compareAtPrice as number)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
