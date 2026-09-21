import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, ApiError, handleError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** DELETE /api/admin/emails/[id] — hapus satu email dari outbox (admin). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error, auth.status);
    const { id } = await params;

    const existing = await db.emailLog.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new ApiError("Email tidak ditemukan", 404);

    await db.emailLog.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
