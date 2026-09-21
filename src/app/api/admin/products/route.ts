import type { NextRequest } from "next/server";
import { z } from "zod";
import type { Prisma } from "@/lib/prisma-client";
import { db } from "@/lib/db";
import { ok, fail, ApiError, handleError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { getProductsWithStats } from "@/lib/product-queries";

export const dynamic = "force-dynamic";

/** Slugify nama produk: lowercase, tanpa aksen, strip non-alfanumerik */
function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "produk";
}

/** Pastikan slug unik dengan suffix -2, -3, dst */
async function uniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let n = 1;
  for (;;) {
    const exists = await db.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

const createSchema = z.object({
  name: z.string().trim().min(3, "Nama produk minimal 3 karakter"),
  description: z.string().trim().min(10, "Deskripsi minimal 10 karakter"),
  price: z.coerce.number().positive("Harga harus lebih dari 0"),
  compareAtPrice: z
    .coerce.number()
    .positive("Harga coret harus lebih dari 0")
    .nullable()
    .optional(),
  stock: z
    .coerce.number()
    .int("Stok harus bilangan bulat")
    .min(0, "Stok tidak boleh negatif"),
  categorySlug: z.string().trim().min(1, "Kategori wajib dipilih"),
  image: z.string().trim().optional(),
  featured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin/products — daftar produk (termasuk nonaktif) + statistik.
 * Server-side pagination/search/filter/sort:
 *   ?q=<cari nama/slug>&category=<slug|all>&status=<all|active|inactive|low>
 *   &sort=<newest|oldest|price-asc|price-desc|stock-asc|name-asc>
 *   &page=1&pageSize=10
 * → { products, total, page, pageSize, totalPages, counts }
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error, auth.status);

    const sp = req.nextUrl.searchParams;
    const q = (sp.get("q") ?? "").trim();
    const categorySlug = (sp.get("category") ?? "all").trim();
    const status = (sp.get("status") ?? "all").trim();
    const sortRaw = (sp.get("sort") ?? "newest").trim();
    const pageRaw = Number.parseInt(sp.get("page") ?? "1", 10);
    const sizeRaw = Number.parseInt(sp.get("pageSize") ?? "10", 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const pageSize =
      Number.isFinite(sizeRaw) && sizeRaw >= 5 && sizeRaw <= 50 ? sizeRaw : 10;

    const SORTS = new Set([
      "newest",
      "oldest",
      "price-asc",
      "price-desc",
      "stock-asc",
      "name-asc",
    ]);
    const sort = SORTS.has(sortRaw) ? sortRaw : "newest";

    const where: Prisma.ProductWhereInput = {};
    if (q) {
      where.OR = [{ name: { contains: q } }, { slug: { contains: q } }];
    }
    if (categorySlug && categorySlug !== "all") {
      const cat = await db.category.findUnique({
        where: { slug: categorySlug },
        select: { id: true },
      });
      where.categoryId = cat?.id ?? "__none__";
    }
    if (status === "active") where.isActive = true;
    else if (status === "inactive") where.isActive = false;
    else if (status === "low") where.stock = { lte: 5 };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === "oldest"
        ? { createdAt: "asc" }
        : sort === "price-asc"
          ? { price: "asc" }
          : sort === "price-desc"
            ? { price: "desc" }
            : sort === "stock-asc"
              ? { stock: "asc" }
              : sort === "name-asc"
                ? { name: "asc" }
                : { createdAt: "desc" };

    const statusCountsPromise = (async () => ({
      all: await db.product.count(),
      active: await db.product.count({ where: { isActive: true } }),
      inactive: await db.product.count({ where: { isActive: false } }),
      low: await db.product.count({ where: { stock: { lte: 5 } } }),
    }))();

    const [products, total, statusCounts] = await Promise.all([
      getProductsWithStats({
        where,
        orderBy,
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      db.product.count({ where }),
      statusCountsPromise,
    ]);

    const productIds = products.map((p) => p.id);
    const extras =
      productIds.length > 0
        ? await db.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, description: true, featured: true, isActive: true },
          })
        : [];
    const extraMap = new Map(extras.map((e) => [e.id, e]));

    return ok({
      products: products.map((p) => ({
        ...p,
        description: extraMap.get(p.id)?.description ?? "",
        featured: extraMap.get(p.id)?.featured ?? false,
        isActive: extraMap.get(p.id)?.isActive ?? true,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      counts: statusCounts,
    });
  } catch (e) {
    return handleError(e);
  }
}

/** POST /api/admin/products — buat produk baru */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error, auth.status);

    const body: unknown = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      const msg =
        parsed.error.issues.map((i) => i.message).join(", ") ||
        "Data produk tidak valid";
      return fail(msg, 422);
    }
    const data = parsed.data;

    const category = await db.category.findUnique({
      where: { slug: data.categorySlug },
    });
    if (!category) throw new ApiError("Kategori tidak ditemukan", 422);

    const slug = await uniqueSlug(slugify(data.name));

    const product = await db.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        price: data.price,
        compareAtPrice:
          data.compareAtPrice && data.compareAtPrice > data.price
            ? data.compareAtPrice
            : null,
        stock: data.stock,
        images: data.image ? JSON.stringify([data.image]) : JSON.stringify([]),
        featured: data.featured ?? false,
        isActive: data.isActive ?? true,
        categoryId: category.id,
      },
    });

    return ok(
      {
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          stock: product.stock,
          image: data.image ?? null,
          categoryName: category.name,
          categorySlug: category.slug,
          avgRating: null,
          reviewCount: 0,
          featured: product.featured,
          isActive: product.isActive,
          createdAt: product.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (e) {
    return handleError(e);
  }
}
