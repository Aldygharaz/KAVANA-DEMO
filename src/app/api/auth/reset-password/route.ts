import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api-helpers";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  code: z.string().regex(/^\d{6}$/, "Kode reset harus 6 digit"),
  newPassword: z.string().min(6, "Password minimal 6 karakter").max(72),
});

/**
 * POST /api/auth/reset-password
 * Body: { email, code, newPassword }
 *
 * Validasi: token ada, milik user dgn email tsb, belum terpakai, belum kedaluwarsa.
 * Sukses → password di-update, semua token reset user dimatikan (usedAt)
 * agar kode yang sama tak bisa dipakai ulang.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Data tidak valid", 422);
    }
    const email = parsed.data.email.trim().toLowerCase();
    const code = parsed.data.code.trim();
    const { newPassword } = parsed.data;

    const user = await db.user.findUnique({ where: { email } });
    if (!user) return fail("Kode reset tidak valid atau sudah kedaluwarsa.", 422);

    const token = await db.passwordResetToken.findUnique({ where: { code } });
    if (!token || token.userId !== user.id) {
      return fail("Kode reset tidak valid atau sudah kedaluwarsa.", 422);
    }
    if (token.usedAt) {
      return fail("Kode reset sudah pernah digunakan. Minta kode baru.", 422);
    }
    if (token.expiresAt.getTime() < Date.now()) {
      return fail("Kode reset sudah kedaluwarsa. Minta kode baru.", 422);
    }

    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { password: hashPassword(newPassword) },
      }),
      db.passwordResetToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Hapus semua sesi login lama demi keamanan (password berubah)
    await db.session.deleteMany({ where: { userId: user.id } }).catch(() => {});

    return ok({ message: "Password berhasil direset. Silakan login dengan password baru." });
  } catch (e) {
    return handleError(e);
  }
}
