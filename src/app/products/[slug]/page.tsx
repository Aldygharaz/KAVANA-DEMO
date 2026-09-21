import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ShieldCheck, RotateCcw, Truck, Tag } from "lucide-react";
import { db } from "@/lib/db";
import { parseProductImages } from "@/lib/order-utils";
import { getProductsWithStats } from "@/lib/product-queries";
import { getHelpfulCounts } from "@/lib/review-helpful";
import { formatRupiah } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductGallery } from "./product-gallery";
import { ProductActions } from "./product-actions";
import { StickyBuyBar } from "./sticky-buy-bar";
import { ProductReviews } from "./product-reviews";
import { ProductCard } from "@/components/store/product-card";
import { RecentlyViewedTracker } from "@/components/store/recently-viewed-tracker";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getData(slug: string) {
  const product = await db.product.findUnique({
    where: { slug },
    include: { category: true },
  });
  if (!product || !product.isActive) return null;

  const [reviews, related] = await Promise.all([
    db.review.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
    getProductsWithStats({
      where: { isActive: true, categoryId: product.categoryId, id: { not: product.id } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  // "Pembeli terverifikasi": reviewer punya order non-CANCELLED yang memuat produk ini
  const reviewerIds = [...new Set(reviews.map((r) => r.userId))];
  const verifiedItems =
    reviewerIds.length > 0
      ? await db.orderItem.findMany({
          where: {
            productId: product.id,
            order: {
              userId: { in: reviewerIds },
              status: { in: ["PAID", "SHIPPED", "COMPLETED"] },
            },
          },
          select: { order: { select: { userId: true } } },
        })
      : [];
  const verifiedUserIds = new Set(verifiedItems.map((it) => it.order.userId));

  // helpfulCount via raw SQL (tahan cache PrismaClient lama — lihat lib/review-helpful)
  const helpfulMap = await getHelpfulCounts(product.id);

  const reviewCount = reviews.length;
  const avgRating =
    reviewCount > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviewCount : null;

  return {
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      stock: product.stock,
      images: parseProductImages(product.images),
      categoryName: product.category?.name ?? "",
      categorySlug: product.category?.slug ?? "",
      avgRating,
      reviewCount,
    },
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      userName: r.user?.name ?? "Pengguna",
      helpfulCount: helpfulMap[r.id] ?? 0,
      verified: verifiedUserIds.has(r.userId),
    })),
    related,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findUnique({ where: { slug }, select: { name: true, description: true } });
  if (!product) return { title: "Produk Tidak Ditemukan" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await getData(slug);
  if (!data) notFound();

  const { product, reviews, related } = data;

  // Diskon produk (harga coret)
  const hasDiscount =
    product.compareAtPrice != null && product.compareAtPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / (product.compareAtPrice as number)) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Riwayat "Terakhir Dilihat" (client-side, tanpa render) */}
      <RecentlyViewedTracker
        item={{
          productId: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.images[0] ?? null,
          stock: product.stock,
        }}
      />
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Beranda
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/products" className="transition-colors hover:text-foreground">
          Produk
        </Link>
        {product.categorySlug && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              href={`/products?category=${product.categorySlug}`}
              className="transition-colors hover:text-foreground"
            >
              {product.categoryName}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span aria-current="page" className="truncate font-medium text-foreground">
          {product.name}
        </span>
      </nav>

      {/* Detail utama */}
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} name={product.name} />

        <div className="flex flex-col">
          {product.categoryName && (
            <div>
              <Badge variant="secondary" className="rounded-full font-medium">
                {product.categoryName}
              </Badge>
            </div>
          )}
          <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {reviews.length > 0 ? (
              <span className="flex items-center gap-1.5">
                <span className="font-bold text-amber-500">★</span>
                <span className="font-semibold">{(product.avgRating ?? 0).toFixed(1)}</span>
                <span className="text-muted-foreground">
                  ({product.reviewCount} ulasan)
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">Belum ada ulasan</span>
            )}
          </div>

          {/* Harga + harga coret + badge hemat */}
          <div className="mt-4">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <p className="text-3xl font-extrabold tracking-tight text-primary">
                {formatRupiah(product.price)}
              </p>
              {hasDiscount && (
                <>
                  <span className="text-lg font-medium text-muted-foreground line-through">
                    {formatRupiah(product.compareAtPrice as number)}
                  </span>
                  <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-white">
                    -{discountPct}%
                  </span>
                </>
              )}
            </div>
            {hasDiscount && (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <Tag className="size-4" aria-hidden />
                Hemat {formatRupiah((product.compareAtPrice as number) - product.price)}
              </p>
            )}
          </div>

          <Separator className="my-5" />

          <ProductActions
            productId={product.id}
            slug={product.slug}
            name={product.name}
            price={product.price}
            image={product.images[0] ?? null}
            stock={product.stock}
          />

          {/* Bar beli tempel (mobile) — muncul saat kotak aksi keluar viewport */}
          <StickyBuyBar
            productId={product.id}
            slug={product.slug}
            name={product.name}
            price={product.price}
            image={product.images[0] ?? null}
            stock={product.stock}
          />

          {/* Deskripsi */}
          <div className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Deskripsi Produk
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {product.description}
            </p>
          </div>

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-1 gap-2 rounded-xl border border-border bg-secondary/50 p-4 sm:grid-cols-3">
            <span className="flex items-center gap-2 text-xs font-medium">
              <Truck className="h-4 w-4 text-primary" /> Gratis ongkir ≥ Rp500rb
            </span>
            <span className="flex items-center gap-2 text-xs font-medium">
              <RotateCcw className="h-4 w-4 text-primary" /> Garansi 30 hari
            </span>
            <span className="flex items-center gap-2 text-xs font-medium">
              <ShieldCheck className="h-4 w-4 text-primary" /> Pembayaran aman
            </span>
          </div>
        </div>
      </div>

      {/* Ulasan */}
      <ProductReviews
        slug={product.slug}
        reviews={reviews}
        avgRating={product.avgRating}
        reviewCount={product.reviewCount}
      />

      {/* Produk terkait */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-14">
          <h2 id="related-heading" className="text-xl font-extrabold tracking-tight">
            Produk Terkait
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
