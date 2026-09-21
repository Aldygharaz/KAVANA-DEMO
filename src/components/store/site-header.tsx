"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Heart, Package, Sparkles, UserCog } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SearchBar } from "@/components/store/search-bar";
import { CartSheet } from "@/components/store/cart-sheet";
import { UserMenu } from "@/components/store/user-menu";
import { ThemeToggle } from "@/components/store/theme-toggle";
import { useHydrated } from "@/components/store/use-hydrated";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/products", label: "Semua Produk" },
  { href: "/products?category=apparel", label: "Apparel" },
  { href: "/products?category=aksesoris", label: "Aksesoris" },
  { href: "/products?category=gadget", label: "Gadget" },
  { href: "/products?category=rumah", label: "Rumah" },
];

const ANNOUNCEMENTS = [
  "Gratis ongkir untuk pembelian di atas Rp500.000",
  "Demo portfolio — tidak ada transaksi nyata",
  "Pengiriman setiap hari kerja ke seluruh Indonesia",
];

export function SiteHeader() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const [mobileOpen, setMobileOpen] = useState(false);
  const hydrated = useHydrated();
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (headerRef.current) {
        const h = Math.round(headerRef.current.getBoundingClientRect().height);
        document.documentElement.style.setProperty("--site-header-height", `${h}px`);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [pathname, isAdmin]);

  return (
    <header ref={headerRef} className="sticky top-0 z-40 w-full">
      {/* Announcement bar */}
      <div className="overflow-hidden bg-primary text-primary-foreground">
        <div className="flex w-max animate-marquee py-1.5">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
              {ANNOUNCEMENTS.map((a, i) => (
                <span key={`${dup}-${i}`} className="mx-8 flex items-center gap-2 text-xs font-medium">
                  <Sparkles className="h-3 w-3" /> {a}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Main header */}
      <div className="border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
          {/* Mobile menu (storefront only) */}
          {!isAdmin &&
            (hydrated ? (
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    aria-label="Buka menu navigasi"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-accent lg:hidden"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle className="text-left font-bold tracking-tight">
                    KAVANA<span className="text-primary">.</span>
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Menu navigasi utama KAVANA: beranda, katalog produk, kategori, favorit, dan mode gelap.
                  </SheetDescription>
                </SheetHeader>
                <nav aria-label="Navigasi utama" className="mt-2 flex flex-col gap-1 px-2">
                  {NAV_LINKS.map((l) => (
                    <Link
                      key={l.label}
                      href={l.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent",
                        pathname === l.href.split("?")[0] && l.href === "/" ? "bg-accent text-primary" : ""
                      )}
                    >
                      {l.label}
                    </Link>
                  ))}
                  <div
                    aria-hidden
                    className="my-1 border-t border-border"
                  />
                  <Link
                    href="/wishlist"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <Heart className="h-4 w-4" /> Favorit
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <Package className="h-4 w-4" /> Pesanan Saya
                  </Link>
                  <Link
                    href="/akun"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <UserCog className="h-4 w-4" /> Akun Saya
                  </Link>
                  <div className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium">
                    Mode Gelap
                    <ThemeToggle />
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          ) : (
            <span className="inline-flex h-10 w-10 items-center justify-center lg:hidden" aria-hidden>
              <Menu className="h-5 w-5" />
            </span>
          ))}

          {/* Logo */}
          <Link href="/" className="flex items-center" aria-label="KAVANA — beranda">
            <span className="text-xl font-extrabold tracking-tight">
              KAVANA<span className="text-primary">.</span>
            </span>
          </Link>

          {/* Search (desktop - storefront only) */}
          {!isAdmin && (
            <div className="mx-auto hidden max-w-xl flex-1 md:block">
              <SearchBar />
            </div>
          )}

          {/* Actions */}
          <div className="ml-auto flex items-center gap-1">
            <UserMenu />
            <ThemeToggle />
            {!isAdmin && (
              <>
                <Link
                  href="/wishlist"
                  aria-label="Lihat produk favorit"
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-accent"
                >
                  <Heart className="h-5 w-5" />
                </Link>
                <CartSheet />
              </>
            )}
          </div>
        </div>

        {/* Search (mobile - storefront only) */}
        {!isAdmin && (
          <div className="px-4 pb-3 md:hidden">
            <SearchBar />
          </div>
        )}

        {/* Category nav (desktop - storefront only) */}
        {!isAdmin && (
          <nav
            aria-label="Navigasi kategori"
            className="mx-auto hidden max-w-7xl items-center gap-6 px-4 pb-2.5 sm:px-6 lg:flex lg:px-8"
          >
            {NAV_LINKS.map((l) => {
              const active =
                l.href === "/" ? pathname === "/" : pathname.startsWith("/products") && l.href.startsWith("/products");
              return (
                <Link
                  key={l.label}
                  href={l.href}
                  className={cn(
                    "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                    active && l.href !== "/" && "text-primary"
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
