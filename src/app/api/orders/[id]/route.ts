import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, handleError, ApiError } from "@/lib/api-helpers";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders/[id] — wajib login; 403 jika bukan milik user (FR-7).
 * Param juga menerima orderNumber (mis. KVN-250101-1234) untuk kemudahan redirect pembayaran.
 * → { order: {...items} }
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return fail(auth.error, auth.status);
    const user = auth.user;

    const { id } = await params;

    const order = await db.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }], userId: user.id },
      include: {
        items: {
          include: {
            product: {
              select: { slug: true },
            },
          },
        },
      },
    });

    if (!order) {
      // Bedakan 404 vs 403 agar pesan jelas.
      const exists = await db.order.findFirst({
        where: { OR: [{ id }, { orderNumber: id }] },
        select: { id: true },
      });
      if (!exists) throw new ApiError("Pesanan tidak ditemukan.", 404);
      throw new ApiError("Anda tidak memiliki akses ke pesanan ini.", 403);
    }

    const transformedOrder = {
      ...order,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        productSlug: item.product?.slug ?? null,
      })),
    };

    return ok({ order: transformedOrder });
  } catch (e) {
    return handleError(e);
  }
}
