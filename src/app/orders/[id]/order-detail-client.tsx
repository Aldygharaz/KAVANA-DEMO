"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import {
  Ban,
  Check,
  ChevronLeft,
  Circle,
  Clock,
  Copy,
  CreditCard,
  Loader2,
  MapPin,
  PartyPopper,
  PackageCheck,
  Truck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthUser } from "@/hooks/use-auth-user";
import { formatRupiah, formatDate } from "@/lib/format";
import { ORDER_STATUS_STEPS, type OrderStatus } from "@/lib/types";
import {
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  type OrderData,
} from "@/components/store/storefront-types";
import { OrderStatusBadge } from "@/components/store/order-status-badge";
import { cn } from "@/lib/utils";

const STEP_ICONS = [Clock, Wallet, Truck, PackageCheck] as const;

/** Ledakan confetti hangat sesuai palet KAVANA (dipanggil saat pembayaran sukses) */
function fireSuccessConfetti() {
  const colors = ["#8b5e3c", "#c98a3d", "#a8574e", "#7d8c58", "#e8c39e"];
  const defaults = { origin: { y: 0.7 }, colors, zIndex: 60 } as const;
  confetti({ ...defaults, particleCount: 80, spread: 70 });
  setTimeout(() => confetti({ ...defaults, particleCount: 50, angle: 60, spread: 60 }), 250);
  setTimeout(() => confetti({ ...defaults, particleCount: 50, angle: 120, spread: 60 }), 400);
}

/** Estimasi tanggal tiba: H+2 s.d. H+4 dari tanggal order (hari kerja sederhana) */
function deliveryEstimate(createdAtIso: string): { from: string; to: string } | null {
  const created = new Date(createdAtIso);
  if (Number.isNaN(created.getTime())) return null;
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long" }).format(d);
  const addDays = (n: number) => new Date(created.getTime() + n * 24 * 60 * 60 * 1000);
  return { from: fmt(addDays(2)), to: fmt(addDays(4)) };
}

const STEP_SHORT_LABEL: Record<string, string> = {
  PENDING: "Menunggu",
  PAID: "Dibayar",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
};

