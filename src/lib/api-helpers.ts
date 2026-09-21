import { NextResponse } from "next/server";

/** Standard API response helpers */

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(error: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status });
}

/** Throw inside route handler try/catch -> mapped to response */
export class ApiError extends Error {
  status: number;
  extra?: Record<string, unknown>;
  constructor(message: string, status = 400, extra?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export function handleError(e: unknown) {
  if (e instanceof ApiError) {
    return fail(e.message, e.status, e.extra);
  }
  console.error("[API ERROR]", e);
  const message = e instanceof Error ? e.message : "Terjadi kesalahan pada server.";
  return fail(message, 500);
}
