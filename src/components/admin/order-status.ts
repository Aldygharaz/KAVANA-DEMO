/**
 * Client-safe mirror of order-utils (yang "server-only") untuk kebutuhan UI admin.
 * Harus disinkronkan dengan ORDER_STATUS_FLOW di src/lib/order-utils.ts.
 */
import type { OrderStatus } from "@/lib/types";

export const ADMIN_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
];

export const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

/** Label tombol aksi admin berdasarkan status TUJUAN transisi */
export const STATUS_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  PAID: "Konfirmasi Bayar",
  SHIPPED: "Tandai Dikirim",
  COMPLETED: "Tandai Selesai",
  CANCELLED: "Batalkan Pesanan",
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  VA_BCA: "Virtual Account BCA",
  VA_MANDIRI: "Virtual Account Mandiri",
  EWALLET: "E-Wallet",
  CARD: "Kartu Kredit/Debit",
  MANUAL: "Konfirmasi Manual Admin",
};

/** Singkatan rupiah untuk sumbu chart, mis. 1,2jt */
export function shortRupiah(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1).replace(".", ",")} M`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(".", ",")} jt`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)} rb`;
  }
  return String(Math.round(value));
}
