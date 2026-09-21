import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { fail, handleError, ApiError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUS_LABEL } from "@/lib/order-utils";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"];

/** Escape sel CSV: kutip ganda bila ada koma/quote/newline */
function csvCell(value: unknown): string {
  const s =
    value === null || value === undefined
      ? ""
      : typeof value === "number"
        ? String(value)
        : String(value);
  if (/[",\n\r;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * GET /api/admin/orders/export?status=<status|all> — wajib ADMIN.
 * Ekspor daftar pesanan sebagai CSV (download attachment).
 * Respons bukan JSON: Content-Type text/csv + Content-Disposition attachment.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error, auth.status);

    const statusParam = req.nextUrl.searchParams.get("status") ?? "all";
    const where: { status?: string } = {};
    if (statusParam !== "all" && VALID_STATUSES.includes(statusParam)) {
      where.status = statusParam;
    }

    const orders = await db.order.findMany({
      where,
      include: { items: true, user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
    });

    const header = [
      "No. Pesanan",
      "Tanggal",
      "Status",
      "Pelanggan",
      "Email",
      "Telepon",
      "Kota",
      "Alamat",
      "Subtotal",
      "Ongkir",
      "Diskon",
      "Kode Promo",
      "Total",
      "Metode Bayar",
      "Ref. Bayar",
      "Dibayar Pada",
      "Jumlah Item",
      "Rincian Item",
    ];

    const rows = orders.map((o) => {
      const itemSummary = o.items
        .map((it) => `${it.quantity}x ${it.name}`)
        .join(" | ");
      return [
        o.orderNumber,
        o.createdAt.toISOString(),
        ORDER_STATUS_LABEL[o.status as keyof typeof ORDER_STATUS_LABEL] ?? o.status,
        o.customerName,
        o.user.email,
        o.phone,
        o.city,
        o.address,
        o.subtotal,
        o.shippingCost,
        o.discount,
        o.promoCode ?? "",
        o.total,
        o.paymentMethod ?? "",
        o.paymentRef ?? "",
        o.paidAt?.toISOString() ?? "",
        o.items.reduce((s, it) => s + it.quantity, 0),
        itemSummary,
      ].map(csvCell);
    });

    const csv = [header, ...rows].map((r) => r.join(",")).join("\r\n");

    // \uFEFF BOM agar Excel membaca UTF-8 dengan benar
    const stamp = new Date().toISOString().slice(0, 10);
    const suffix = statusParam !== "all" ? `-${statusParam.toLowerCase()}` : "";
    return new Response(`\uFEFF${csv}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="kavana-pesanan${suffix}-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    if (e instanceof ApiError) return handleError(e);
    return handleError(e);
  }
}
