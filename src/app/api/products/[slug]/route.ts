import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handleError, ApiError } from "@/lib/api-helpers";
import { parseProductImages } from "@/lib/order-utils";
import { getProductsWithStats } from "@/lib/product-queries";
import { getHelpfulCounts } from "@/lib/review-helpful";

export const dynamic = "force-dynamic";

/**
 * GET /api/products/[slug]
 * → { product: {...detail, images[], categoryName, categorySlug, avgRating, reviewCount },
 *     related: ProductCardData[] (4, kategori sama),
 *     reviews: { id, rating, comment, createdAt, userName }[] }
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const product = await db.product.findUnique({
      where: { slug },
      include: { category: true },
    });
    if (!product || !product.isActive) {
      throw new ApiError("Produk tidak ditemukan.", 404);
    }

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

    const reviewCount = reviews.length;
    const avgRating =
      reviewCount > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviewCount : null;

    // helpfulCount via raw SQL (tahan cache PrismaClient lama — lihat lib/review-helpful)
    const helpfulMap = await getHelpfulCounts(product.id);

    return ok({
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        stock: product.stock,
        featured: product.featured,
        images: parseProductImages(product.images),
        categoryName: product.category?.name ?? null,
        categorySlug: product.category?.slug ?? null,
        avgRating,
        reviewCount,
        createdAt: product.createdAt.toISOString(),
      },
      related,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        userName: r.user?.name ?? "Pengguna",
        helpfulCount: helpfulMap[r.id] ?? 0,
      })),
    });
  } catch (e) {
    return handleError(e);
  }
}
