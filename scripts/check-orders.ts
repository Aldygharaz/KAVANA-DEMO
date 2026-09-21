import { PrismaClient } from "../prisma/generated-client";
const db = new PrismaClient();
const orders = await db.order.findMany({
  orderBy: { createdAt: "desc" },
  take: 5,
  select: { orderNumber: true, status: true, total: true, createdAt: true, customerName: true },
});
console.log(JSON.stringify(orders, null, 1));
await db.$disconnect();
