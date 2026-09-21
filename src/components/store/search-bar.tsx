"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import type { SearchSuggestion } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Search autocomplete (FR-10): GET /api/search, min 2 karakter, debounce 250ms.
 * Submit → /products?q=<query>. Klik saran → halaman detail produk.
 */
export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Debounce 250ms → /api/search (min 2 karakter)
  useEffect(() => {
    const query = q.trim();
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      if (query.length < 2) {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = r.ok ? await r.json() : { products: [] };
        setSuggestions(data?.products ?? []);
        setOpen(true);
        setHighlight(-1);
      } catch {
        /* dibatalkan atau gagal jaringan — abaikan */
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  // Batalkan request terakhir saat komponen unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const submit = () => {
    const query = q.trim();
    setOpen(false);
    if (query.length === 0) {
      router.push("/products");
      return;
    }
    router.push(`/products?q=${encodeURIComponent(query)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0 && suggestions[highlight]) {
        setOpen(false);
        router.push(`/products/${suggestions[highlight].slug}`);
        return;
      }
      submit();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="kavana-search" className="sr-only">
          Cari produk
        </label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="kavana-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Cari produk…"
          autoComplete="off"
          className="h-10 w-full rounded-full border border-border bg-background pl-10 pr-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
        />
        {q.length > 0 && (
          <button
            type="button"
            aria-label="Bersihkan pencarian"
            onClick={() => {
              setQ("");
              setSuggestions([]);
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
          {loading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">Mencari…</div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Tidak ada produk untuk “{q.trim()}”.
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {suggestions.map((s, i) => (
                <li key={s.id}>
                  <Link
                    href={`/products/${s.slug}`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 transition-colors hover:bg-accent",
                      i === highlight && "bg-accent"
                    )}
                  >
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-secondary">
                      {s.image && (
                        <Image src={s.image} alt={s.name} fill sizes="40px" className="object-cover" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{s.name}</span>
                      <span className="block text-xs text-muted-foreground">{s.categoryName}</span>
                    </span>
                    <span className="text-xs font-semibold text-primary">{formatRupiah(s.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
