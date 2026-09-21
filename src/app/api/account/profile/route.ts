import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api-helpers";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter").max(100, "Nama maksimal 100 karakter"),
  phone: z
    .string()
    .trim()
    .min(8, "Nomor telepon minimal 8 digit")
    .max(20, "Nomor telepon maksimal 20 digit"),
  address: z.string().trim().max(500, "Alamat maksimal 500 karakter").optional().or(z.literal("")),
  city: z.string().trim().max(100, "Kota maksimal 100 karakter").optional().or(z.literal("")),
});

/**
 * PATCH /api/account/profile — wajib login.
 * Perbarui data profil: nama, telepon, alamat, kota (email tidak boleh diubah).
 * → { user }
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return fail(auth.error, auth.status);

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Data tidak valid", 422);
    }
    const data = parsed.data;

    const user = await db.user.update({
      where: { id: auth.user.id },
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address || null,
        city: data.city || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        city: true,
      },
    });

    return ok({ user });
  } catch (e) {
    return handleError(e);
  }
}

/**
 * GET /api/account/profile — wajib login. Profil user + ringkasan aktivitas.
 * → { user, stats: { totalOrders, completedOrders, memberSince } }
 */
export async function GET() {
  try {
    const auth = await requireUser();
    if (!auth.ok) return fail(auth.error, auth.status);

    const [user, totalOrders, completedOrders] = await Promise.all([
      db.user.findUnique({
        where: { id: auth.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          address: true,
          city: true,
          createdAt: true,
        },
      }),
      db.order.count({ where: { userId: auth.user.id } }),
      db.order.count({ where: { userId: auth.user.id, status: "COMPLETED" } }),
    ]);

    if (!user) return fail("Pengguna tidak ditemukan.", 404);

    return ok({
      user,
      stats: { totalOrders, completedOrders, memberSince: user.createdAt.toISOString() },
    });
  } catch (e) {
    return handleError(e);
  }
}
