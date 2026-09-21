import type { NextRequest } from "next/server";
import { Prisma } from "@/lib/prisma-client";
import { db } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"];

const SORT_FIELDS = {
  createdAt: "createdAt",
  total: "total",
  orderNumber: "orderNumber",
  customerName: "customerName",
} as const;

type SortField = keyof typeof SORT_FIELDS;

/** GET /api/admin/orders?status=<status|all>&q=<orderNumber|customerName>&page=1&pageSize=10&sortBy=createdAt&sortDir=desc */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error, auth.status);

    const sp = req.nextUrl.searchParams;

    const statusParam = sp.get("status") ?? "all";
    const where: { status?: string } = {};
    if (statusParam !== "all" && VALID_STATUSES.includes(statusParam)) {
      where.status = statusParam;
    }

    // --- Pagination (server-side) ---
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(50, Math.max(5, parseInt(sp.get("pageSize") ?? "10", 10) || 10));

    // --- Sorting (whitelist agar aman) ---
    const sortByParam = (sp.get("sortBy") ?? "createdAt") as SortField;
    const sortBy: SortField = sortByParam in SORT_FIELDS ? sortByParam : "createdAt";
    const sortDir = sp.get("sortDir") === "asc" ? "asc" : "desc";

    const [total, orders] = await Promise.all([
      db.order.count({ where }),
      db.order.findMany({
        where,
        include: { items: true, user: { select: { email: true } } },
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // Filter q dilakukan di memori SETELAH pagination akan merusak hitungan;
    // karena SQLite Prisma tidak mendukung mode:"insensitive", pencarian tetap
    // memakai pendekatan memori, tapi hanya pada halaman yang relevan bila q kosong.
    // Untuk menjaga konsistensi, bila q terisi kita jalankan query memori penuh
    // (dataset demo kecil), tanpa pagination DB.
    const q = (sp.get("q") ?? "").trim().toLowerCase();
    if (q) {
      const all = await db.order.findMany({
        where,
        include: { items: true, user: { select: { email: true } } },
        orderBy: { [sortBy]: sortDir },
      });
      const filtered = all.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q)
      );
      const fTotal = filtered.length;
      const fTotalPages = Math.max(1, Math.ceil(fTotal / pageSize));
      const fPage = Math.min(page, fTotalPages);
      return ok({
        orders: filtered.slice((fPage - 1) * pageSize, fPage * pageSize).map(mapOrder),
        total: fTotal,
        page: fPage,
        pageSize,
        totalPages: fTotalPages,
      });
    }

    return ok({
      orders: orders.map(mapOrder),
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (e) {
    return handleError(e);
  }
}

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { items: true; user: { select: { email: true } } };
}>;

function mapOrder(o: OrderWithRelations) {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status as OrderStatus,
    customerName: o.customerName,
    userEmail: o.user.email,
    phone: o.phone,
    address: o.address,
    city: o.city,
    postalCode: o.postalCode,
    notes: o.notes,
    subtotal: o.subtotal,
    shippingCost: o.shippingCost,
    discount: o.discount,
    promoCode: o.promoCode,
    total: o.total,
    paymentMethod: o.paymentMethod,
    paymentRef: o.paymentRef,
    paidAt: o.paidAt?.toISOString() ?? null,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      name: it.name,
      price: it.price,
      image: it.image,
      quantity: it.quantity,
    })),
  };
}
