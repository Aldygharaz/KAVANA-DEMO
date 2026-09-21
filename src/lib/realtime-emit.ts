import "server-only";

import { io, type Socket } from "socket.io-client";

/**
 * Emit notifikasi realtime ke panel admin via notification-service
 * (mini-service socket.io di port 3003).
 *
 * Kenapa socket.io-client, bukan HTTP POST?
 * notification-service memakai socket.io dengan path "/" sehingga claim
 * semua request HTTP di port itu; jalur paling bersih adalah protokol
 * socket.io itu sendiri dari sisi server (singleton + auto-reconnect).
 *
 * SELALU aman: kegagalan koneksi/service tidak boleh menggagalkan alur
 * utama (pembayaran, update status) — error hanya di-log.
 */

const NOTIF_URL =
  process.env.NOTIFICATION_SERVICE_URL ?? "http://127.0.0.1:3003";
const INTERNAL_SECRET = "kavana-demo-secret";

export type RealtimeType =
  | "ORDER_PAID"
  | "ORDER_SHIPPED"
  | "ORDER_CANCELLED"
  | "ORDER_CREATED"
  | "EMAIL"
  | "SYSTEM";

interface EmitInput {
  type: RealtimeType;
  title: string;
  message?: string;
  orderNumber?: string;
}

const globalForRealtime = globalThis as unknown as {
  realtimeSocket?: Socket;
};

function getSocket(): Socket | null {
  if (globalForRealtime.realtimeSocket) return globalForRealtime.realtimeSocket;
  try {
    const socket = io(NOTIF_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      timeout: 3000,
      autoConnect: true,
    });
    // Swallow error supaya tidak membawa proses Next down
    socket.on("connect_error", () => {
      /* service belum jalan — biarkan reconnect sendiri */
    });
    socket.on("admin:emit-error", (data: { error?: string }) => {
      console.error("[realtime-emit] ditolak service:", data?.error);
    });
    globalForRealtime.realtimeSocket = socket;
    return socket;
  } catch (e) {
    console.error("[realtime-emit] gagal membuat socket:", e);
    return null;
  }
}

export function emitAdminNotification(input: EmitInput): void {
  try {
    const socket = getSocket();
    if (!socket) return;
    if (!socket.connected) {
      // Belum/koneksi putus — tetap emit; socket.io akan buffer sampai connect
      socket.connect();
    }
    socket.emit("admin:emit", {
      secret: INTERNAL_SECRET,
      type: input.type,
      title: input.title,
      message: input.message ?? "",
      orderNumber: input.orderNumber,
    });
  } catch (e) {
    console.error("[realtime-emit] gagal emit:", e);
  }
}
