import { db } from "@/lib/db";
import { ok, handleError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/**
 * GET /api/categories → { categories: [{id, name, slug}] }
 */
export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    });
    return ok({ categories });
  } catch (e) {
    return handleError(e);
  }
}
