import { PrismaClient } from "../prisma/generated-client";
const db = new PrismaClient();
const p = await db.product.findUnique({ where: { slug: "kaos-oversize-daily-classic" }, select: { stock: true } });
console.log("stock kaos-oversize:", p?.stock, "(seed=42, order qty 1 → harus 41)");
await db.$disconnect();
