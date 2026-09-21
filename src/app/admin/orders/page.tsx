"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  CreditCard,
  Download,
  Loader2,
  MapPin,
  NotebookPen,
  PackageOpen,
  Search,
  ShoppingCart,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { formatRupiah, formatDate } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";
import { StatusBadge, ORDER_STATUS_LABEL } from "@/components/admin/status-badge";
import {
  ADMIN_STATUSES,
  STATUS_FLOW,
  STATUS_ACTION_LABEL,
  PAYMENT_METHOD_LABEL,
} from "@/components/admin/order-status";
import { ProductThumb } from "@/components/admin/product-thumb";
import type { AdminOrder } from "@/components/admin/types";
import { useAdminRealtime } from "@/hooks/use-admin-realtime";
import { cn } from "@/lib/utils";

function itemsSummary(order: AdminOrder): string {
  if (order.items.length === 0) return "—";
  const first = order.items[0];
  const rest = order.items.length - 1;
  return rest > 0 ? `${first.name} +${rest} lainnya` : first.name;
}

type SortField = "createdAt" | "total" | "orderNumber" | "customerName";

/** Deret nomor halaman dengan ellipsis, mis. [1, "…", 4, 5, 6, "…", 12] */
function getPageItems(page: number, totalPages: number): (number | "dots")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= totalPages - 2)
    [totalPages - 3, totalPages - 2, totalPages - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: (number | "dots")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("dots");
    out.push(p);
    prev = p;
  }
  return out;
}

/** Header kolom yang bisa diklik untuk mengurutkan */
function SortHead({
  label,
  field,
  sortBy,
  sortDir,
  onToggle,
  className,
}: {
  label: string;
  field: SortField;
  sortBy: SortField;
  sortDir: "asc" | "desc";
  onToggle: (f: SortField) => void;
  className?: string;
}) {
  const active = sortBy === field;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className} aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onToggle(field)}
        className={cn(
          "inline-flex items-center gap-1 rounded transition-colors hover:text-foreground",
          active && "font-semibold text-foreground"
        )}
        aria-label={`Urutkan berdasarkan ${label}`}
      >
        {label}
        <Icon className={cn("size-3.5", !active && "text-muted-foreground/60")} aria-hidden />
      </button>
    </TableHead>
  );
}

