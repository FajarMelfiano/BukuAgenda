import { PrismaClient } from "@prisma/client";

/**
 * Satu instance Prisma untuk seluruh proses. Di development Next.js memuat
 * modul ulang tiap kali ada perubahan berkas, jadi instance disimpan di
 * globalThis supaya tidak membuka koneksi baru setiap hot-reload.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}