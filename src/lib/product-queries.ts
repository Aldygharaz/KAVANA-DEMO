import "server-only";

import { db } from "@/lib/db";
import { parseProductImages } from "@/lib/order-utils";
import type { ProductCardData } from "@/lib/types";
import { Prisma } from "@/lib/prisma-client";

export interface ProductListOptions {
  where?: Prisma.ProductWhereInput;
  orderBy?: Prisma.ProductOrderByWithRelationInput;
  take?: number;
  skip?: number;
}

/** Ambil produk + kategori + agregat rating, siap untuk ProductCard */
export async function getProductsWithStats(
  opts: ProductListOptions = {}
): Promise<ProductCardData[]> {
  const products = await db.product.findMany({
    where: opts.where,
    orderBy: opts.orderBy,
    take: opts.take,
    skip: opts.skip,
    include: {
      category: true,
      reviews: { select: { rating: true } },
    },
  });

  // Jumlah terjual (qty dari order terbayar) — satu query groupBy untuk semua produk
  const productIds = products.map((p) => p.id);
  const soldGroups =
    productIds.length > 0
      ? await db.orderItem.groupBy({
          by: ["productId"],
          where: {
            productId: { in: productIds },
            order: { status: { in: ["PAID", "SHIPPED", "COMPLETED"] } },
          },
          _sum: { quantity: true },
        })
      : [];
  const soldMap = new Map(soldGroups.map((g) => [g.productId, g._sum.quantity ?? 0]));

  return products.map((p) => {
    const count = p.reviews.length;
    const avg = count > 0 ? p.reviews.reduce((s, r) => s + r.rating, 0) / count : null;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      stock: p.stock,
      image: parseProductImages(p.images)[0] ?? null,
      categoryName: p.category?.name,
      categorySlug: p.category?.slug,
      avgRating: avg,
      reviewCount: count,
      soldCount: soldMap.get(p.id) ?? 0,
      createdAt: p.createdAt.toISOString(),
    };
  });
}

export async function countProducts(where?: Prisma.ProductWhereInput): Promise<number> {
  return db.product.count({ where });
}
