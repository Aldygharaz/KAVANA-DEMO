import { db } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** POST /api/admin/emails/read-all — tandai SEMUA email sudah dibaca (admin). */
export async function POST() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error, auth.status);

    const res = await db.emailLog.updateMany({
      where: { readAt: null },
      data: { readAt: new Date() },
    });
    return ok({ success: true, marked: res.count });
  } catch (e) {
    return handleError(e);
  }
}
