import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, fail, handleError, ApiError } from "@/lib/api-helpers";
import { requireUser } from "@/lib/auth";
import { generateOrderNumber, parseProductImages } from "@/lib/order-utils";
import { calcShipping } from "@/lib/format";
import { evaluatePromo } from "@/lib/promo";

export const dynamic = "force-dynamic";

const schema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Produk tidak valid"),
        quantity: z.number().int().min(1, "Jumlah minimal 1").max(99, "Jumlah maksimal 99"),
      })
    )
    .min(1, "Keranjang tidak boleh kosong"),
  customerName: z.string().trim().min(3, "Nama penerima wajib diisi (min. 3 karakter)").max(100),
  phone: z.string().trim().min(8, "Nomor telepon wajib diisi (min. 8 digit)").max(20),
  address: z.string().trim().min(5, "Alamat lengkap wajib diisi").max(500),
  city: z.string().trim().min(2, "Kota wajib diisi").max(100),
  postalCode: z.string().trim().max(10).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  promoCode: z.string().trim().max(30).optional().or(z.literal("")),
  saveAddress: z.boolean().optional(),
});

/**
 * POST /api/orders — wajib login. Buat order status PENDING (FR-4).
 * Server validasi ulang stok per item (FR-3) & hitung harga dari DB.
 * → 201 { order }
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
    const data = parsed.data;

    // Deduplikasi item berdasarkan productId
    const merged = new Map<string, number>();
    for (const it of data.items) {
      merged.set(it.productId, (merged.get(it.productId) ?? 0) + it.quantity);
    }
    const productIds = [...merged.keys()];

    const products = await db.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // FR-3: validasi stok server-side, pesan jelas + extra { productId, available }
    for (const [productId, qty] of merged) {
      const p = productMap.get(productId);
      if (!p) {
        throw new ApiError("Ada produk yang tidak tersedia. Perbarui keranjang Anda.", 422);
      }
      if (p.stock < qty) {
        throw new ApiError(`Stok tidak cukup untuk ${p.name} (sisa ${p.stock})`, 422, {
          productId: p.id,
          available: p.stock,
        });
      }
    }

    // Harga selalu dihitung dari DB (bukan dari klien)
    let subtotal = 0;
    for (const [productId, qty] of merged) {
      const p = productMap.get(productId)!;
      subtotal += p.price * qty;
    }
    const baseShipping = calcShipping(subtotal);

    // Validasi voucher di server (source of truth) — klien hanya preview
    let discount = 0;
    let shippingCost = baseShipping;
    let appliedPromoCode: string | null = null;
    if (data.promoCode) {
      const result = evaluatePromo(data.promoCode, subtotal, baseShipping);
      if (!result.ok) {
        throw new ApiError(result.message, 422, { promoCode: data.promoCode.toUpperCase() });
      }
      discount = result.discount;
      shippingCost = Math.max(0, baseShipping - result.shippingDiscount);
      appliedPromoCode = result.code ?? null;
    }

    const total = Math.max(0, subtotal - discount) + shippingCost;

    // Opsional: simpan alamat checkout ke profil user (untuk checkout berikutnya)
    if (data.saveAddress) {
      await db.user
        .update({
          where: { id: user.id },
          data: {
            name: data.customerName,
            phone: data.phone,
            address: data.address,
            city: data.city,
          },
        })
        .catch(() => {}); // gagal update profil tidak boleh menggagalkan order
    }

    const order = await db.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: user.id,
        status: "PENDING",
        customerName: data.customerName,
        phone: data.phone,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode || null,
        notes: data.notes || null,
        subtotal,
        shippingCost,
        discount,
        promoCode: appliedPromoCode,
        total,
        items: {
          create: [...merged.entries()].map(([productId, qty]) => {
            const p = productMap.get(productId)!;
            return {
              productId: p.id,
              name: p.name,
              price: p.price,
              image: parseProductImages(p.images)[0] ?? null,
              quantity: qty,
            };
          }),
        },
      },
      include: { items: true },
    });

    return ok({ order }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

/**
 * GET /api/orders — wajib login. HANYA order milik user sendiri (FR-7), desc, include items.
 * → { orders }
 */
export async function GET() {
  try {
    const auth = await requireUser();
    if (!auth.ok) return fail(auth.error, auth.status);

    const orders = await db.order.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    return ok({ orders });
  } catch (e) {
    return handleError(e);
  }
}