function OrdersSkeleton() {
  return (
    <div className="grid gap-4" aria-hidden>
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [qInput, setQInput] = useState(initialQ);
  const [q, setQ] = useState(initialQ);
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<OrderStatus | null>(null);
  const [exporting, setExporting] = useState(false);
  // Pagination & sorting server-side
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const loadIdRef = useRef(0);

  // Debounce pencarian 300ms
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(qInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [qInput]);

  // Ekspor CSV sesuai filter status aktif — fetch → blob → unduh (bisa tangani error)
  const exportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const qs = params.toString();
      const res = await fetch(`/api/admin/orders/export${qs ? `?${qs}` : ""}`);
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(data?.error ?? "Gagal mengekspor CSV.");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="?([^";]+)"?/);
      const filename = match?.[1] ?? "kavana-pesanan.csv";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("CSV berhasil diunduh.", { description: filename });
    } catch {
      toast.error("Gagal mengekspor CSV. Coba lagi.");
    } finally {
      setExporting(false);
    }
  };

  const loadOrders = useCallback(
    async (status: string, search: string, pg: number, sb: SortField, sd: "asc" | "desc") => {
      const id = ++loadIdRef.current;
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (status !== "all") params.set("status", status);
        if (search) params.set("q", search);
        params.set("page", String(pg));
        params.set("pageSize", "10");
        params.set("sortBy", sb);
        params.set("sortDir", sd);
        const res = await fetch(`/api/admin/orders?${params.toString()}`);
        const data = (await res.json().catch(() => null)) as {
          orders?: AdminOrder[];
          total?: number;
          page?: number;
          totalPages?: number;
          error?: string;
        } | null;
        if (id !== loadIdRef.current) return; // respons lama, abaikan
        if (!res.ok || !data) {
          toast.error(data?.error ?? "Gagal memuat pesanan");
          return;
        }
        setOrders(data.orders ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        // Clamp: halaman melebihi total (mis. filter menyusut) → kembali ke valid
        if (data.totalPages && pg > data.totalPages) {
          setPage(data.totalPages);
        }
      } catch {
        if (id === loadIdRef.current) toast.error("Terjadi kesalahan jaringan");
      } finally {
        if (id === loadIdRef.current) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadOrders(statusFilter, q, page, sortBy, sortDir);
  }, [statusFilter, q, page, sortBy, sortDir, loadOrders]);

  const refreshOrders = useCallback(() => {
    loadOrders(statusFilter, q, page, sortBy, sortDir);
  }, [loadOrders, statusFilter, q, page, sortBy, sortDir]);

  // Realtime: toast + auto-refresh daftar saat ada event order (websocket)
  const { status: realtimeStatus } = useAdminRealtime((n) => {
    if (n.type === "ORDER_PAID") {
      toast.success(n.title, { description: n.message || n.orderNumber });
    } else if (n.type === "ORDER_SHIPPED") {
      toast.info(n.title, { description: n.message || n.orderNumber });
    } else if (n.type === "ORDER_CANCELLED") {
      toast.warning(n.title, { description: n.message || n.orderNumber });
    }
    if (n.type !== "EMAIL" && n.type !== "SYSTEM") refreshOrders();
  });

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortDir(field === "createdAt" || field === "total" ? "desc" : "asc");
    }
    setPage(1);
  };

  const openDetail = (order: AdminOrder) => {
    setSelected(order);
    setSheetOpen(true);
  };

  const applyStatus = useCallback(
    async (order: AdminOrder, next: OrderStatus) => {
      setUpdating(true);
      try {
        const res = await fetch(`/api/admin/orders/${order.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        const data = (await res.json().catch(() => null)) as {
          order?: AdminOrder;
          error?: string;
          allowed?: string[];
        } | null;
        if (!res.ok) {
          toast.error(data?.error ?? "Gagal memperbarui status pesanan");
          return;
        }
        toast.success(
          `${order.orderNumber} → ${ORDER_STATUS_LABEL[next]}`
        );
        // Perbarui state lokal + muat ulang daftar (jaga konsistensi filter)
        const fresh = data?.order;
        setSelected((prev) =>
          prev && prev.id === order.id
            ? { ...prev, status: next, ...(fresh ? { paidAt: fresh.paidAt, paymentMethod: fresh.paymentMethod, paymentRef: fresh.paymentRef } : {}) }
            : prev
        );
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, status: next } : o))
        );
        refreshOrders();
      } catch {
        toast.error("Terjadi kesalahan jaringan");
      } finally {
        setUpdating(false);
        setConfirmTarget(null);
      }
    },
    [refreshOrders]
  );

  const allowedNext: OrderStatus[] = selected
    ? STATUS_FLOW[selected.status] ?? []
    : [];

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            Pesanan
            {realtimeStatus === "live" && (
              <span
                className="flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400"
                title="Notifikasi realtime aktif"
              >
                <span className="relative flex size-1.5" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola dan pantau status pesanan pelanggan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={exporting}
            aria-label="Ekspor pesanan sebagai CSV"
            title={statusFilter !== "all" ? `Ekspor CSV (filter: ${ORDER_STATUS_LABEL[statusFilter as keyof typeof ORDER_STATUS_LABEL] ?? statusFilter})` : "Ekspor semua pesanan sebagai CSV"}
          >
            {exporting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="size-4" aria-hidden />
            )}
            Export CSV
          </Button>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Cari no. pesanan / nama…"
              className="w-52 pl-9"
              aria-label="Cari pesanan"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44" aria-label="Filter status pesanan">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {ADMIN_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {ORDER_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && orders.length === 0 ? (
        <OrdersSkeleton />
      ) : (
        <Card>
          <CardContent>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <ShoppingCart className="size-6" aria-hidden />
                </span>
                <p className="font-medium">Tidak ada pesanan ditemukan</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {q || statusFilter !== "all"
                    ? "Coba ubah kata kunci pencarian atau filter status."
                    : "Belum ada pesanan yang masuk ke toko."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow>
                      <SortHead
                        label="No. Pesanan"
                        field="orderNumber"
                        sortBy={sortBy}
                        sortDir={sortDir}
                        onToggle={toggleSort}
                      />
                      <SortHead
                        label="Pelanggan"
                        field="customerName"
                        sortBy={sortBy}
                        sortDir={sortDir}
                        onToggle={toggleSort}
                      />
                      <TableHead>Item</TableHead>
                      <SortHead
                        label="Total"
                        field="total"
                        sortBy={sortBy}
                        sortDir={sortDir}
                        onToggle={toggleSort}
                        className="text-right"
                      />
                      <TableHead>Status</TableHead>
                      <SortHead
                        label="Tanggal"
                        field="createdAt"
                        sortBy={sortBy}
                        sortDir={sortDir}
                        onToggle={toggleSort}
                        className="text-right"
                      />
                      <TableHead aria-label="Detail" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow
                        key={o.id}
                        onClick={() => openDetail(o)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") openDetail(o);
                        }}
                        className="cursor-pointer"
                        tabIndex={0}
                        aria-label={`Lihat detail pesanan ${o.orderNumber}`}
                      >
                        <TableCell className="font-medium text-primary">
                          {o.orderNumber}
                        </TableCell>
                        <TableCell>
                          <p className="max-w-40 truncate">{o.customerName}</p>
                          <p className="max-w-40 truncate text-xs text-muted-foreground">
                            {o.userEmail}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="max-w-44 truncate text-sm">
                            {itemsSummary(o)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {o.items.reduce((s, it) => s + it.quantity, 0)} item
                          </p>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatRupiah(o.total)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={o.status} />
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatDate(o.createdAt, true)}
                        </TableCell>
                        <TableCell className="text-right">
                          <ChevronRight
                            className="ml-auto size-4 text-muted-foreground"
                            aria-hidden
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Footer pagination */}
            {orders.length > 0 && (
              <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-xs text-muted-foreground" aria-live="polite">
                  Menampilkan {total === 0 ? 0 : (page - 1) * 10 + 1}–{Math.min(page * 10, total)} dari{" "}
                  {total} pesanan
                </p>
                {totalPages > 1 && (
                  <Pagination className="mx-0 w-auto justify-end">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setPage((p) => Math.max(1, p - 1));
                          }}
                          aria-disabled={page <= 1}
                          className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
                        />
                      </PaginationItem>
                      {getPageItems(page, totalPages).map((it, idx) =>
                        it === "dots" ? (
                          <PaginationItem key={`dots-${idx}`}>
                            <span className="px-1.5 text-muted-foreground">…</span>
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={it}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(it);
                              }}
                              isActive={it === page}
                            >
                              {it}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setPage((p) => Math.min(totalPages, p + 1));
                          }}
                          aria-disabled={page >= totalPages}
                          className={page >= totalPages ? "pointer-events-none opacity-50" : undefined}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detail pesanan */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
          {selected ? (
            <>
              <SheetHeader className="border-b pb-4">
                <SheetTitle className="flex flex-wrap items-center gap-2">
                  <span>{selected.orderNumber}</span>
                  <StatusBadge status={selected.status} />
                </SheetTitle>
                <SheetDescription>
                  Dibuat {formatDate(selected.createdAt, true)}
                </SheetDescription>
              </SheetHeader>

              <div className="grid gap-5 p-4">
                {/* Pelanggan & alamat */}
                <section aria-label="Informasi pelanggan" className="grid gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <User className="size-4 text-muted-foreground" aria-hidden />
                    Pelanggan
                  </h3>
                  <div className="rounded-lg border bg-secondary/40 p-3 text-sm">
                    <p className="font-medium">{selected.customerName}</p>
                    <p className="text-muted-foreground">{selected.userEmail}</p>
                    <Separator className="my-2" />
                    <div className="flex gap-2">
                      <MapPin
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <div>
                        <p>{selected.phone}</p>
                        <p className="text-muted-foreground">
                          {selected.address}, {selected.city}
                          {selected.postalCode ? ` ${selected.postalCode}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Item pesanan */}
                <section aria-label="Item pesanan" className="grid gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <PackageOpen
                      className="size-4 text-muted-foreground"
                      aria-hidden
                    />
                    Item ({selected.items.length})
                  </h3>
                  <ul className="grid gap-2">
                    {selected.items.map((it) => (
                      <li
                        key={it.id}
                        className="flex items-center gap-3 rounded-lg border p-2.5"
                      >
                        <ProductThumb src={it.image} alt={it.name} size={44} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium" title={it.name}>
                            {it.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {it.quantity} × {formatRupiah(it.price)}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-medium tabular-nums">
                          {formatRupiah(it.price * it.quantity)}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-1 grid gap-1 rounded-lg bg-secondary/40 p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="tabular-nums">
                        {formatRupiah(selected.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ongkos Kirim</span>
                      <span className="tabular-nums">
                        {selected.shippingCost === 0
                          ? "Gratis"
                          : formatRupiah(selected.shippingCost)}
                      </span>
                    </div>
                    {selected.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          Diskon
                          {selected.promoCode && (
                            <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-bold tracking-wide">
                              {selected.promoCode}
                            </span>
                          )}
                        </span>
                        <span className="tabular-nums text-emerald-600">
                          −{formatRupiah(selected.discount)}
                        </span>
                      </div>
                    )}
                    <Separator className="my-1" />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="tabular-nums">
                        {formatRupiah(selected.total)}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Pembayaran */}
                <section aria-label="Informasi pembayaran" className="grid gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <CreditCard
                      className="size-4 text-muted-foreground"
                      aria-hidden
                    />
                    Pembayaran
                  </h3>
                  <div className="grid gap-1 rounded-lg border bg-secondary/40 p-3 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Metode</span>
                      <span>
                        {selected.paymentMethod
                          ? (PAYMENT_METHOD_LABEL[selected.paymentMethod] ??
                            selected.paymentMethod)
                          : "Belum dibayar"}
                      </span>
                    </div>
                    {selected.paymentRef ? (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Ref.</span>
                        <span className="font-mono text-xs">
                          {selected.paymentRef}
                        </span>
                      </div>
                    ) : null}
                    {selected.paidAt ? (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Dibayar</span>
                        <span>{formatDate(selected.paidAt, true)}</span>
                      </div>
                    ) : null}
                  </div>
                </section>

                {/* Catatan */}
                {selected.notes ? (
                  <section aria-label="Catatan pesanan" className="grid gap-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <NotebookPen
                        className="size-4 text-muted-foreground"
                        aria-hidden
                      />
                      Catatan
                    </h3>
                    <p className="rounded-lg border bg-secondary/40 p-3 text-sm italic text-muted-foreground">
                      “{selected.notes}”
                    </p>
                  </section>
                ) : null}

                {/* Aksi status (FR-8: hanya transisi valid) */}
                <section aria-label="Aksi status pesanan" className="grid gap-2">
                  <h3 className="text-sm font-semibold">Aksi Status</h3>
                  {allowedNext.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Pesanan ini sudah final — tidak ada transisi status lagi.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Transisi yang tersedia dari status{" "}
                        {ORDER_STATUS_LABEL[selected.status]}:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {allowedNext.map((target) =>
                          target === "CANCELLED" ? (
                            <Button
                              key={target}
                              variant="outline"
                              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              disabled={updating}
                              onClick={() => setConfirmTarget(target)}
                            >
                              {STATUS_ACTION_LABEL[target]}
                            </Button>
                          ) : (
                            <Button
                              key={target}
                              variant={target === "PAID" ? "default" : "secondary"}
                              disabled={updating}
                              onClick={() => applyStatus(selected, target)}
                            >
                              {updating ? (
                                <Loader2
                                  className="size-4 animate-spin"
                                  aria-hidden
                                />
                              ) : null}
                              {STATUS_ACTION_LABEL[target]}
                            </Button>
                          )
                        )}
                      </div>
                    </>
                  )}
                </section>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Konfirmasi pembatalan */}
      <AlertDialog
        open={!!confirmTarget}
        onOpenChange={(o) => {
          if (!o) setConfirmTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Batalkan pesanan {selected?.orderNumber}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selected?.status === "PAID"
                ? "Pesanan sudah dibayar — stok produk akan dikembalikan secara otomatis. Tindakan ini tidak dapat dibatalkan."
                : "Pesanan akan dibatalkan dan pelanggan akan kehilangan status menunggu pembayaran. Tindakan ini tidak dapat dibatalkan."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>Kembali</AlertDialogCancel>
            <AlertDialogAction
              className={cn("bg-destructive text-white hover:bg-destructive/90")}
              disabled={updating}
              onClick={(e) => {
                e.preventDefault();
                if (selected && confirmTarget) applyStatus(selected, confirmTarget);
              }}
            >
              {updating ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Ya, Batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={<OrdersSkeleton />}
    >
      <OrdersContent />
    </Suspense>
  );
}
