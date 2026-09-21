import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/api-helpers";
import { sendMockEmail } from "@/lib/email-outbox";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").max(72),
  phone: z.string().min(8, "Nomor telepon tidak valid").max(20).optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Data tidak valid", 422);
    }
    const { name, email, password, phone } = parsed.data;

    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return fail("Email sudah terdaftar. Silakan masuk.", 409);
    }

    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashPassword(password),
        phone: phone || null,
        role: "CUSTOMER",
      },
    });

    await createSession(user.id);

    // Email selamat datang (mock — masuk ke outbox admin)
    await sendMockEmail({
      to: user.email,
      subject: "Selamat Datang di KAVANA!",
      body: [
        `Halo ${user.name},`,
        ``,
        `Terima kasih sudah mendaftar di KAVANA — lifestyle & goods.`,
        `Gunakan kode KAVANA10 untuk diskon 10% pada pembelian pertamamu.`,
        ``,
        `Selamat berbelanja!`,
        `— Tim KAVANA`,
      ].join("\n"),
      type: "WELCOME",
    });

    return ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        address: user.address,
        city: user.city,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
