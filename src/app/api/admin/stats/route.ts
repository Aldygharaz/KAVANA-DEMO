import { db } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const PAID_STATUSES: OrderStatus[] = ["PAID", "SHIPPED", "COMPLETED"];
const ALL_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
];

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return fail(auth.error, auth.status);

    const now = new Date();
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 6,
      0,
      0,
      0,
      0
    );

    const [
      revenueAgg,
      ordersCount,
      customersCount,
      productsCount,
      lowStockProducts,
      recentPaidOrders,
      statusGroups,
      paidOrderItems,
      recentOrders,
      categoryRows,
    ] = await Promise.all([
      // Total pendapatan: hanya order PAID / SHIPPED / COMPLETED
      db.order.aggregate({
        _sum: { total: true },
        where: { status: { in: PAID_STATUSES } },
      }),
      db.order.count(),
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.product.count(),
      // Produk stok rendah (<= 5, masih aktif), max 5 item
      db.product.findMany({
        where: { stock: { lte: 5 }, isActive: true },
        orderBy: [{ stock: "asc" }, { name: "asc" }],
        take: 5,
        select: { id: true, name: true, stock: true },
      }),
      // Order terbayar 7 hari terakhir untuk revenueByDay
      db.order.findMany({
        where: { status: { in: PAID_STATUSES }, createdAt: { gte: start } },
        select: { createdAt: true, total: true },
      }),
      db.order.groupBy({ by: ["status"], _count: { _all: true } }),
      // OrderItem dari order terbayar untuk top products
      db.orderItem.findMany({
        where: { order: { status: { in: PAID_STATUSES } } },
        select: { productId: true, name: true, price: true, quantity: true },
      }),
      db.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
      // Kategori (untuk agregasi pendapatan per kategori)
      db.category.findMany({ select: { id: true, name: true } }),
    ]);

    // --- revenueByDay: 7 hari terakhir (termasuk hari ini) ---
    const buckets = new Map<string, { date: string; revenue: number; orders: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      buckets.set(dayKey(d), { date: dayKey(d), revenue: 0, orders: 0 });
    }
    for (const o of recentPaidOrders) {
      const bucket = buckets.get(dayKey(o.createdAt));
      if (bucket) {
        bucket.revenue += o.total;
        bucket.orders += 1;
      }
    }
    const revenueByDay = Array.from(buckets.values());

    // --- topProducts: 5 produk terlaris dari order terbayar ---
    const byProduct = new Map<string, { name: string; qtySold: number; revenue: number }>();
    for (const item of paidOrderItems) {
      const cur = byProduct.get(item.productId) ?? {
        name: item.name,
        qtySold: 0,
        revenue: 0,
      };
      cur.qtySold += item.quantity;
      cur.revenue += item.price * item.quantity;
      byProduct.set(item.productId, cur);
    }
    const topProducts = Array.from(byProduct.values())
      .sort((a, b) => b.qtySold - a.qtySold)
      .slice(0, 5);

    // --- statusDistribution ---
    const countByStatus = new Map<string, number>();
    for (const g of statusGroups) countByStatus.set(g.status, g._count._all);
    const statusDistribution = ALL_STATUSES.map((status) => ({
      status,
      count: countByStatus.get(status) ?? 0,
    }));

    // --- revenueByCategory: kontribusi kategori dari order terbayar ---
    const productIds = [...new Set(paidOrderItems.map((i) => i.productId))];
    const catProducts =
      productIds.length > 0
        ? await db.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, categoryId: true },
          })
        : [];
    const productToCat = new Map(catProducts.map((p) => [p.id, p.categoryId]));
    const catName = new Map(categoryRows.map((c) => [c.id, c.name]));
    const revenueByCat = new Map<string, number>();
    for (const item of paidOrderItems) {
      const cid = productToCat.get(item.productId);
      if (!cid) continue;
      revenueByCat.set(cid, (revenueByCat.get(cid) ?? 0) + item.price * item.quantity);
    }
    const revenueByCategory = categoryRows
      .map((c) => ({ name: catName.get(c.id) ?? c.id, revenue: revenueByCat.get(c.id) ?? 0 }))
      .filter((c) => c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);

    return ok({
      revenue: revenueAgg._sum.total ?? 0,
      ordersCount,
      customersCount,
      productsCount,
      lowStockProducts,
      revenueByDay,
      topProducts,
      statusDistribution,
      recentOrders,
      revenueByCategory,
    });
  } catch (e) {
    return handleError(e);
  }
}
