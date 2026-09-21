import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handleError, ApiError } from "@/lib/api-helpers";
import { requireUser } from "@/lib/auth";
import { generatePaymentRef } from "@/lib/order-utils";
import { sendMockEmail } from "@/lib/email-outbox";
import { formatRupiah } from "@/lib/format";
import { emitAdminNotification } from "@/lib/realtime-emit";

export const dynamic = "force-dynamic";

const schema = z.object({
  orderNumber: z.string().min(1, "Nomor pesanan wajib ada"),
  paymentMethod: z.enum(["VA_BCA", "VA_MANDIRI", "EWALLET", "CARD"], {
    message: "Metode pembayaran tidak valid",
  }),
});

/**
 * POST /api/payment/mock — simulasi gateway pembayaran (wajib login, order milik user).
 * - Order harus status PENDING.
 * - Di dalam transaksi: re-check stok via updateMany (stock >= qty) → jika gagal 409
 *   "Stok berubah, perbarui keranjang Anda"; kurangi stok (FR-6); set PAID + paymentMethod
 *   + paymentRef + paidAt (FR-5).
 * → { success: true, order }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return fail(auth.error, auth.status);
    const user = auth.user;

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Data tidak valid", 422);
    }
    const { orderNumber, paymentMethod } = parsed.data;

    const order = await db.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });

    if (!order || order.userId !== user.id) {
      throw new ApiError("Pesanan tidak ditemukan.", 404);
    }
    if (order.status === "PAID" || order.status === "SHIPPED" || order.status === "COMPLETED") {
      throw new ApiError("Pesanan ini sudah dibayar sebelumnya.", 409);
    }
    if (order.status !== "PENDING") {
      throw new ApiError("Pesanan ini tidak dapat dibayar.", 422);
    }

    const updated = await db.$transaction(async (tx) => {
      // Re-check + decrement stok atomik per item (FR-6). updateMany dengan kondisi
      // stock >= qty menjamin tidak ada oversell; jika satu saja gagal → rollback semua.
      for (const item of order.items) {
        const res = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (res.count === 0) {
          throw new ApiError("Stok berubah, perbarui keranjang Anda", 409);
        }
      }

      return tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID", // FR-5
          paymentMethod,
          paymentRef: generatePaymentRef(),
          paidAt: new Date(),
        },
        include: { items: true },
      });
    });

    // Realtime: admin melihat pembayaran masuk tanpa reload
    emitAdminNotification({
      type: "ORDER_PAID",
      title: `Pembayaran diterima — ${order.orderNumber}`,
      message: `${order.customerName} membayar ${formatRupiah(
        updated.total
      )} (${paymentMethod})`,
      orderNumber: order.orderNumber,
    });

    // Mock email konfirmasi pembayaran ke pembeli (masuk outbox admin)
    await sendMockEmail({
      to: user.email,
      subject: `Pembayaran Diterima — ${order.orderNumber}`,
      body: [
        `Halo ${order.customerName},`,
        ``,
        `Pembayaran untuk pesanan ${order.orderNumber} telah kami terima.`,
        `Total: ${formatRupiah(updated.total)}`,
        `Metode: ${paymentMethod} — Ref: ${updated.paymentRef}`,
        ``,
        `Pesanan Anda akan segera diproses.`,
        `— Tim KAVANA`,
      ].join("\n"),
      type: "ORDER_PAID",
      orderId: order.id,
      orderNumber: order.orderNumber,
    });

    return ok({ success: true, order: updated });
  } catch (e) {
    return handleError(e);
  }
}
