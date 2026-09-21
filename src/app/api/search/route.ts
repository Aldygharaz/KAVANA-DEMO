import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, handleError } from "@/lib/api-helpers";
import { parseProductImages } from "@/lib/order-utils";

export const dynamic = "force-dynamic";

/**
 * Search autocomplete (FR-10): kembalikan produk yang cocok
 * hanya ketika query >= 2 karakter.
 */
export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
    if (q.length < 2) {
      return ok({ products: [] });
    }

    const products = await db.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
        ],
      },
      take: 8,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: { category: true },
    });

    return ok({
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        image: parseProductImages(p.images)[0] ?? null,
        categoryName: p.category?.name ?? "",
      })),
    });
  } catch (e) {
    return handleError(e);
  }
}
