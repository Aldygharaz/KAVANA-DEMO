import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api-helpers";
import { sendMockEmail } from "@/lib/email-outbox";

export const dynamic = "force-dynamic";

const RESET_TTL_MS = 15 * 60 * 1000; // 15 menit

const schema = z.object({
  email: z.string().email("Email tidak valid"),
});

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 *
 * Selalu membalas pesan generik (anti user-enumeration).
 * MODE DEMO: karena tidak ada layanan email di sandbox, kode 6 digit
 * dikembalikan pada field `demoCode` agar bisa ditampilkan di UI.
 * Di produksi field ini TIDAK dikirim — kode dikirim via email.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Email tidak valid", 422);
    }
    const email = parsed.data.email.trim().toLowerCase();

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      // Tetap 200 dengan pesan generik — jangan bocorkan keberadaan akun
      return ok({
        message:
          "Jika email terdaftar, kode reset telah dikirim. Periksa kotak masuk Anda.",
      });
    }

    // Batalkan token lama yang belum terpakai milik user ini
    await db.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    // Kode 6 digit acak (loop kecil utk jaga uniqueness kolom code)
    let code = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      code = String(Math.floor(100000 + Math.random() * 900000));
      const exists = await db.passwordResetToken.findUnique({ where: { code } });
      if (!exists) break;
      code = "";
    }
    if (!code) return fail("Gagal membuat kode reset. Coba lagi.", 500);

    await db.passwordResetToken.create({
      data: {
        code,
        userId: user.id,
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      },
    });

    // Mock email masuk ke outbox admin (demo; di produksi dikirim via SMTP)
    await sendMockEmail({
      to: user.email,
      subject: "Kode Reset Kata Sandi KAVANA",
      body: [
        `Halo ${user.name},`,
        ``,
        `Kami menerima permintaan reset kata sandi untuk akun Anda.`,
        `Kode reset Anda: ${code} (berlaku 15 menit).`,
        ``,
        `Jika Anda tidak meminta reset ini, abaikan email ini.`,
        `— Tim KAVANA`,
      ].join("\n"),
      type: "PASSWORD_RESET",
    });

    return ok({
      message:
        "Jika email terdaftar, kode reset telah dikirim. Periksa kotak masuk Anda.",
      // DEMO ONLY — jangan kirim field ini di produksi
      demoCode: code,
      expiresInMinutes: 15,
    });
  } catch (e) {
    return handleError(e);
  }
}
