"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, PackageOpen, Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ProductCard } from "@/components/store/product-card";
import { ProductsSkeleton } from "./products-skeleton";
import type { ProductCardData } from "@/lib/types";

interface ListResponse {
  products: ProductCardData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "price-asc", label: "Harga Terendah" },
  { value: "price-desc", label: "Harga Tertinggi" },
  { value: "rating", label: "Rating Tertinggi" },
] as const;

function getPageItems(current: number, total: number): (number | "dots")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: (number | "dots")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push("dots");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < total - 1) items.push("dots");
  items.push(total);
  return items;
}

export function ProductsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const qParam = searchParams.get("q") ?? "";
  const categoryParam = searchParams.get("category") ?? "all";
  const sortParam = searchParams.get("sort") ?? "newest";
  const pageParam = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [searchInput, setSearchInput] = useState(qParam);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Sinkronkan input pencarian saat q berubah dari luar (mis. SearchBar header)
  useEffect(() => {
    setSearchInput(qParam);
  }, [qParam]);

  useEffect(() => {
    let alive = true;
    fetch("/api/categories")
      .then((r) => (r.ok ? r.json() : { categories: [] }))
      .then((d) => {
        if (alive) setCategories(d?.categories ?? []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const setParams = useCallback(
    (mutate: (sp: URLSearchParams) => void) => {
      const sp = new URLSearchParams(searchParams.toString());
      mutate(sp);
      const qs = sp.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const sp = new URLSearchParams();
    sp.set("page", String(page));
    if (categoryParam && categoryParam !== "all") sp.set("category", categoryParam);
    if (sortParam && sortParam !== "newest") sp.set("sort", sortParam);
    if (qParam) sp.set("q", qParam);

    fetch(`/api/products?${sp.toString()}`, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error("Gagal memuat produk. Coba lagi.");
        return r.json() as Promise<ListResponse>;
      })
      .then((d) => {
        setData(d);
        // Clamp: jika halaman melebihi totalPages (mis. filter menyusut), kembali ke halaman valid
        if (d.totalPages > 0 && d.page > d.totalPages) {
          setParams((p) => {
            p.set("page", String(d.totalPages));
          });
        }
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Terjadi kesalahan saat memuat produk.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [qParam, categoryParam, sortParam, page]);

  const pageHref = (p: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (p <= 1) sp.delete("page");
    else sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const goToPage = (p: number) => {
    if (p === page) return;
    setParams((sp) => {
      if (p <= 1) sp.delete("page");
      else sp.set("page", String(p));
    });
    toolbarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams((sp) => {
      const v = searchInput.trim();
      if (v) sp.set("q", v);
      else sp.delete("q");
      sp.delete("page");
    });
  };

  const resetFilters = () => {
    setSearchInput("");
    router.push(pathname);
  };

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const showFrom = total === 0 ? 0 : (page - 1) * (data?.pageSize ?? 12) + 1;
  const showTo = Math.min(total, page * (data?.pageSize ?? 12));
  const hasActiveFilter = Boolean(qParam) || categoryParam !== "all" || sortParam !== "newest";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {qParam
            ? `Hasil pencarian “${qParam}”`
            : categoryParam !== "all"
              ? (categories.find((c) => c.slug === categoryParam)?.name ?? "Semua Produk")
              : "Semua Produk"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Kurasi lifestyle &amp; goods KAVANA — temukan produk favoritmu.
        </p>
      </div>

      {/* Toolbar: search + kategori + urutan */}
      <div ref={toolbarRef} className="mt-6 flex flex-col gap-3 scroll-mt-36 lg:flex-row lg:items-center">
        <form role="search" onSubmit={onSubmitSearch} className="relative flex-1">
          <label htmlFor="products-search" className="sr-only">
            Cari produk
          </label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="products-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari nama produk…"
            className="h-11 rounded-full pl-10 pr-4"
          />
        </form>

        <div className="grid grid-cols-2 gap-3 lg:flex lg:w-auto">
          <Select
            value={categoryParam || "all"}
            onValueChange={(v) =>
              setParams((sp) => {
                if (v === "all") sp.delete("category");
                else sp.set("category", v);
                sp.delete("page");
              })
            }
          >
            <SelectTrigger aria-label="Filter kategori" className="h-11 w-full rounded-full lg:w-44">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.slug}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sortParam || "newest"}
            onValueChange={(v) =>
              setParams((sp) => {
                if (v === "newest") sp.delete("sort");
                else sp.set("sort", v);
                sp.delete("page");
              })
            }
          >
            <SelectTrigger aria-label="Urutkan produk" className="h-11 w-full rounded-full lg:w-48">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Jumlah hasil */}
      {!loading && !error && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {total > 0 ? (
              <>
                Menampilkan <span className="font-semibold text-foreground">{showFrom}–{showTo}</span> dari{" "}
                <span className="font-semibold text-foreground">{total}</span> produk
              </>
            ) : (
              "Tidak ada produk"
            )}
          </p>
          {hasActiveFilter && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 rounded-full">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          )}
        </div>
      )}

      {/* Konten */}
      {loading ? (
        <ProductsSkeleton />
      ) : error ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="font-medium text-destructive">{error}</p>
          <Button variant="outline" onClick={() => router.refresh()} className="rounded-full">
            Coba Lagi
          </Button>
        </div>
      ) : products.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <PackageOpen className="h-7 w-7 text-muted-foreground" />
          </span>
          <p className="text-lg font-semibold">Produk tidak ditemukan</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Coba kata kunci lain atau lihat semua koleksi kami.
          </p>
          <Button asChild className="mt-1 rounded-full">
            <Link href="/products">Lihat Semua Produk</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>

          {/* Pagination FR-1 */}
          {totalPages > 1 && (
            <Pagination className="mt-10">
              <PaginationContent>
                <PaginationItem>
                  <PaginationLink
                    href={pageHref(Math.max(1, page - 1))}
                    onClick={(e) => {
                      e.preventDefault();
                      goToPage(Math.max(1, page - 1));
                    }}
                    aria-disabled={page <= 1}
                    className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Sebelumnya</span>
                  </PaginationLink>
                </PaginationItem>

                {getPageItems(page, totalPages).map((it, idx) =>
                  it === "dots" ? (
                    <PaginationItem key={`dots-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={it}>
                      <PaginationLink
                        href={pageHref(it)}
                        onClick={(e) => {
                          e.preventDefault();
                          goToPage(it);
                        }}
                        isActive={it === page}
                      >
                        {it}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationLink
                    href={pageHref(Math.min(totalPages, page + 1))}
                    onClick={(e) => {
                      e.preventDefault();
                      goToPage(Math.min(totalPages, page + 1));
                    }}
                    aria-disabled={page >= totalPages}
                    className={page >= totalPages ? "pointer-events-none opacity-50" : undefined}
                  >
                    <span className="hidden sm:inline">Berikutnya</span>
                    <ChevronRight className="h-4 w-4" />
                  </PaginationLink>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
