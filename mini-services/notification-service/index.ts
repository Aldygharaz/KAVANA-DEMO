/**
 * KAVANA notification-service — realtime admin notifications (socket.io).
 *
 * Port 3003. Path selalu "/" (di-forward Caddy via ?XTransformPort=3003).
 *
 * Protocol:
 *  - Klien admin (browser): emit "admin:join" → join room "admin" →
 *    menerima event "history" (20 terakhir) lalu "admin-notification" realtime.
 *  - API route Next.js (server-side): memakai socket.io-client singleton
 *    (src/lib/realtime-emit.ts) yang connect langsung ke port ini dan emit
 *    "admin:emit" { secret, type, title, message, orderNumber }.
 *    Catatan: HTTP endpoint biasa tidak bisa dipakai karena socket.io dengan
 *    path "/" meng-claim SEMUA request HTTP di port ini.
 */
import { createServer } from "http";
import { Server } from "socket.io";

const PORT = 3003;
const INTERNAL_SECRET = "kavana-demo-secret";

type NotificationType =
  | "ORDER_PAID"
  | "ORDER_SHIPPED"
  | "ORDER_CANCELLED"
  | "ORDER_CREATED"
  | "EMAIL"
  | "SYSTEM";

interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  orderNumber?: string;
  createdAt: string;
}

const history: AdminNotification[] = [];
const MAX_HISTORY = 20;

const genId = () =>
  `ntf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const httpServer = createServer();

const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: "/",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.on("connection", (socket) => {
  console.log(`[connect] ${socket.id}`);

  // Klien admin join room "admin" lalu terima riwayat
  socket.on("admin:join", () => {
    socket.join("admin");
    socket.emit("history", { notifications: history });
    console.log(`[join] ${socket.id} → admin room (${io.engine.clientsCount} clients)`);
  });

  // Emit dari server Next.js (socket.io-client singleton, server-side)
  socket.on(
    "admin:emit",
    (data: {
      secret?: string;
      type?: NotificationType;
      title?: string;
      message?: string;
      orderNumber?: string;
    }) => {
      if (data?.secret !== INTERNAL_SECRET) {
        socket.emit("admin:emit-error", { error: "Secret tidak valid" });
        return;
      }
      if (!data?.type || !data?.title) {
        socket.emit("admin:emit-error", { error: "type dan title wajib" });
        return;
      }
      const notification: AdminNotification = {
        id: genId(),
        type: data.type,
        title: data.title,
        message: data.message ?? "",
        orderNumber: data.orderNumber,
        createdAt: new Date().toISOString(),
      };
      history.unshift(notification);
      if (history.length > MAX_HISTORY) history.pop();
      io.to("admin").emit("admin-notification", notification);
      console.log(`[notify] ${notification.type}: ${notification.title}`);
    }
  );

  socket.on("disconnect", (reason) => {
    console.log(`[disconnect] ${socket.id} (${reason})`);
  });

  socket.on("error", (error) => {
    console.error(`[error] ${socket.id}:`, error);
  });
});

httpServer.listen(PORT, () => {
  console.log(`KAVANA notification-service running on port ${PORT}`);
});

process.on("SIGTERM", () => {
  httpServer.close(() => process.exit(0));
});
process.on("SIGINT", () => {
  httpServer.close(() => process.exit(0));
});
