"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Cell,
  Pie,
  PieChart,
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Wallet,
  ShoppingCart,
  Package,
  Users,
  TriangleAlert,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRupiah, formatDate } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";
import { StatusBadge } from "@/components/admin/status-badge";
import { shortRupiah } from "@/components/admin/order-status";
import type { AdminStats } from "@/components/admin/types";
import {
  useAdminRealtime,
  NOTIF_TYPE_META,
  type AdminNotification,
} from "@/hooks/use-admin-realtime";
import { cn } from "@/lib/utils";

const STATUS_BAR_CLASS: Record<OrderStatus, string> = {
  PENDING: "bg-amber-500/70",
  PAID: "bg-emerald-500/70",
  SHIPPED: "bg-orange-500/70",
  COMPLETED: "bg-primary/70",
  CANCELLED: "bg-destructive/70",
};

/** Warna donut kategori — palet warm, tanpa biru/indigo */
const CATEGORY_COLORS = [
  "var(--color-primary, #8b5e3c)",
  "#c98a3d",
  "#a8574e",
  "#7d8c58",
  "#b0885e",
  "#9c6b4f",
];

function dayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(d);
}

function KpiCard({
  title,
  value,
  icon: Icon,
  hint,
  hintClass,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: React.ReactNode;
  hintClass?: string;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">{title}</span>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4.5" aria-hidden />
          </span>
        </div>
        <p className="mt-2 truncate text-2xl font-bold tracking-tight" title={value}>
          {value}
        </p>
        {hint ? (
          <p className={cn("mt-1 flex items-center gap-1 text-xs", hintClass)}>
            {hint}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-6" aria-hidden>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-[340px] rounded-xl lg:col-span-3" />
        <Skeleton className="h-[340px] rounded-xl lg:col-span-2" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontSize: 12,
  color: "var(--popover-foreground)",
} as const;

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  // Snapshot stok menipis terakhir — untuk deteksi produk baru yang masuk zona menipis
  const lowStockIdsRef = useRef<Set<string> | null>(null);

  const loadStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = (await res.json().catch(() => null)) as
        | (AdminStats & { error?: string })
        | null;
      if (!res.ok) {
        if (!silent) toast.error(data?.error ?? "Gagal memuat statistik");
        return;
      }
      if (data) {
        setStats(data);
        // Watcher stok menipis: toast hanya untuk produk yang BARU masuk zona menipis
        const currentIds = new Set(data.lowStockProducts.map((p) => p.id));
        const prev = lowStockIdsRef.current;
        if (prev !== null) {
          const fresh = data.lowStockProducts.filter((p) => !prev.has(p.id));
          for (const p of fresh) {
            toast.warning("Stok menipis!", {
              description: `${p.name} tersisa ${p.stock} pcs — segera restock.`,
            });
          }
        }
        lowStockIdsRef.current = currentIds;
      }
    } catch {
      if (!silent) toast.error("Terjadi kesalahan jaringan");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Polling ringan tiap 30 detik (silent) untuk watcher stok + refresh angka dashboard
  useEffect(() => {
    const t = setInterval(() => loadStats(true), 30_000);
    return () => clearInterval(t);
  }, [loadStats]);

  // Realtime (websocket): notifikasi instan + refresh angka saat ada event order
  const { status: realtimeStatus } = useAdminRealtime((n: AdminNotification) => {
    const meta = NOTIF_TYPE_META[n.type];
    const description = [n.message, n.orderNumber].filter(Boolean).join(" · ");
    if (n.type === "ORDER_PAID") {
      toast.success(n.title, { description });
    } else if (n.type === "ORDER_CANCELLED") {
      toast.warning(n.title, { description });
    } else if (n.type === "ORDER_SHIPPED") {
      toast.info(n.title, { description });
    } else {
      toast(n.title, { description: `${meta.label}${description ? ` · ${description}` : ""}` });
    }
    if (n.type !== "EMAIL" && n.type !== "SYSTEM") loadStats(true);
  });

  if (loading && !stats) {
    return <DashboardSkeleton />;
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Gagal memuat data dashboard.
          </p>
          <Button onClick={() => loadStats()} variant="outline">
            <RefreshCw className="size-4" aria-hidden /> Coba Lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  const weekRevenue = stats.revenueByDay.reduce((s, d) => s + d.revenue, 0);
  const weekOrders = stats.revenueByDay.reduce((s, d) => s + d.orders, 0);
  const today = stats.revenueByDay[stats.revenueByDay.length - 1];
  const yesterday = stats.revenueByDay[stats.revenueByDay.length - 2];
  let revenueTrend: "up" | "down" | "flat" = "flat";
  let trendPct = 0;
  if (today && yesterday && yesterday.revenue > 0) {
    trendPct = Math.round(((today.revenue - yesterday.revenue) / yesterday.revenue) * 100);
    revenueTrend = trendPct > 0 ? "up" : trendPct < 0 ? "down" : "flat";
  } else if (today && today.revenue > 0 && (!yesterday || yesterday.revenue === 0)) {
    revenueTrend = "up";
  }

  const lowStockCount = stats.lowStockProducts.length;
  const totalOrdersForDist = stats.statusDistribution.reduce((s, d) => s + d.count, 0);
  const chartData = stats.revenueByDay.map((d) => ({ ...d, label: dayLabel(d.date) }));

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan performa toko KAVANA.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadStats()}
          disabled={loading}
          aria-label="Muat ulang statistik"
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden />
          Muat Ulang
        </Button>
      </div>

      {/* Watcher info: realtime websocket + polling fallback tiap 30 detik */}
      <p className="-mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="relative flex size-2" aria-hidden>
          {realtimeStatus === "live" ? (
            <>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </>
          ) : (
            <span
              className={cn(
                "relative inline-flex size-2 rounded-full",
                realtimeStatus === "connecting" ? "bg-amber-500" : "bg-muted-foreground/50"
              )}
            />
          )}
        </span>
        {realtimeStatus === "live" ? (
          <>Live realtime aktif — notifikasi order masuk instan tanpa reload.</>
        ) : realtimeStatus === "connecting" ? (
          <>Menghubungkan ke layanan realtime…</>
        ) : (
          <>Realtime offline — data disegarkan otomatis tiap 30 detik.</>
        )}
      </p>

      {/* KPI cards */}
      <section aria-label="Statistik utama" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total Pendapatan"
          value={formatRupiah(stats.revenue)}
          icon={Wallet}
          hint={
            revenueTrend === "up" ? (
              <>
                <TrendingUp className="size-3.5 text-emerald-600" aria-hidden />
                <span className="text-emerald-700 dark:text-emerald-400">
                  +{trendPct}% dari kemarin
                </span>
              </>
            ) : revenueTrend === "down" ? (
              <>
                <TrendingDown className="size-3.5 text-destructive" aria-hidden />
                <span className="text-destructive">{trendPct}% dari kemarin</span>
              </>
            ) : (
              <>
                <Minus className="size-3.5" aria-hidden />
                <span>stabil vs kemarin</span>
              </>
            )
          }
        />
        <KpiCard
          title="Total Pesanan"
          value={String(stats.ordersCount)}
          icon={ShoppingCart}
          hint={`${weekOrders} pesanan dalam 7 hari terakhir`}
        />
        <KpiCard
          title="Jumlah Produk"
          value={String(stats.productsCount)}
          icon={Package}
          hint={
            lowStockCount > 0 ? (
              <span className="text-amber-700 dark:text-amber-400">
                {lowStockCount} produk stok menipis
              </span>
            ) : (
              <span>semua stok aman</span>
            )
          }
        />
        <KpiCard
          title="Pelanggan Terdaftar"
          value={String(stats.customersCount)}
          icon={Users}
          hint="akun customer terdaftar"
        />
      </section>

      {/* Charts */}
      <section className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Pendapatan 7 Hari Terakhir</CardTitle>
            <p className="text-xs text-muted-foreground">
              {formatRupiah(weekRevenue)} dari {weekOrders} pesanan terbayar
            </p>
          </CardHeader>
          <CardContent>
            {weekOrders === 0 ? (
              <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Belum ada penjualan dalam 7 hari terakhir.
              </div>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="var(--muted-foreground)"
                    />
                    <YAxis
                      tickFormatter={(v: number) => shortRupiah(v)}
                      tickLine={false}
                      axisLine={false}
                      width={64}
                      fontSize={12}
                      stroke="var(--muted-foreground)"
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ stroke: "var(--border)" }}
                      formatter={(value) => [formatRupiah(Number(value)), "Pendapatan"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      fill="url(#revFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Produk Terlaris</CardTitle>
            <p className="text-xs text-muted-foreground">
              Berdasarkan kuantitas dari pesanan terbayar
            </p>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Belum ada penjualan.
              </div>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.topProducts.map((p) => ({
                      ...p,
                      shortName:
                        p.name.length > 16 ? `${p.name.slice(0, 15)}…` : p.name,
                    }))}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="var(--muted-foreground)"
                    />
                    <YAxis
                      type="category"
                      dataKey="shortName"
                      width={130}
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="var(--muted-foreground)"
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ fill: "var(--accent)", opacity: 0.5 }}
                      formatter={(value) => [`${Number(value)} terjual`, "Kuantitas"]}
                      labelFormatter={(label, payload) =>
                        payload?.[0]?.payload?.name ?? String(label)
                      }
                    />
                    <Bar
                      dataKey="qtySold"
                      fill="var(--chart-2)"
                      radius={[0, 6, 6, 0]}
                      barSize={16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Category donut + Distribution + low stock */}
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Donut pendapatan per kategori */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pendapatan per Kategori</CardTitle>
            <p className="text-xs text-muted-foreground">
              Kontribusi kategori dari pesanan terbayar
            </p>
          </CardHeader>
          <CardContent>
            {stats.revenueByCategory.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Belum ada penjualan.
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="relative h-[190px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.revenueByCategory}
                        dataKey="revenue"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {stats.revenueByCategory.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value) => [formatRupiah(Number(value)), "Pendapatan"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Total di tengah donat */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Total
                    </span>
                    <span className="text-sm font-bold">
                      {shortRupiah(
                        stats.revenueByCategory.reduce((s, c) => s + c.revenue, 0)
                      )}
                    </span>
                  </div>
                </div>
                <ul className="mt-1 w-full space-y-1.5">
                  {stats.revenueByCategory.map((c, i) => (
                    <li key={c.name} className="flex items-center gap-2 text-xs">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate text-muted-foreground">{c.name}</span>
                      <span className="shrink-0 font-semibold tabular-nums">
                        {formatRupiah(c.revenue)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribusi Status Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {totalOrdersForDist === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada pesanan.</p>
            ) : (
              stats.statusDistribution.map((s) => (
                <div key={s.status} className="flex items-center gap-3">
                  <StatusBadge status={s.status} className="w-44 justify-center" />
                  <div
                    className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"
                    role="presentation"
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        STATUS_BAR_CLASS[s.status]
                      )}
                      style={{
                        width: `${totalOrdersForDist ? (s.count / totalOrdersForDist) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-medium tabular-nums">
                    {s.count}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Stok Menipis</CardTitle>
            <span className="flex size-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <TriangleAlert className="size-4.5" aria-hidden />
            </span>
          </CardHeader>
          <CardContent>
            {lowStockCount === 0 ? (
              <p className="text-sm text-muted-foreground">
                Semua stok produk aman (lebih dari 5).
              </p>
            ) : (
              <ul className="grid gap-2.5">
                {stats.lowStockProducts.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-secondary/40 px-3 py-2"
                  >
                    <span className="truncate text-sm font-medium">{p.name}</span>
                    <span className="shrink-0 rounded-full border border-amber-600/30 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                      sisa {p.stock}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Pesanan Terbaru</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/orders">
              Lihat Semua <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada pesanan masuk.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[560px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Pesanan</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link
                          href={`/admin/orders?q=${encodeURIComponent(o.orderNumber)}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {o.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-40 truncate">{o.customerName}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatRupiah(o.total)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={o.status} />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(o.createdAt, true)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
