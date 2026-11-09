import "server-only";
import { prisma } from "@/lib/db";
import {
  getUmkmSubscriptionOverview,
  getAvailablePackagesForUmkm,
} from "./service";

export async function getActivePackages() {
  return await prisma.package.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

export async function getUmkmSubscriptionPageData(userId: string) {
  const umkm = await prisma.umkmProfile.findUnique({
    where: { userId },
  });

  if (!umkm) return null;

  const [overview, availablePackages] = await Promise.all([
    getUmkmSubscriptionOverview(umkm.id),
    getAvailablePackagesForUmkm(umkm.id),
  ]);

  return {
    umkm,
    overview,
    availablePackages,
  };
}

export async function getAdminSubscriptionsData() {
  const [pendingQueue, recentHistory] = await Promise.all([
    prisma.subscription.findMany({
      where: { status: "PENDING_PAYMENT" },
      include: {
        package: true,
        umkm: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscription.findMany({
      where: { status: { not: "PENDING_PAYMENT" } },
      include: {
        package: true,
        umkm: true,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return { pendingQueue, recentHistory };
}

export async function getAdminPackagesData() {
  return await prisma.package.findMany({
    orderBy: { sortOrder: "asc" },
  });
}
