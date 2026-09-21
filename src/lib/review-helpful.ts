import "server-only";

import { db } from "@/lib/db";

/**
 * Helper khusus untuk field Review.helpfulCount.
 *
 * WHY raw SQL? Di dev, instance PrismaClient bisa ter-cache di runtime dev server
 * (lihat catatan PRISMA_REV di src/lib/db.ts) sehingga DMMF-nya belum mengenal
 * field `helpfulCount` yang baru ditambahkan ke schema. $queryRaw / $executeRaw
 * tidak melewati validasi DMMF sehingga AMAN dipakai baik dengan client lama
 * maupun client baru (cukup SQLite murni).
 */

/** Ambil peta { reviewId: helpfulCount } untuk satu produk. */
export async function getHelpfulCounts(productId: string): Promise<Record<string, number>> {
  const rows = await db.$queryRaw<{ id: string; helpfulCount: number }[]>`
    SELECT id, helpfulCount FROM Review WHERE productId = ${productId}
  `;
  return Object.fromEntries(rows.map((r) => [r.id, Number(r.helpfulCount)]));
}

/**
 * Tambah/kurangi hitungan "Membantu" (delta +1 / -1), dijamin tidak negatif.
 * → { helpfulCount } nilai terbaru.
 */
export async function adjustHelpful(reviewId: string, delta: 1 | -1): Promise<number> {
  if (delta === 1) {
    await db.$executeRaw`UPDATE Review SET helpfulCount = helpfulCount + 1 WHERE id = ${reviewId}`;
  } else {
    await db.$executeRaw`UPDATE Review SET helpfulCount = MAX(helpfulCount - 1, 0) WHERE id = ${reviewId}`;
  }
  const rows = await db.$queryRaw<{ helpfulCount: number }[]>`
    SELECT helpfulCount FROM Review WHERE id = ${reviewId}
  `;
  return Number(rows[0]?.helpfulCount ?? 0);
}
