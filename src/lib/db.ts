import path from "path";
import fs from "fs";
import { PrismaClient } from "@/lib/prisma-client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaRev?: string;
};

/**
 * Naikkan nilai ini setiap kali prisma/schema.prisma berubah.
 * Di dev, instance PrismaClient di-cache di globalThis sehingga client lama
 * (dengan DMMF schema lama) tetap terpakai walau client sudah di-generate ulang.
 * Rev baru memaksa instance baru dibuat dari client hasil generate terbaru.
 */
const PRISMA_REV = "rev7-vercel-tmp-db";

function getDatabaseUrl(): string | undefined {
  if (process.env.VERCEL) {
    const tmpDbPath = path.join("/tmp", "custom.db");
    try {
      if (!fs.existsSync(tmpDbPath)) {
        const candidates = [
          path.join(process.cwd(), "db", "custom.db"),
          path.join(process.cwd(), "..", "db", "custom.db"),
          path.resolve(__dirname, "../../db/custom.db"),
        ];
        const sourcePath = candidates.find((p) => fs.existsSync(p));
        if (sourcePath) {
          fs.copyFileSync(sourcePath, tmpDbPath);
        }
      }
      const url = `file:${tmpDbPath}`;
      process.env.DATABASE_URL = url;
      return url;
    } catch {
      // Fallback bila copy gagal
    }
  }
  return process.env.DATABASE_URL;
}

let db: PrismaClient;
if (globalForPrisma.prisma && globalForPrisma.prismaRev === PRISMA_REV) {
  db = globalForPrisma.prisma;
} else {
  const dbUrl = getDatabaseUrl();
  db = new PrismaClient({
    ...(dbUrl ? { datasourceUrl: dbUrl } : {}),
    log: ["query"],
  });
  globalForPrisma.prisma = db;
  globalForPrisma.prismaRev = PRISMA_REV;
}

export { db };