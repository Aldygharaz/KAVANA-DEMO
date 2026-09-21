import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handleError, ApiError } from "@/lib/api-helpers";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  rating: z.number().int().min(1, "Rating minimal 1").max(5, "Rating maksimal 5"),
  comment: z.string().trim().min(3, "Komentar minimal 3 karakter").max(1000, "Komentar maksimal 1000 karakter"),
});

/**
 * POST /api/products/[slug]/reviews — wajib login. Upsert (1 user 1 review per produk).
 * → { review }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return fail(auth.error, auth.status);
    const user = auth.user;

    const { slug } = await params;
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Data tidak valid", 422);
    }

    const product = await db.product.findUnique({ where: { slug }, select: { id: true, isActive: true } });
    if (!product || !product.isActive) {
      throw new ApiError("Produk tidak ditemukan.", 404);
    }

    const review = await db.review.upsert({
      where: { userId_productId: { userId: user.id, productId: product.id } },
      create: {
        userId: user.id,
        productId: product.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      },
      update: {
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      },
      include: { user: { select: { name: true } } },
    });

    return ok({
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
        userName: review.user?.name ?? user.name,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
