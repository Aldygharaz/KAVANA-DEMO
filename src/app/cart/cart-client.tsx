"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/components/store/use-hydrated";
import { CheckoutSteps } from "@/components/store/checkout-steps";
import { useCartStore, cartSubtotal, cartHasStockIssue, cartCount } from "@/lib/cart-store";
import { formatRupiah, calcShipping, FREE_SHIPPING_THRESHOLD } from "@/lib/format";

export default function CartClient() {
  const lines = useCartStore((s) => s.lines);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  // Tunggu rehidrasi zustand dari localStorage agar tidak hydration mismatch
  const mounted = useHydrated();

  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-48" />
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const subtotal = cartSubtotal(lines);
  const shipping = calcShipping(subtotal);
  const total = subtotal + shipping;
  const hasIssue = cartHasStockIssue(lines);
  const count = cartCount(lines);

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Keranjang</h1>
        <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <ShoppingBag className="h-7 w-7 text-muted-foreground" />
          </span>
          <p className="text-lg font-semibold">Keranjangmu masih kosong</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Yuk mulai belanja koleksi KAVANA — dari apparel sampai perlengkapan rumah.
          </p>
          <Button asChild size="lg" className="mt-2 rounded-full">
            <Link href="/products">
              Lanjut Belanja <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Keranjang <span className="text-base font-medium text-muted-foreground">({count} item)</span>
        </h1>
        <CheckoutSteps current={0} />
      </div>
      <Button asChild variant="ghost" className="mt-2 rounded-full">
        <Link href="/products">Lanjut Belanja</Link>
      </Button>

      {subtotal < FREE_SHIPPING_THRESHOLD && (
        <p className="mt-3 rounded-lg bg-secondary px-4 py-2.5 text-sm">
          Belanja <span className="font-bold text-primary">{formatRupiah(remaining)}</span> lagi untuk{" "}
          <span className="font-bold text-primary">gratis ongkir!</span>
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Daftar item */}
        <ul className="space-y-4 lg:col-span-2">
          {lines.map((l) => {
            const overStock = l.quantity > l.stock || l.stock <= 0;
            return (
              <li key={l.productId}>
                <Card className="overflow-hidden">
                  <CardContent className="flex gap-4 p-4">
                    <Link
                      href={`/products/${l.slug}`}
                      className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary sm:h-24 sm:w-24"
                      aria-label={`Lihat ${l.name}`}
                    >
                      {l.image && (
                        <Image src={l.image} alt={l.name} fill sizes="96px" className="object-cover" />
                      )}
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${l.slug}`}
                          className="line-clamp-2 text-sm font-semibold leading-snug transition-colors hover:text-primary sm:text-base"
                        >
                          {l.name}
                        </Link>
                        <button
                          type="button"
                          aria-label={`Hapus ${l.name} dari keranjang`}
                          onClick={() => removeItem(l.productId)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="mt-0.5 text-sm font-semibold text-primary">{formatRupiah(l.price)}</p>

                      {overStock && (
                        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-destructive" role="alert">
                          <TriangleAlert className="h-3.5 w-3.5" />
                          {l.stock <= 0 ? "Stok habis — hapus item ini" : `Stok tinggal ${l.stock}`}
                        </p>
                      )}

                      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                        <div className="inline-flex items-center rounded-full border border-border">
                          <button
                            type="button"
                            aria-label="Kurangi jumlah"
                            disabled={l.quantity <= 1}
                            onClick={() => updateQuantity(l.productId, l.quantity - 1)}
                            className="flex h-10 w-10 items-center justify-center rounded-l-full transition-colors hover:bg-accent disabled:opacity-30"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-10 text-center text-sm font-bold" aria-live="polite">
                            {l.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Tambah jumlah"
                            disabled={l.quantity >= l.stock}
                            onClick={() => updateQuantity(l.productId, l.quantity + 1)}
                            className="flex h-10 w-10 items-center justify-center rounded-r-full transition-colors hover:bg-accent disabled:opacity-30"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm font-bold sm:text-base">
                          {formatRupiah(l.price * l.quantity)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>

        {/* Ringkasan */}
        <div>
          <Card className="lg:sticky lg:top-36">
            <CardContent className="space-y-4 p-6">
              <h2 className="text-lg font-bold">Ringkasan Belanja</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal ({count} item)</span>
                  <span className="font-semibold">{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estimasi ongkir</span>
                  <span className="font-semibold">
                    {shipping === 0 ? (
                      <span className="text-emerald-600">GRATIS</span>
                    ) : (
                      formatRupiah(shipping)
                    )}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-bold">Total</span>
                <span className="text-xl font-extrabold text-primary">{formatRupiah(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Ongkir flat {formatRupiah(25_000)}, gratis untuk subtotal ≥{" "}
                {formatRupiah(FREE_SHIPPING_THRESHOLD)}. Stok divalidasi ulang saat checkout.
              </p>

              {hasIssue && (
                <p
                  className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2.5 text-xs font-medium text-destructive"
                  role="alert"
                >
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  Ada item yang melebihi stok tersedia. Sesuaikan jumlah atau hapus item sebelum
                  checkout.
                </p>
              )}

              <Button asChild size="lg" className="h-12 w-full rounded-full" disabled={hasIssue}>
                <Link href="/checkout">
                  Lanjut ke Checkout <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
