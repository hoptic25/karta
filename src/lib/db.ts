import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getDatabaseConnectionString(): string {
  let url = process.env.DATABASE_URL || "";
  // Silences pg / pg-connection-string warning on Vercel when sslmode=require
  if (
    (url.includes("sslmode=require") ||
      url.includes("sslmode=prefer") ||
      url.includes("sslmode=verify-ca")) &&
    !url.includes("uselibpqcompat")
  ) {
    url += url.includes("?") ? "&uselibpqcompat=true" : "?uselibpqcompat=true";
  }
  return url;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: getDatabaseConnectionString(),
      max: 5,
      idleTimeoutMillis: 5 * 60_000,
      keepAlive: true,
    }),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
