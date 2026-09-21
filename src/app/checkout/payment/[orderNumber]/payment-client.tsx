"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthUser } from "@/hooks/use-auth-user";
import { CheckoutSteps } from "@/components/store/checkout-steps";
import { formatRupiah } from "@/lib/format";
import { PAYMENT_METHODS, type OrderData } from "@/components/store/storefront-types";
import { cn } from "@/lib/utils";

const METHOD_ICONS = {
  VA_BCA: Banknote,
  VA_MANDIRI: Wallet,
  EWALLET: Smartphone,
  CARD: CreditCard,
} as const;

export default function PaymentClient({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthUser();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<string>("VA_BCA");
  const [processing, setProcessing] = useState(false);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}`);
      const data = r.ok ? await r.json() : await r.json().catch(() => null);
      if (!r.ok) {
        setError(data?.error ?? "Pesanan tidak ditemukan.");
        return;
      }
      setOrder(data.order ?? null);
    } catch {
      setError("Gagal memuat pesanan. Periksa koneksi kamu.");
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Silakan login terlebih dahulu.");
      router.replace(`/login?next=/checkout/payment/${orderNumber}`);
    }
  }, [authLoading, user, router, orderNumber]);

  useEffect(() => {
    if (user) loadOrder();
  }, [user, loadOrder]);

  // Sudah dibayar / diproses → langsung ke halaman detail
  useEffect(() => {
    if (order && order.status !== "PENDING") {
      toast.info(order.status === "CANCELLED" ? "Pesanan ini sudah dibatalkan." : "Pesanan ini sudah dibayar.");
      router.replace(`/orders/${order.id}`);
    }
  }, [order, router]);

  const pay = async () => {
    if (!order || processing) return;
    setProcessing(true);
    // Simulasi gateway: tunda 1.5 detik dengan animasi loading
    await new Promise((res) => setTimeout(res, 1500));
    try {
      const r = await fetch("/api/payment/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: order.orderNumber, paymentMethod: method }),
      });
      const data = r.ok ? await r.json() : await r.json().catch(() => null);
      if (!r.ok) {
        toast.error(data?.error ?? "Pembayaran gagal. Coba lagi.");
        if (r.status === 409) await loadOrder(); // stok berubah → muat ulang status
        return;
      }
      toast.success("Pembayaran berhasil!", { description: `Ref: ${data?.order?.paymentRef ?? "-"}` });
      router.push(`/orders/${order.id}?success=1`);
    } catch {
      toast.error("Gagal menghubungi server pembayaran. Coba lagi.");
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading || !user || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-48" />
        <div className="mt-8 grid gap-6 md:grid-cols-5">
          <Skeleton className="h-80 rounded-xl md:col-span-3" />
          <Skeleton className="h-80 rounded-xl md:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-lg font-semibold text-destructive">{error ?? "Pesanan tidak ditemukan."}</p>
        <div className="mt-4 flex justify-center gap-3">
          <Button variant="outline" onClick={loadOrder} className="rounded-full">
            Coba Lagi
          </Button>
          <Button asChild className="rounded-full">
            <Link href="/orders">Lihat Pesanan Saya</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 rounded-full">
        <Link href={`/orders/${order.id}`}>
          <ArrowLeft className="h-4 w-4" /> Kembali ke detail pesanan
        </Link>
      </Button>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Pembayaran</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
            Pesanan <span className="font-semibold text-foreground">{order.orderNumber}</span>
            · Selesaikan pembayaran untuk memproses pesananmu.
          </p>
        </div>
        <CheckoutSteps current={2} />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-5">
        {/* Pilih metode */}
        <Card className="md:col-span-3">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold">Pilih Metode Pembayaran</h2>
            <div role="radiogroup" aria-label="Metode pembayaran" className="mt-4 space-y-3">
              {PAYMENT_METHODS.map((m) => {
                const Icon = METHOD_ICONS[m.value];
                const selected = method === m.value;
                return (
                  <label
                    key={m.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all",
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-accent/50"
                    )}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={m.value}
                      checked={selected}
                      onChange={() => setMethod(m.value)}
                      className="sr-only"
                    />
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                        selected ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{m.label}</span>
                      <span className="block text-xs text-muted-foreground">{m.desc}</span>
                    </span>
                    {selected && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
                  </label>
                );
              })}
            </div>

            <Button
              type="button"
              size="lg"
              className="mt-6 h-12 w-full rounded-full"
              onClick={pay}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Memproses pembayaran…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Bayar Sekarang · {formatRupiah(order.total)}
                </>
              )}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Mock gateway — tidak ada transaksi nyata yang diproses.
            </p>
          </CardContent>
        </Card>

        {/* Ringkasan order */}
        <div className="md:col-span-2">
          <Card className="md:sticky md:top-36">
            <CardContent className="p-6">
              <h2 className="font-bold">Ringkasan Pesanan</h2>
              <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin]">
                {order.items.map((it) => (
                  <li key={it.id} className="flex items-center gap-3">
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                      {it.image && (
                        <Image src={it.image} alt={it.name} fill sizes="48px" className="object-cover" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium">{it.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {it.quantity} × {formatRupiah(it.price)}
                      </p>
                    </div>
                    <p className="text-sm font-bold">{formatRupiah(it.price * it.quantity)}</p>
                  </li>
                ))}
              </ul>
              <Separator className="my-4" />
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{formatRupiah(order.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ongkir</span>
                  <span className="font-semibold">
                    {order.shippingCost === 0 ? (
                      <span className="text-emerald-600">GRATIS</span>
                    ) : (
                      formatRupiah(order.shippingCost)
                    )}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      Diskon voucher
                      {order.promoCode && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold tracking-wide text-secondary-foreground">
                          {order.promoCode}
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-emerald-600">−{formatRupiah(order.discount)}</span>
                  </div>
                )}
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <span className="font-bold">Total Bayar</span>
                <span className="text-xl font-extrabold text-primary">{formatRupiah(order.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
