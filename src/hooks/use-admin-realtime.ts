"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

export interface AdminNotification {
  id: string;
  type:
    | "ORDER_PAID"
    | "ORDER_SHIPPED"
    | "ORDER_CANCELLED"
    | "ORDER_CREATED"
    | "EMAIL"
    | "SYSTEM";
  title: string;
  message: string;
  orderNumber?: string;
  createdAt: string;
}

export type RealtimeStatus = "connecting" | "live" | "offline";

/**
 * Hook realtime panel admin — connect ke notification-service
 * (socket.io, port 3003 via gateway Caddy ?XTransformPort=3003).
 *
 * Graceful degradation: kalau service mati, status "offline" dan UI tetap
 * berfungsi normal (tanpa realtime) — tidak ada error yang dilempar.
 *
 * onNotification: callback saat ada notifikasi baru (BUKAN history).
 */
export function useAdminRealtime(
  onNotification?: (n: AdminNotification) => void
) {
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const cbRef = useRef(onNotification);

  // Sinkronkan callback via effect (bukan saat render) — react-hooks/refs
  useEffect(() => {
    cbRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    // Gateway Caddy: selalu path "/" + query XTransformPort (lihat Caddyfile)
    const socket: Socket = io("/?XTransformPort=3003", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 2000,
      timeout: 8000,
    });

    socket.on("connect", () => {
      setStatus("live");
      socket.emit("admin:join");
    });

    socket.on("disconnect", () => setStatus("offline"));
    socket.on("connect_error", () => setStatus("offline"));
    socket.on("reconnect_attempt", () => setStatus("connecting"));

    // Riwayat saat connect — tidak memicu callback (bukan event baru)
    socket.on("history", (_data: { notifications: AdminNotification[] }) => {
      /* riwayat bisa dipakai utk fitur inbox di masa depan */
    });

    socket.on("admin-notification", (n: AdminNotification) => {
      cbRef.current?.(n);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { status };
}

/** Warna & label tipe notifikasi (konsisten dgn badge halaman Email). */
export const NOTIF_TYPE_META: Record<
  AdminNotification["type"],
  { label: string }
> = {
  ORDER_PAID: { label: "Dibayar" },
  ORDER_SHIPPED: { label: "Dikirim" },
  ORDER_CANCELLED: { label: "Dibatalkan" },
  ORDER_CREATED: { label: "Pesanan Baru" },
  EMAIL: { label: "Email" },
  SYSTEM: { label: "Sistem" },
};
