import "server-only";

import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const SESSION_COOKIE = "kavana_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  address: string | null;
  city: string | null;
};

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const candidate = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), candidate);
  } catch {
    return false;
  }
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({ data: { token, userId, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // sandbox http
    expires: expiresAt,
    path: "/",
  });
  return token;
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const session = await db.session.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!session) return null;
    if (session.expiresAt.getTime() < Date.now()) {
      // expired — clean up
      await db.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    const u = session.user;
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      phone: u.phone,
      address: u.address,
      city: u.city,
    };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } }).catch(() => {});
  }
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
}

export async function requireUser(): Promise<
  { ok: true; user: SafeUser } | { ok: false; status: 401; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, status: 401, error: "Silakan login terlebih dahulu." };
  return { ok: true, user };
}

export async function requireAdmin(): Promise<
  { ok: true; user: SafeUser } | { ok: false; status: 401 | 403; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, status: 401, error: "Silakan login terlebih dahulu." };
  if (user.role !== "ADMIN") return { ok: false, status: 403, error: "Akses khusus admin." };
  return { ok: true, user };
}
