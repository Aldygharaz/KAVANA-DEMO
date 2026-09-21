"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore, cartSubtotal, cartHasStockIssue, cartCount } from "@/lib/cart-store";
import { formatRupiah, calcShipping, FREE_SHIPPING_THRESHOLD } from "@/lib/format";
import { useHydrated } from "@/components/store/use-hydrated";

export function CartSheet() {
  const lines = useCartStore((s) => s.lines);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const count = cartCount(lines);
  const subtotal = cartSubtotal(lines);
  const hasIssue = cartHasStockIssue(lines);
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  // Gate Radix Sheet di belakang flag hidrasi (hindari hydration mismatch aria-controls)
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full" aria-hidden>
        <ShoppingBag className="h-5 w-5" />
      </span>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={`Buka keranjang, ${count} item`}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent"
        >
          <ShoppingBag className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" /> Keranjang
            <span className="text-sm font-normal text-muted-foreground">({count} item)</span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Daftar produk di keranjang belanjamu beserta pengaturan jumlah dan ringkasan total.
          </SheetDescription>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <ShoppingBag className="h-7 w-7 text-muted-foreground" />
            </span>
            <p className="font-medium">Keranjangmu masih kosong</p>
            <p className="text-sm text-muted-foreground">Yuk mulai belanja koleksi KAVANA.</p>
            <SheetTrigger asChild>
              <Button asChild className="mt-2 rounded-full">
                <Link href="/products">Jelajahi Produk</Link>
              </Button>
            </SheetTrigger>
          </div>
        ) : (
          <>
            {subtotal < FREE_SHIPPING_THRESHOLD && (
              <div className="border-b border-border bg-secondary/60 px-4 py-2.5 text-xs">
                <p className="font-medium">
                  Belanja <span className="text-primary">{formatRupiah(remaining)}</span> lagi untuk{" "}
                  <span className="text-primary">gratis ongkir!</span>
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-4 py-3">
              <ul className="space-y-4">
                {lines.map((l) => {
                  const overStock = l.quantity > l.stock || l.stock <= 0;
                  return (
                    <li key={l.productId} className="flex gap-3">
                      <Link
                        href={`/products/${l.slug}`}
                        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary"
                      >
                        {l.image && (
                          <Image src={l.image} alt={l.name} fill className="object-cover" sizes="64px" />
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-sm font-medium leading-snug">{l.name}</p>
                          <button
                            type="button"
                            aria-label={`Hapus ${l.name} dari keranjang`}
                            onClick={() => removeItem(l.productId)}
                            className="text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-0.5 text-sm font-semibold text-primary">{formatRupiah(l.price)}</p>
                        {overStock && (
                          <p className="mt-0.5 text-xs font-medium text-destructive">
                            {l.stock <= 0 ? "Stok habis" : `Stok tersisa ${l.stock}`}
                          </p>
                        )}
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="inline-flex items-center rounded-full border border-border">
                            <button
                              type="button"
                              aria-label="Kurangi jumlah"
                              disabled={l.quantity <= 1}
                              onClick={() => updateQuantity(l.productId, l.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-l-full disabled:opacity-30 hover:bg-accent"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-xs font-semibold">{l.quantity}</span>
                            <button
                              type="button"
                              aria-label="Tambah jumlah"
                              disabled={l.quantity >= l.stock}
                              onClick={() => updateQuantity(l.productId, l.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-r-full disabled:opacity-30 hover:bg-accent"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <SheetFooter className="border-t border-border">
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-base font-bold">{formatRupiah(subtotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ongkir dihitung di halaman checkout (gratis ≥ {formatRupiah(FREE_SHIPPING_THRESHOLD)}).
                </p>
                {hasIssue && (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                    Ada item yang melebihi stok. Sesuaikan jumlah sebelum checkout.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <SheetTrigger asChild>
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href="/cart">Lihat Cart</Link>
                    </Button>
                  </SheetTrigger>
                  <SheetTrigger asChild>
                    <Button asChild className="rounded-full" disabled={hasIssue}>
                      <Link href="/checkout">
                        Checkout <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </SheetTrigger>
                </div>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
