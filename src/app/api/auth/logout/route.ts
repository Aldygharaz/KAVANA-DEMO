import { destroySession, getCurrentUser } from "@/lib/auth";
import { ok, handleError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await destroySession();
    return ok({ success: true });
  } catch (e) {
    return handleError(e);
  }
}
