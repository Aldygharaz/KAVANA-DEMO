/**
 * Re-export PrismaClient dari output generate kustom (prisma/generated-client).
 *
 * Kenapa tidak langsung `@prisma/client`?
 * Di dev, server Next yang sudah lama berjalan menyimpan instance client
 * lama di cache modulnya sehingga field/model baru dari schema.prisma tidak
 * dikenali ("Unknown argument…" / model undefined). Custom output path
 * memberi identitas modul BARU yang belum pernah di-cache, sehingga
 * hot-reload pada file ini memuat client hasil generate terbaru.
 * Lihat juga PRISMA_REV di src/lib/db.ts.
 */
export { PrismaClient, Prisma } from "../../prisma/generated-client";
