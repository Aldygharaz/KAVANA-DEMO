import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handleError, ApiError } from "@/lib/api-helpers";
import { requireUser } from "@/lib/auth";
import { adjustHelpful } from "@/lib/review-helpful";

export const dynamic = "force-dynamic";

const schema = z.object({
  action: z.enum(["like", "unlike"]),
});

/**
 * POST /api/reviews/[id]/helpful — wajib login.
 * Tambah/kurangi hitungan "Membantu" pada ulasan (via lib/review-helpful, tahan cache client lama).
 * Catatan demo: pelacakan per-user dilakukan di klien (localStorage); server menjaga count >= 0.
 * → { helpfulCount }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return fail(auth.error, auth.status);

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Data tidak valid", 422);
    }

    const exists = await db.review.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new ApiError("Ulasan tidak ditemukan.", 404);

    const helpfulCount = await adjustHelpful(id, parsed.data.action === "like" ? 1 : -1);
    return ok({ helpfulCount });
  } catch (e) {
    return handleError(e);
  }
}