function StatusStepper({ status }: { status: OrderStatus }) {
  const currentIdx = ORDER_STATUS_STEPS.indexOf(status);
  return (
    <ol
      className="flex items-start"
      aria-label={`Status pesanan: ${ORDER_STATUS_LABEL[status]}`}
    >
      {ORDER_STATUS_STEPS.map((step, i) => {
        const Icon = STEP_ICONS[i];
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li key={step} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span
                className={cn(
                  "h-0.5 flex-1 transition-colors",
                  i === 0 ? "bg-transparent" : done || active ? "bg-primary" : "bg-border"
                )}
              />
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !done && !active && "border-border bg-background text-muted-foreground"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span
                className={cn(
                  "h-0.5 flex-1 transition-colors",
                  i === ORDER_STATUS_STEPS.length - 1
                    ? "bg-transparent"
                    : i < currentIdx
                      ? "bg-primary"
                      : "bg-border"
                )}
              />
            </div>
            <span
              className={cn(
                "mt-1.5 text-[11px] font-medium sm:text-xs",
                done || active ? "text-foreground" : "text-muted-foreground",
                active && "font-semibold text-primary"
              )}
            >
              {STEP_SHORT_LABEL[step] ?? step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function OrderDetailClient({ id, justPaid }: { id: string; justPaid: boolean }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthUser();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const confettiFiredRef = useRef(false);

  // Confetti sekali saja saat banner pembayaran sukses tampil
  useEffect(() => {
    if (justPaid && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      const t = setTimeout(fireSuccessConfetti, 350);
      return () => clearTimeout(t);
    }
  }, [justPaid]);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Silakan login terlebih dahulu.");
      router.replace(`/login?next=/orders/${id}`);
    }
  }, [authLoading, user, router, id]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    fetch(`/api/orders/${encodeURIComponent(id)}`)
      .then(async (r) => {
        const data = r.ok ? await r.json() : await r.json().catch(() => null);
        if (!alive) return;
        if (!r.ok) {
          setError(data?.error ?? "Pesanan tidak ditemukan.");
          return;
        }
        setOrder(data.order ?? null);
      })
      .catch(() => {
        if (alive) setError("Gagal memuat pesanan. Periksa koneksi kamu.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [user, id]);

  if (authLoading || !user || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-24 w-full rounded-xl" />
        <div className="mt-6 grid gap-6 md:grid-cols-5">
          <Skeleton className="h-64 rounded-xl md:col-span-3" />
          <Skeleton className="h-64 rounded-xl md:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-lg font-semibold text-destructive">{error ?? "Pesanan tidak ditemukan."}</p>
        <div className="mt-4 flex justify-center gap-3">
          <Button asChild className="rounded-full">
            <Link href="/orders">Lihat Pesanan Saya</Link>
          </Button>
        </div>
      </div>
    );
  }

  const copyRef = async () => {
    if (!order.paymentRef) return;
    try {
      await navigator.clipboard.writeText(order.paymentRef);
      toast.success("Referensi pembayaran disalin.");
    } catch {
      toast.error("Gagal menyalin referensi.");
    }
  };

  const cancelOrder = async () => {
    if (!order || cancelling) return;
    setCancelling(true);
    try {
      const r = await fetch(`/api/orders/${encodeURIComponent(order.id)}/cancel`, {
        method: "POST",
      });
      const data = r.ok ? await r.json() : await r.json().catch(() => null);
      if (!r.ok) {
        toast.error(data?.error ?? "Gagal membatalkan pesanan.");
        return;
      }
      setOrder((prev) => (prev ? { ...prev, status: "CANCELLED" } : prev));
      toast.success("Pesanan dibatalkan.", { description: order.orderNumber });
      router.refresh();
    } catch {
      toast.error("Gagal menghubungi server. Periksa koneksi kamu.");
    } finally {
      setCancelling(false);
      setCancelOpen(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 rounded-full">
        <Link href="/orders">
          <ChevronLeft className="h-4 w-4" /> Semua Pesanan
        </Link>
      </Button>

      {/* Banner sukses pembayaran */}
      {justPaid && (
        <div
          className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4"
          role="status"
        >
          <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="font-bold text-emerald-900">Pembayaran berhasil — terima kasih!</p>
            <p className="text-sm text-emerald-800">
              Pesananmu sedang diproses — kami akan mengabari saat dikirim.
            </p>
          </div>
        </div>
      )}

      {/* Header pesanan */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">Dibuat {formatDate(order.createdAt, true)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* CTA bayar / info batal */}
      {order.status === "PENDING" && (
        <Card className="mt-5 border-amber-300 bg-amber-50">
          <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <div>
              <p className="font-bold text-amber-900">Menunggu pembayaran</p>
              <p className="text-sm text-amber-800">
                Selesaikan pembayaran agar pesananmu segera diproses.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                variant="outline"
                className="h-12 rounded-full border-amber-300 bg-transparent text-amber-900 hover:bg-amber-100 hover:text-amber-900"
                onClick={() => setCancelOpen(true)}
                disabled={cancelling}
              >
                <Ban className="h-4 w-4" /> Batalkan
              </Button>
              <Button asChild size="lg" className="h-12 w-full rounded-full sm:w-auto">
                <Link href={`/checkout/payment/${order.orderNumber}`}>Bayar Sekarang</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {order.status === "CANCELLED" && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4" role="alert">
          <Ban className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-bold text-destructive">Pesanan dibatalkan</p>
            <p className="text-sm text-muted-foreground">
              Pesanan ini tidak diproses. Silakan buat pesanan baru jika masih berminat.
            </p>
          </div>
        </div>
      )}

      {/* Tracking status */}
      {order.status !== "CANCELLED" && (
        <Card className="mt-5">
          <CardContent className="p-5 sm:p-6">
            <StatusStepper status={order.status} />
            {/* Estimasi pengiriman setelah dibayar */}
            {(order.status === "PAID" || order.status === "SHIPPED") && (() => {
              const est = deliveryEstimate(order.createdAt);
              return est ? (
                <p className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground sm:text-sm">
                  <Truck className="h-4 w-4 shrink-0 text-primary" />
                  {order.status === "PAID" ? (
                    <span>
                      Estimasi tiba: <span className="font-semibold text-foreground">{est.from}</span>
                      {" "}–{" "}
                      <span className="font-semibold text-foreground">{est.to}</span>
                    </span>
                  ) : (
                    <span>
                      Paket dalam perjalanan — perkiraan tiba{" "}
                      <span className="font-semibold text-foreground">{est.to}</span>
                    </span>
                  )}
                </p>
              ) : null;
            })()}
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-5">
        {/* Item pesanan */}
        <Card className="md:col-span-3">
          <CardContent className="p-5 sm:p-6">
            <h2 className="font-bold">Produk Dipesan ({order.items.length})</h2>
            <ul className="mt-4 space-y-4">
              {order.items.map((it) => {
                const productUrl = it.productSlug ? `/products/${it.productSlug}` : null;
                return (
                  <li key={it.id} className="flex items-center gap-3">
                    {productUrl ? (
                      <Link
                        href={productUrl}
                        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary transition-opacity hover:opacity-80"
                      >
                        {it.image && (
                          <Image src={it.image} alt={it.name} fill sizes="64px" className="object-cover" />
                        )}
                      </Link>
                    ) : (
                      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
                        {it.image && (
                          <Image src={it.image} alt={it.name} fill sizes="64px" className="object-cover" />
                        )}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      {productUrl ? (
                        <Link
                          href={productUrl}
                          className="line-clamp-2 text-sm font-medium transition-colors hover:text-primary"
                        >
                          {it.name}
                        </Link>
                      ) : (
                        <p className="line-clamp-2 text-sm font-medium">{it.name}</p>
                      )}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {it.quantity} × {formatRupiah(it.price)}
                      </p>
                    </div>
                    <p className="text-sm font-bold">{formatRupiah(it.price * it.quantity)}</p>
                  </li>
                );
              })}
            </ul>

            <Separator className="my-5" />

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
              <Separator className="my-2" />
              <div className="flex items-center justify-between">
                <span className="font-bold">Total</span>
                <span className="text-lg font-extrabold text-primary">{formatRupiah(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alamat & pembayaran */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardContent className="p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-bold">
                <MapPin className="h-4 w-4 text-primary" /> Alamat Pengiriman
              </h2>
              <div className="mt-3 space-y-1 text-sm">
                <p className="font-semibold">{order.customerName}</p>
                <p className="text-muted-foreground">{order.phone}</p>
                <p className="leading-relaxed text-foreground/90">
                  {order.address}, {order.city}
                  {order.postalCode ? ` ${order.postalCode}` : ""}
                </p>
                {order.notes && (
                  <p className="mt-2 rounded-md bg-secondary px-3 py-2 text-xs italic text-muted-foreground">
                    Catatan: {order.notes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-bold">
                <CreditCard className="h-4 w-4 text-primary" /> Pembayaran
              </h2>
              {order.paymentMethod ? (
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Metode</span>
                    <span className="font-semibold">
                      {PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod}
                    </span>
                  </div>
                  {order.paymentRef && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Referensi</span>
                      <button
                        type="button"
                        onClick={copyRef}
                        className="flex items-center gap-1 font-mono text-xs font-semibold text-primary underline-offset-2 hover:underline"
                        aria-label="Salin referensi pembayaran"
                      >
                        {order.paymentRef} <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Dibayar pada</span>
                    <span className="font-semibold">
                      {order.paidAt ? formatDate(order.paidAt, true) : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Status</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>
              ) : (
                <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Circle className="h-2 w-2 fill-amber-500 text-amber-500" />
                  Belum ada pembayaran.
                </p>
              )}
            </CardContent>
          </Card>

          {order.status === "PENDING" && (
            <div className="space-y-2">
              <Button asChild size="lg" className="h-12 w-full rounded-full">
                <Link href={`/checkout/payment/${order.orderNumber}`}>Bayar Sekarang</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-full"
                onClick={() => setCancelOpen(true)}
                disabled={cancelling}
              >
                <Ban className="h-4 w-4" /> Batalkan Pesanan
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Konfirmasi pembatalan pesanan */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan pesanan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Pesanan {order.orderNumber} akan dibatalkan dan tidak bisa dibuka kembali. Stok barang
              belum dipotong karena pesanan belum dibayar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Kembali</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={cancelling}
              onClick={(e) => {
                e.preventDefault();
                cancelOrder();
              }}
            >
              {cancelling && <Loader2 className="h-4 w-4 animate-spin" />}
              Ya, Batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
