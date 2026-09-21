import { PrismaClient } from "../prisma/generated-client";
const db = new PrismaClient();
const products = await db.product.findMany({ select: { id: true, images: true } });
let n = 0;
for (const p of products) {
  try {
    const arr = JSON.parse(p.images);
    if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "string" && !arr[0].includes("?v=")) {
      await db.product.update({
        where: { id: p.id },
        data: { images: JSON.stringify(arr.map((u: string) => `${u}?v=2`)) },
      });
      n++;
    }
  } catch { /* skip */ }
}
console.log("updated", n, "products");
await db.$disconnect();
