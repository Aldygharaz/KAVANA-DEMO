/**
 * Kode promo/voucher demo KAVANA — isomorphic (aman dipakai klien & server).
 * Server selalu memvalidasi ulang saat order dibuat; klien hanya preview.
 */

export interface PromoDefinition {
  code: string;
  label: string;
  description: string;
  /** kembalikan potongan ongkir & subtotal berdasarkan konteks */
  apply: (ctx: { subtotal: number; shipping: number }) => { discount: number; shippingDiscount: number };
  minSubtotal?: number;
}

export const PROMOS: PromoDefinition[] = [
  {
    code: "KAVANA10",
    label: "Diskon 10%",
    description: "Potongan 10% dari subtotal (maks. Rp50.000)",
    apply: ({ subtotal }) => ({
      discount: Math.min(Math.round(subtotal * 0.1), 50_000),
      shippingDiscount: 0,
    }),
  },
  {
    code: "GRATISONGKIR",
    label: "Gratis Ongkir",
    description: "Biaya pengiriman jadi Rp0 untuk pesanan apa pun",
    apply: ({ shipping }) => ({ discount: 0, shippingDiscount: shipping }),
    minSubtotal: 100_000,
  },
];

export function findPromo(code: string): PromoDefinition | null {
  const normalized = code.trim().toUpperCase();
  return PROMOS.find((p) => p.code === normalized) ?? null;
}

export interface PromoResult {
  ok: boolean;
  message: string;
  code?: string;
  label?: string;
  discount: number; // potongan subtotal
  shippingDiscount: number; // potongan ongkir
}

/** Validasi & hitung promo. Murni fungsi — dipakai klien (preview) & server (source of truth). */
export function evaluatePromo(code: string, subtotal: number, shipping: number): PromoResult {
  const promo = findPromo(code);
  if (!promo) {
    return { ok: false, message: "Kode promo tidak dikenal atau kedaluwarsa.", discount: 0, shippingDiscount: 0 };
  }
  if (promo.minSubtotal && subtotal < promo.minSubtotal) {
    return {
      ok: false,
      message: `Minimal belanja ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(promo.minSubtotal)} untuk kode ${promo.code}.`,
      discount: 0,
      shippingDiscount: 0,
    };
  }
  const { discount, shippingDiscount } = promo.apply({ subtotal, shipping });
  return { ok: true, message: `Voucher ${promo.code} diterapkan — ${promo.label}!`, code: promo.code, label: promo.label, discount, shippingDiscount };
}
