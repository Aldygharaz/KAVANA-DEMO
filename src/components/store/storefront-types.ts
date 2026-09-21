import type { OrderStatus } from "@/lib/types";

/** Tipe & konstanta bersama untuk halaman storefront (milik Task 2-a) */

export interface OrderItemData {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  productSlug?: string | null;
}

export interface OrderData {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string | null;
  notes: string | null;
  subtotal: number;
  shippingCost: number;
  discount: number;
  promoCode: string | null;
  total: number;
  paymentMethod: string | null;
  paymentRef: string | null;
  paidAt: string | null;
  createdAt: string;
  items: OrderItemData[];
}

export interface ProductDetailData {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  featured: boolean;
  images: string[];
  categoryName: string | null;
  categorySlug: string | null;
  avgRating: number | null;
  reviewCount: number;
  createdAt: string;
}

export interface ReviewData {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  userName: string;
  helpfulCount: number;
  verified: boolean; // pembeli terverifikasi (pernah order produk ini)
}

export const PAYMENT_METHODS = [
  { value: "VA_BCA", label: "Virtual Account BCA", desc: "Transfer via ATM / myBCA / KlikBCA" },
  { value: "VA_MANDIRI", label: "Virtual Account Mandiri", desc: "Transfer via ATM / Livin' Mandiri" },
  { value: "EWALLET", label: "E-Wallet", desc: "OVO, GoPay, DANA, ShopeePay" },
  { value: "CARD", label: "Kartu Kredit / Debit", desc: "Visa, Mastercard, JCB (mock)" },
] as const;

export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number]["value"];

export const PAYMENT_METHOD_LABEL: Record<string, string> = Object.fromEntries(
  PAYMENT_METHODS.map((m) => [m.value, m.label])
);

/** Label status order (id) — duplikat client-safe dari src/lib/order-utils (yang server-only) */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Menunggu Pembayaran",
  PAID: "Dibayar",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

/** Warna badge status sesuai konvensi worklog (PENDING amber, PAID emerald, SHIPPED amber, COMPLETED primary, CANCELLED destructive) */
export const ORDER_STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  PENDING: "border-amber-300 bg-amber-100 text-amber-900",
  PAID: "border-emerald-300 bg-emerald-100 text-emerald-900",
  SHIPPED: "border-orange-300 bg-orange-100 text-orange-900",
  COMPLETED: "border-primary bg-primary text-primary-foreground",
  CANCELLED: "border-destructive bg-destructive text-white",
};
