import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handleError } from "@/lib/api-helpers";
import { getProductsWithStats, countProducts } from "@/lib/product-queries";
import type { Prisma } from "@/lib/prisma-client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12; // FR-1

const SORTS = new Set(["newest", "price-asc", "price-desc", "rating"]);

/**
 * GET /api/products?page=1&category=<slug|all>&sort=<newest|price-asc|price-desc|rating>&q=<query>
 * → { products: ProductCardData[], total, page, pageSize, totalPages }
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const pageRaw = Number.parseInt(sp.get("page") ?? "1", 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const category = (sp.get("category") ?? "all").trim();
    const sortRaw = (sp.get("sort") ?? "newest").trim();
    const sort = SORTS.has(sortRaw) ? sortRaw : "newest";
    const q = (sp.get("q") ?? "").trim();

    const where: Prisma.ProductWhereInput = { isActive: true };

    if (category && category !== "all") {
      const cat = await db.category.findUnique({ where: { slug: category }, select: { id: true } });
      // Kategori tidak dikenal → hasil kosong, bukan error.
      where.categoryId = cat?.id ?? "__none__";
    }

    if (q.length >= 2) {
      where.AND = [
        {
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
          ],
        },
      ];
    }

    // sort=rating: urutkan berdasar rating agregat (dataset kecil — hitung di JS)
    if (sort === "rating") {
      const all = await getProductsWithStats({ where });
      all.sort((a, b) => {
        const ra = a.avgRating ?? -1;
        const rb = b.avgRating ?? -1;
        if (rb !== ra) return rb - ra;
        return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
      });
      const total = all.length;
      const start = (page - 1) * PAGE_SIZE;
      return ok({
        products: all.slice(start, start + PAGE_SIZE),
        total,
        page,
        pageSize: PAGE_SIZE,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      });
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === "price-asc"
        ? { price: "asc" }
        : sort === "price-desc"
          ? { price: "desc" }
          : { createdAt: "desc" };

    const [products, total] = await Promise.all([
      getProductsWithStats({
        where,
        orderBy,
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      countProducts(where),
    ]);

    return ok({
      products,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (e) {
    return handleError(e);
  }
}
