"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Mail,
  Package,
  ShoppingCart,
  Store,
  ShieldAlert,
  Menu,
  Loader2,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true, badge: false },
  { href: "/admin/products", label: "Produk", icon: Package, exact: false, badge: false },
  { href: "/admin/orders", label: "Pesanan", icon: ShoppingCart, exact: false, badge: false },
  { href: "/admin/emails", label: "Email", icon: Mail, exact: false, badge: true },
];

/** Tinggi header global (announcement marquee + main bar) */
const HEADER_HEIGHT = 92;

function BrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Store className="size-4.5" aria-hidden />
      </span>
      <span className="block">
        <span className="block text-sm font-bold leading-tight tracking-wide">
          KAVANA
        </span>
        <span className="block text-xs text-muted-foreground">Panel Admin</span>
      </span>
    </span>
  );
}

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  // Badge email belum dibaca — refresh saat pindah halaman admin
  const [unreadEmails, setUnreadEmails] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/emails?countOnly=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setUnreadEmails(data.unreadCount ?? 0);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <nav aria-label="Menu admin" className="grid gap-1">
      {NAV_ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="size-4.5 shrink-0" aria-hidden />
            {item.label}
            {item.badge && unreadEmails > 0 && (
              <span
                className="ml-auto flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground"
                aria-label={`${unreadEmails} email belum dibaca`}
              >
                {unreadEmails > 99 ? "99+" : unreadEmails}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function StoreLink({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        className
      )}
    >
      <Store className="size-4.5 shrink-0" aria-hidden />
      Lihat Toko
    </Link>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuthUser();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/admin");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        <span className="sr-only">Memuat panel admin…</span>
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="size-7" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-destructive">
                403
              </p>
              <h1 className="mt-1 text-xl font-bold">Akses khusus admin</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Halaman ini hanya dapat diakses oleh admin KAVANA. Silakan kembali
                ke toko untuk melanjutkan belanja.
              </p>
            </div>
            <Button asChild>
              <Link href="/">Kembali ke Toko</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-var(--site-header-height,92px))]">
      {/* Top bar mobile */}
      <div
        className="sticky z-30 border-b bg-background/95 backdrop-blur lg:hidden"
        style={{ top: "var(--site-header-height, 92px)" }}
      >
        <div className="flex h-14 items-center gap-3 px-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Buka menu admin"
              >
                <Menu className="size-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b p-4 text-left">
                <SheetTitle>
                  <BrandMark />
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Menu navigasi panel admin KAVANA.
                </SheetDescription>
              </SheetHeader>
              <div className="flex h-full flex-col">
                <div className="p-3">
                  <AdminNav onNavigate={() => setMobileOpen(false)} />
                </div>
                <div className="mt-auto border-t p-3">
                  <StoreLink onNavigate={() => setMobileOpen(false)} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <p className="text-sm font-semibold">Admin KAVANA</p>
        </div>
      </div>

      {/* Sidebar desktop (fixed kiri) */}
      <aside
        className="fixed bottom-0 left-0 z-30 hidden w-60 border-r border-sidebar-border bg-sidebar lg:block"
        style={{ top: "var(--site-header-height, 92px)" }}
        aria-label="Sidebar admin"
      >
        <div className="flex h-full flex-col pt-3">
          <div className="px-4 pb-4">
            <BrandMark />
          </div>
          <div className="flex-1 px-3">
            <AdminNav />
          </div>
          <div className="border-t border-sidebar-border p-3">
            <StoreLink />
          </div>
        </div>
      </aside>

      {/* Konten */}
      <div className="lg:pl-60">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
