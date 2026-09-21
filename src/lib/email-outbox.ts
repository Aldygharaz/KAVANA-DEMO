import "server-only";

import { db } from "@/lib/db";

export type EmailType =
  | "PASSWORD_RESET"
  | "WELCOME"
  | "ORDER_PAID"
  | "ORDER_SHIPPED"
  | "ORDER_CANCELLED";

export interface SendMockEmailInput {
  to: string;
  subject: string;
  body: string;
  type: EmailType;
  orderId?: string;
  orderNumber?: string;
}

/**
 * Mock email sender — menulis "email terkirim" ke tabel EmailLog (outbox).
 * Di produksi fungsi ini diganti pengiriman SMTP/provider sungguhan.
 *
 * SELALU aman: kegagalan outbox tidak boleh menggagalkan alur utama
 * (order dibayar, reset password, dsb.) — error hanya di-log ke console.
 */
export async function sendMockEmail(input: SendMockEmailInput): Promise<void> {
  try {
    await db.emailLog.create({
      data: {
        toEmail: input.to,
        subject: input.subject,
        body: input.body,
        type: input.type,
        orderId: input.orderId ?? null,
        orderNumber: input.orderNumber ?? null,
      },
    });
  } catch (e) {
    console.error("[email-outbox] gagal mencatat email mock:", e);
  }
}

/** Jumlah email belum dibaca (badge nav admin). */
export async function getUnreadEmailCount(): Promise<number> {
  return db.emailLog.count({ where: { readAt: null } });
}

/** Label tipe email (untuk UI admin). */
export const EMAIL_TYPE_LABEL: Record<EmailType, string> = {
  PASSWORD_RESET: "Reset Kata Sandi",
  WELCOME: "Selamat Datang",
  ORDER_PAID: "Pesanan Dibayar",
  ORDER_SHIPPED: "Pesanan Dikirim",
  ORDER_CANCELLED: "Pesanan Dibatalkan",
};
