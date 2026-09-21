import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, ApiError, handleError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** POST /api/admin/emails/[id]/read — tandai email sudah dibaca (admin). */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error, auth.status);
    const { id } = await params;

    const existing = await db.emailLog.findUnique({
      where: { id },
      select: { id: true, readAt: true },
    });
    if (!existing) throw new ApiError("Email tidak ditemukan", 404);

    if (!existing.readAt) {
      await db.emailLog.update({
        where: { id },
        data: { readAt: new Date() },
      });
    }
    return ok({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
