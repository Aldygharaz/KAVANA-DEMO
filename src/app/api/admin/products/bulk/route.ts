import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const bulkSchema = z.object({
  ids: z
    .array(z.string().min(1))
    .min(1, "Pilih minimal 1 produk")
    .max(100, "Maksimal 100 produk sekali aksi"),
  action: z.enum(["activate", "deactivate"], {
    message: "Aksi tidak valid",
  }),
});

/**
 * POST /api/admin/products/bulk — aksi massal aktif/nonaktif (admin).
 * → { updated: number }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error, auth.status);

    const body: unknown = await req.json().catch(() => null);
    const parsed = bulkSchema.safeParse(body);
    if (!parsed.success) {
      const msg =
        parsed.error.issues[0]?.message ?? "Data tidak valid";
      return fail(msg, 422);
    }
    const { ids, action } = parsed.data;

    const res = await db.product.updateMany({
      where: { id: { in: ids } },
      data: { isActive: action === "activate" },
    });

    return ok({ updated: res.count, action });
  } catch (e) {
    return handleError(e);
  }
}
