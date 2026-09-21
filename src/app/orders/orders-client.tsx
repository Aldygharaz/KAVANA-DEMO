"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Package, PackageOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthUser } from "@/hooks/use-auth-user";
import { formatRupiah, formatDate } from "@/lib/format";
import { OrderStatusBadge } from "@/components/store/order-status-badge";
import type { OrderData } from "@/components/store/storefront-types";

export default function OrdersClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthUser();
  const [orders, setOrders] = useState<OrderData[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Proteksi halaman (FR-7: hanya order milik sendiri, dijaga juga di server)
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Silakan login terlebih dahulu.");
      router.replace("/login?next=/orders");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    fetch("/api/orders")
      .then(async (r) => {
        const data = r.ok ? await r.json() : await r.json().catch(() => null);
        if (!alive) return;
        if (!r.ok) {
          setError(data?.error ?? "Gagal memuat pesanan.");
          return;
        }
        setOrders(data.orders ?? []);
      })
      .catch(() => {
        if (alive) setError("Gagal memuat pesanan. Periksa koneksi kamu.");
      });
    return () => {
      alive = false;
    };
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-48" />
        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Pesanan Saya</h1>
      <p className="mt-1 text-sm text-muted-foreground">Riwayat belanja &amp; status pengirimanmu.</p>

      {error ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="font-medium text-destructive">{error}</p>
          <Button variant="outline" onClick={() => router.refresh()} className="rounded-full">
            Coba Lagi
          </Button>
        </div>
      ) : orders === null ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <PackageOpen className="h-7 w-7 text-muted-foreground" />
          </span>
          <p className="text-lg font-semibold">Belum ada pesanan</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Pesanan yang kamu buat akan muncul di sini beserta statusnya.
          </p>
          <Button asChild size="lg" className="mt-2 rounded-full">
            <Link href="/products">Mulai Belanja</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/orders/${o.id}`} className="group block focus-visible:outline-none">
                <Card className="transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </span>
                        <div>
                          <p className="text-sm font-bold">{o.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(o.createdAt, true)}</p>
                        </div>
                      </div>
                      <OrderStatusBadge status={o.status} />
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center">
                        {o.items.slice(0, 4).map((it, i) => (
                          <span
                            key={it.id}
                            className="relative h-12 w-12 overflow-hidden rounded-lg border-2 border-background bg-secondary"
                            style={{ marginLeft: i === 0 ? 0 : -14, zIndex: 4 - i }}
                            aria-hidden
                          >
                            {it.image && (
                              <Image src={it.image} alt="" fill sizes="48px" className="object-cover" />
                            )}
                          </span>
                        ))}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {o.items.length} produk
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="text-sm font-extrabold sm:text-base">{formatRupiah(o.total)}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
