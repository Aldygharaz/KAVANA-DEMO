"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, Instagram, Twitter, Youtube, MapPin, Mail, CreditCard, Truck, ShieldCheck, Sparkles } from "lucide-react";
import { NewsletterForm } from "@/components/store/newsletter-form";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="mt-auto border-t border-border bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Newsletter strip */}
        <div className="mb-10 flex flex-col gap-4 rounded-2xl border border-border bg-background p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            <p className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-primary">
              <Sparkles className="size-4" aria-hidden /> Newsletter KAVANA
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Dapat diskon 10% untuk pembelian pertama + info produk baru tiap minggu.
            </p>
          </div>
          <NewsletterForm />
        </div>

        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <p className="text-xl font-extrabold tracking-tight">
              KAVANA<span className="text-primary">.</span>
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Kurasi lifestyle & goods untuk keseharian yang lebih baik — apparel, aksesoris, gadget,
              dan perlengkapan rumah dalam satu tempat.
            </p>
            <div className="flex gap-2 pt-1">
              {[
                { icon: Instagram, label: "Instagram KAVANA" },
                { icon: Twitter, label: "Twitter KAVANA" },
                { icon: Youtube, label: "YouTube KAVANA" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>

          {/* Shop links */}
          <nav aria-label="Tautan belanja" className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-foreground">Belanja</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products" className="transition-colors hover:text-foreground">Semua Produk</Link></li>
              <li><Link href="/products?category=apparel" className="transition-colors hover:text-foreground">Apparel</Link></li>
              <li><Link href="/products?category=aksesoris" className="transition-colors hover:text-foreground">Aksesoris</Link></li>
              <li><Link href="/products?category=gadget" className="transition-colors hover:text-foreground">Gadget</Link></li>
              <li><Link href="/products?category=rumah" className="transition-colors hover:text-foreground">Rumah</Link></li>
            </ul>
          </nav>

          {/* Account links */}
          <nav aria-label="Tautan akun" className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-foreground">Akun</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/login" className="transition-colors hover:text-foreground">Masuk</Link></li>
              <li><Link href="/register" className="transition-colors hover:text-foreground">Daftar</Link></li>
              <li><Link href="/orders" className="transition-colors hover:text-foreground">Lacak Pesanan</Link></li>
              <li><Link href="/cart" className="transition-colors hover:text-foreground">Keranjang</Link></li>
            </ul>
          </nav>

          {/* Contact */}
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-foreground">Hubungi Kami</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" /> Jakarta, Indonesia
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" /> halo@kavana.id
              </li>
            </ul>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {["BCA", "Mandiri", "GoPay", "OVO", "QRIS", "VISA"].map((p) => (
                <span
                  key={p}
                  className="rounded-md border border-border bg-background px-2 py-1 text-[10px] font-semibold text-muted-foreground"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} KAVANA. Demo portfolio — dibangun dengan Next.js &amp; Prisma.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="/kavana-source.zip"
              download
              className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 font-semibold text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              aria-label="Download source code project (ZIP)"
            >
              <Download className="h-3.5 w-3.5" /> Download Source (ZIP)
            </a>
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> Pembayaran aman (mock)
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" /> Kirim se-Indonesia
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Garansi 30 hari
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
