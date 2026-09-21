import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const EMAIL_TYPES = new Set([
  "PASSWORD_RESET",
  "WELCOME",
  "ORDER_PAID",
  "ORDER_SHIPPED",
  "ORDER_CANCELLED",
]);

/**
 * GET /api/admin/emails — outbox email mock (admin).
 *   ?type=<EMAIL_TYPE>&unread=1&page=1&pageSize=15
 *   ?countOnly=1 → hanya { unreadCount }
 * → { emails, total, page, pageSize, totalPages, unreadCount }
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error, auth.status);

    const sp = req.nextUrl.searchParams;

    const unreadCount = await db.emailLog.count({ where: { readAt: null } });

    if (sp.get("countOnly") === "1") {
      return ok({ unreadCount });
    }

    const type = (sp.get("type") ?? "all").trim();
    const unreadOnly = sp.get("unread") === "1";
    const pageRaw = Number.parseInt(sp.get("page") ?? "1", 10);
    const sizeRaw = Number.parseInt(sp.get("pageSize") ?? "15", 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const pageSize =
      Number.isFinite(sizeRaw) && sizeRaw >= 5 && sizeRaw <= 50 ? sizeRaw : 15;

    const where: { type?: string; readAt?: null } = {};
    if (type && type !== "all" && EMAIL_TYPES.has(type)) where.type = type;
    if (unreadOnly) where.readAt = null;

    const [emails, total] = await Promise.all([
      db.emailLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      db.emailLog.count({ where }),
    ]);

    return ok({
      emails,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      unreadCount,
    });
  } catch (e) {
    return handleError(e);
  }
}
