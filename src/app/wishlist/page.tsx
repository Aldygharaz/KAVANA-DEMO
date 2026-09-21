"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/components/store/use-hydrated";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useCartStore } from "@/lib/cart-store";
import { formatRupiah } from "@/lib/format";

export default function WishlistPage() {
  const hydrated = useHydrated();
  const items = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.remove);
  const clear = useWishlistStore((s) => s.clear);
  const addItem = useCartStore((s) => s.addItem);

  const addToCart = (item: (typeof items)[number]) => {
    addItem({
      productId: item.productId,
      slug: item.slug,
      name: item.name,
      price: item.price,
      image: item.image,
      stock: item.stock,
    });
    toast.success("Ditambahkan ke keranjang", { description: item.name });
  };

  const addAll = () => {
    let added = 0;
    for (const item of items) {
      if (item.stock > 0) {
        addItem({
          productId: item.productId,
          slug: item.slug,
          name: item.name,
          price: item.price,
          image: item.image,
          stock: item.stock,
        });
        added++;
      }
    }
    if (added === 0) {
      toast.warning("Semua produk favorit yang tersimpan sedang habis stok.");
    } else {
      toast.success(`${added} produk dimasukkan ke keranjang`);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">Beranda</Link>
        <span className="mx-1.5">/</span>
        <span className="font-medium text-foreground">Favorit</span>
      </nav>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            <Heart className="h-6 w-6 fill-red-500 text-red-500" /> Favorit Saya
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {hydrated
              ? items.length > 0
                ? `${items.length} produk tersimpan di perangkat ini`
                : "Simpan produk yang kamu suka dengan menekan ikon hati."
              : "Memuat…"}
          </p>
        </div>
        {hydrated && items.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-full" onClick={addAll}>
              <ShoppingBag className="mr-1 h-4 w-4" /> Masukkan Semua ke Cart
            </Button>
            <Button
              variant="ghost"
              className="rounded-full text-destructive hover:text-destructive"
              onClick={() => {
                clear();
                toast.info("Daftar favorit dibersihkan.");
              }}
            >
              Bersihkan
            </Button>
          </div>
        )}
      </div>

      {!hydrated ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <Heart className="h-7 w-7 text-muted-foreground" />
          </span>
          <p className="text-lg font-semibold">Belum ada produk favorit</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tekan ikon hati di kartu produk untuk menyimpannya di sini.
          </p>
          <Button asChild className="mt-2 rounded-full">
            <Link href="/products">
              <ArrowLeft className="mr-1 h-4 w-4" /> Jelajahi Produk
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.productId}
              className="flex gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <Link
                href={`/products/${item.slug}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary"
              >
                {item.image && (
                  <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  href={`/products/${item.slug}`}
                  className="line-clamp-2 text-sm font-medium leading-snug transition-colors hover:text-primary"
                >
                  {item.name}
                </Link>
                <p className="mt-1 text-sm font-bold text-primary">{formatRupiah(item.price)}</p>
                {item.stock <= 0 ? (
                  <p className="mt-0.5 text-xs font-medium text-destructive">Stok habis</p>
                ) : item.stock <= 5 ? (
                  <p className="mt-0.5 text-xs font-medium text-amber-600">Sisa {item.stock} — buruan!</p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted-foreground">Stok tersedia</p>
                )}
                <div className="mt-auto flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    className="h-8 rounded-full px-3 text-xs"
                    disabled={item.stock <= 0}
                    onClick={() => addToCart(item)}
                  >
                    <ShoppingBag className="mr-1 h-3.5 w-3.5" /> + Cart
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 rounded-full px-2 text-xs text-muted-foreground hover:text-destructive"
                    aria-label={`Hapus ${item.name} dari favorit`}
                    onClick={() => {
                      remove(item.productId);
                      toast.info("Dihapus dari favorit", { description: item.name });
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
