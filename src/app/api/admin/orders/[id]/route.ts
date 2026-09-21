import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, ApiError, handleError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import {
  isValidTransition,
  ORDER_STATUS_FLOW,
  generatePaymentRef,
} from "@/lib/order-utils";
import { sendMockEmail } from "@/lib/email-outbox";
import { formatRupiah } from "@/lib/format";
import { emitAdminNotification } from "@/lib/realtime-emit";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"]),
});

/**
 * PATCH /api/admin/orders/[id] { status }
 * FR-8: validasi transisi status. PENDING→PAID juga mengurangi stok
 * (re-check via updateMany, 409 jika stok kurang). PAID→CANCELLED
 * mengembalikan stok karena stok sudah dikurangi saat pembayaran.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error, auth.status);
    const { id } = await params;

    const body: unknown = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return fail("Status tidak valid", 422);
    const next = parsed.data.status;

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true, user: { select: { email: true } } },
    });
    if (!order) throw new ApiError("Pesanan tidak ditemukan", 404);

    const current = order.status as OrderStatus;
    if (!isValidTransition(current, next)) {
      return fail("Transisi status tidak valid", 422, {
        allowed: ORDER_STATUS_FLOW[current],
      });
    }

    const userEmail = order.user?.email ?? "";
    const itemsSummary = order.items
      .map((it) => `${it.quantity}x ${it.name}`)
      .join(", ");

    if (current === "PENDING" && next === "PAID") {
      // Konfirmasi pembayaran manual: kurangi stok dengan re-check di transaksi
      await db.$transaction(async (tx) => {
        for (const item of order.items) {
          const res = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (res.count === 0) {
            throw new ApiError(`Stok tidak cukup untuk ${item.name}`, 409);
          }
        }
        await tx.order.update({
          where: { id },
          data: {
            status: "PAID",
            paidAt: new Date(),
            paymentMethod: order.paymentMethod ?? "MANUAL",
            paymentRef: order.paymentRef ?? generatePaymentRef(),
          },
        });
      });

      await sendMockEmail({
        to: userEmail,
        subject: `Pembayaran Dikonfirmasi — ${order.orderNumber}`,
        body: [
          `Halo ${order.customerName},`,
          ``,
          `Pembayaran pesanan ${order.orderNumber} telah dikonfirmasi admin.`,
          `Total: ${formatRupiah(order.total)}`,
          `Item: ${itemsSummary}`,
          ``,
          `Pesanan Anda akan segera dikemas.`,
          `— Tim KAVANA`,
        ].join("\n"),
        type: "ORDER_PAID",
        orderId: order.id,
        orderNumber: order.orderNumber,
      });

      emitAdminNotification({
        type: "ORDER_PAID",
        title: `Pembayaran dikonfirmasi — ${order.orderNumber}`,
        message: `${order.customerName} · ${formatRupiah(order.total)}`,
        orderNumber: order.orderNumber,
      });
    } else if (current === "PAID" && next === "CANCELLED") {
      // Pembatalan setelah dibayar: kembalikan stok yang sudah dikurangi
      await db.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        await tx.order.update({ where: { id }, data: { status: "CANCELLED" } });
      });

      await sendMockEmail({
        to: userEmail,
        subject: `Pesanan Dibatalkan — ${order.orderNumber}`,
        body: [
          `Halo ${order.customerName},`,
          ``,
          `Pesanan ${order.orderNumber} telah dibatalkan dan pembayaran Anda akan direfund.`,
          `Item: ${itemsSummary}`,
          ``,
          `Maaf atas ketidaknyamanannya. Hubungi kami bila ada pertanyaan.`,
          `— Tim KAVANA`,
        ].join("\n"),
        type: "ORDER_CANCELLED",
        orderId: order.id,
        orderNumber: order.orderNumber,
      });

      emitAdminNotification({
        type: "ORDER_CANCELLED",
        title: `Pesanan dibatalkan — ${order.orderNumber}`,
        message: `Stok ${order.items.length} item dikembalikan`,
        orderNumber: order.orderNumber,
      });
    } else {
      await db.order.update({ where: { id }, data: { status: next } });

      if (current === "PAID" && next === "SHIPPED") {
        await sendMockEmail({
          to: userEmail,
          subject: `Pesanan Dikirim — ${order.orderNumber}`,
          body: [
            `Halo ${order.customerName},`,
            ``,
            `Pesanan ${order.orderNumber} telah dikirim!`,
            `Tujuan: ${order.address}, ${order.city}${order.postalCode ? ` ${order.postalCode}` : ""}`,
            `Item: ${itemsSummary}`,
            ``,
            `Estimasi tiba 2–4 hari kerja. Terima kasih sudah berbelanja.`,
            `— Tim KAVANA`,
          ].join("\n"),
          type: "ORDER_SHIPPED",
          orderId: order.id,
          orderNumber: order.orderNumber,
        });

        emitAdminNotification({
          type: "ORDER_SHIPPED",
          title: `Pesanan dikirim — ${order.orderNumber}`,
          message: `Menuju ${order.city}`, 
          orderNumber: order.orderNumber,
        });
      }
    }

    const updated = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });
    return ok({ order: updated });
  } catch (e) {
    return handleError(e);
  }
}
