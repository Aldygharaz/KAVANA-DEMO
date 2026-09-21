import { PrismaClient } from '@/lib/prisma-client'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaRev?: string
}

/**
 * Naikkan nilai ini setiap kali prisma/schema.prisma berubah.
 * Di dev, instance PrismaClient di-cache di globalThis sehingga client lama
 * (dengan DMMF schema lama) tetap terpakai walau client sudah di-generate ulang.
 * Rev baru memaksa instance baru dibuat dari client hasil generate terbaru.
 */
const PRISMA_REV = "rev6-custom-output" // bump untuk Product.compareAtPrice + model EmailLog + output kustom

let db: PrismaClient
if (globalForPrisma.prisma && globalForPrisma.prismaRev === PRISMA_REV) {
  db = globalForPrisma.prisma
} else {
  db = new PrismaClient({
    log: ['query'],
  })
  globalForPrisma.prisma = db
  globalForPrisma.prismaRev = PRISMA_REV
}

export { db }