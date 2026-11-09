import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
      max: 5,
      idleTimeoutMillis: 5 * 60_000,
      keepAlive: true,
    }),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
