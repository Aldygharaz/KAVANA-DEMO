/**
 * One-off: set compareAtPrice (harga coret) untuk sebagian produk yang ada.
 * Diskon realistis 10–25%, selalu kelipatan 1000.
 * Jalankan: bunx tsx scripts/set-compare-prices.ts
 */
import { PrismaClient } from "../prisma/generated-client";

const db = new PrismaClient();

// slug → persen diskon
const DISCOUNTS: Record<string, number> = {
  "hoodie-urban-warmth": 15,
  "kemeja-linen-coastal-breeze": 12,
  "tws-earbuds-pulse-air": 20,
  "smartwatch-pace-one": 18,
  "portable-speaker-boom-mini": 10,
  "tote-bag-canvas-everyday-carry": 25,
  "lampu-meja-glow-nook": 14,
};

async function main() {
  for (const [slug, pct] of Object.entries(DISCOUNTS)) {
    const product = await db.product.findUnique({ where: { slug } });
    if (!product) {
      console.log(`skip (tidak ditemukan): ${slug}`);
      continue;
    }
    const raw = product.price * (1 + pct / 100);
    const compareAtPrice = Math.round(raw / 1000) * 1000;
    if (compareAtPrice <= product.price) {
      console.log(`skip (tidak valid): ${slug}`);
      continue;
    }
    await db.product.update({ where: { id: product.id }, data: { compareAtPrice } });
    console.log(
      `${slug}: Rp${product.price} (coret Rp${compareAtPrice}, -${pct}%)`
    );
  }
  const total = await db.product.count({ where: { compareAtPrice: { not: null } } });
  console.log(`Selesai. ${total} produk kini punya harga coret.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
