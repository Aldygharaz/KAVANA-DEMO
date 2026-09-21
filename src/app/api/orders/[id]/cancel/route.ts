import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, handleError, ApiError } from "@/lib/api-helpers";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/orders/[id]/cancel — wajib login, hanya pemilik pesanan.
 * State machine: hanya PENDING yang boleh dibatalkan pelanggan.
 * Stok belum dipotong saat PENDING (dipotong saat bayar), jadi tidak ada pengembalian stok.
 * → { order }
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return fail(auth.error, auth.status);
    const user = auth.user;

    const { id } = await params;

    const order = await db.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }], userId: user.id },
      include: { items: true },
    });

    if (!order) {
      const exists = await db.order.findFirst({
        where: { OR: [{ id }, { orderNumber: id }] },
        select: { id: true },
      });
      if (!exists) throw new ApiError("Pesanan tidak ditemukan.", 404);
      throw new ApiError("Anda tidak memiliki akses ke pesanan ini.", 403);
    }

    if (order.status === "CANCELLED") {
      throw new ApiError("Pesanan ini sudah dibatalkan sebelumnya.", 409);
    }
    if (order.status !== "PENDING") {
      throw new ApiError(
        "Pesanan yang sudah dibayar tidak bisa dibatalkan. Hubungi CS untuk bantuan.",
        422
      );
    }

    const updated = await db.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
      include: { items: true },
    });

    return ok({ order: updated });
  } catch (e) {
    return handleError(e);
  }
}
