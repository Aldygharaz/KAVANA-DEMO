import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Headset, RotateCcw, ShieldCheck, Truck, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { getProductsWithStats } from "@/lib/product-queries";
import { ProductCard } from "@/components/store/product-card";
import { RecentlyViewedStrip } from "@/components/store/recently-viewed-strip";
import { TestimonialsSection } from "@/components/store/testimonials-section";
import { FaqSection } from "@/components/store/faq-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const CATEGORY_TILES = [
  { slug: "apparel", name: "Apparel", desc: "Kaos, hoodie & kemeja", gradient: "from-stone-200 to-amber-100" },
  { slug: "aksesoris", name: "Aksesoris", desc: "Tas, dompet & perhiasan", gradient: "from-amber-100 to-orange-100" },
  { slug: "gadget", name: "Gadget", desc: "Audio, wearable & power", gradient: "from-orange-100 to-rose-100" },
  { slug: "rumah", name: "Rumah", desc: "Mug, lilin & lampu", gradient: "from-rose-100 to-stone-200" },
];

const TRUST_ITEMS = [
  { icon: Truck, title: "Gratis Ongkir", desc: "Min. belanja Rp500rb" },
  { icon: ShieldCheck, title: "Pembayaran Aman", desc: "Mock gateway — tanpa risiko" },
  { icon: RotateCcw, title: "Garansi 30 Hari", desc: "Bisa tukar jika tidak cocok" },
  { icon: Headset, title: "CS Ramah", desc: "Respon cepat setiap hari" },
];

export default async function HomePage() {
  const [featured, latest, categories] = await Promise.all([
    getProductsWithStats({
      where: { featured: true, isActive: true },
      orderBy: { createdAt: "asc" },
      take: 8,
    }),
    getProductsWithStats({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-secondary">
        {/* Blob dekoratif hangat (non-interaktif) */}
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 right-[10%] size-80 rounded-full bg-amber-500/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute right-1/3 top-10 size-40 rounded-full bg-rose-400/10 blur-2xl" />
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-20 lg:px-8">
          <div className="animate-fade-up space-y-6">
            <Badge variant="outline" className="gap-1.5 rounded-full border-primary/30 bg-background px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3 w-3" /> Koleksi Terbaru 2025
            </Badge>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Lifestyle &amp; goods untuk{" "}
              <span className="text-primary">keseharian</span> yang lebih baik.
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Kurasi apparel, aksesoris, gadget, dan perlengkapan rumah dengan kualitas premium.
              Belanja mudah, kirim cepat, garansi jelas.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/products">
                  Mulai Belanja <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full bg-background">
                <Link href="/products?sort=rating">Produk Terlaris</Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="text-base font-bold text-foreground">16+</span> produk kurasi
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-base font-bold text-foreground">30+</span> review pelanggan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-base font-bold text-foreground">4.7★</span> rata-rata rating
              </span>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="grid grid-cols-2 gap-4">
              {featured.slice(0, 2).map((p, i) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className={`group relative aspect-square overflow-hidden rounded-2xl border border-border shadow-sm transition-transform hover:scale-[1.02] ${
                    i === 0 ? "translate-y-6" : "-translate-y-2"
                  }`}
                >
                  {p.image && (
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      priority // dua gambar hero di atas fold (LCP)
                      sizes="25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-xs font-medium text-white/90">{p.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Trust badges ===== */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:px-6 lg:grid-cols-4 lg:px-8">
          {TRUST_ITEMS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{title}</p>
                <p className="truncate text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Categories ===== */}
      <section className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Jelajahi Kategori</h2>
            <p className="text-sm text-muted-foreground">Temukan yang kamu butuhkan per kategori</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {CATEGORY_TILES.map((c) => (
            <Link
              key={c.slug}
              href={`/products?category=${c.slug}`}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-gradient-to-br ${c.gradient} p-5 transition-transform hover:scale-[1.02]`}
            >
              <div>
                <p className="text-lg font-bold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.desc}</p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                Lihat koleksi
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== Featured products ===== */}
      <section className="mx-auto w-full max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Pilihan Kurasi</h2>
            <p className="text-sm text-muted-foreground">Produk andalan yang paling disukai pelanggan</p>
          </div>
          <Button asChild variant="ghost" className="hidden rounded-full text-primary sm:inline-flex">
            <Link href="/products">
              Lihat semua <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      </section>

      {/* ===== Latest products ===== */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-5">
          <h2 className="text-2xl font-bold tracking-tight">Baru Datang</h2>
          <p className="text-sm text-muted-foreground">Baru saja ditambahkan ke katalog</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {latest.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* ===== Recently viewed (client, hanya bila ada riwayat) ===== */}
      <RecentlyViewedStrip />

      {/* ===== Testimoni (ulasan asli dari DB) ===== */}
      <TestimonialsSection />

      {/* ===== FAQ ===== */}
      <FaqSection />

      {/* ===== CTA banner ===== */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-10 text-center text-primary-foreground sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10"
          />
          <h2 className="relative text-2xl font-bold sm:text-3xl">Siap upgrade gaya hidupmu?</h2>
          <p className="relative mx-auto mt-2 max-w-xl text-sm text-primary-foreground/80 sm:text-base">
            Daftar sekarang dan lakukan pesanan pertamamu — semua alur lengkap dari browsing sampai
            pelacakan order, gratis tanpa transaksi nyata.
          </p>
          <div className="relative mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary" className="rounded-full">
              <Link href="/register">Daftar Gratis</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link href="/products">Lihat Katalog</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
