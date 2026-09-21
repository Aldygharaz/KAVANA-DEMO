import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, ApiError, handleError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { getProductsWithStats } from "@/lib/product-queries";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().trim().min(3, "Nama produk minimal 3 karakter").optional(),
  description: z
    .string()
    .trim()
    .min(10, "Deskripsi minimal 10 karakter")
    .optional(),
  price: z.coerce.number().positive("Harga harus lebih dari 0").optional(),
  // null = hapus harga coret
  compareAtPrice: z
    .coerce
    .number()
    .positive("Harga coret harus lebih dari 0")
    .nullable()
    .optional(),
  stock: z.coerce
    .number()
    .int("Stok harus bilangan bulat")
    .min(0, "Stok tidak boleh negatif")
    .optional(),
  categorySlug: z.string().trim().min(1).optional(),
  // null = hapus gambar
  image: z.string().trim().nullable().optional(),
  featured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

interface ProductUpdateData {
  name?: string;
  description?: string;
  price?: number;
  compareAtPrice?: number | null;
  stock?: number;
  images?: string;
  featured?: boolean;
  isActive?: boolean;
  categoryId?: string;
}

/** PATCH /api/admin/products/[id] — update parsial */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error, auth.status);
    const { id } = await params;

    const body: unknown = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      const msg =
        parsed.error.issues.map((i) => i.message).join(", ") ||
        "Data produk tidak valid";
      return fail(msg, 422);
    }
    const data = parsed.data;

    const existing = await db.product.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new ApiError("Produk tidak ditemukan", 404);

    const updateData: ProductUpdateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.compareAtPrice !== undefined) {
      // Harga coret hanya valid jika lebih tinggi dari harga jual (final)
      const finalPrice = data.price !== undefined ? data.price : undefined;
      const currentPrice =
        finalPrice ??
        (
          await db.product.findUnique({ where: { id }, select: { price: true } })
        )?.price;
      updateData.compareAtPrice =
        data.compareAtPrice && currentPrice && data.compareAtPrice > currentPrice
          ? data.compareAtPrice
          : null;
    }
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.featured !== undefined) updateData.featured = data.featured;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.image !== undefined) {
      // images disimpan sebagai JSON string array tunggal
      updateData.images = data.image
        ? JSON.stringify([data.image])
        : JSON.stringify([]);
    }
    if (data.categorySlug !== undefined) {
      const category = await db.category.findUnique({
        where: { slug: data.categorySlug },
      });
      if (!category) throw new ApiError("Kategori tidak ditemukan", 422);
      updateData.categoryId = category.id;
    }

    await db.product.update({ where: { id }, data: updateData });

    const [product] = await getProductsWithStats({ where: { id } });
    return ok({
      product: {
        ...product,
        description: updateData.description,
        featured: updateData.featured,
        isActive: updateData.isActive,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}

/** DELETE /api/admin/products/[id] — soft delete jika ada riwayat pesanan */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error, auth.status);
    const { id } = await params;

    const product = await db.product.findUnique({
      where: { id },
      select: { id: true, _count: { select: { orderItems: true } } },
    });
    if (!product) throw new ApiError("Produk tidak ditemukan", 404);

    if (product._count.orderItems > 0) {
      await db.product.update({ where: { id }, data: { isActive: false } });
      return ok({ softDeleted: true });
    }

    await db.product.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
