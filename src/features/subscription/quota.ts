import "server-only";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import type { Subscription } from "@/generated/prisma/client";

export class QuotaError extends Error {
  code: string;
  constructor(message: string, code = "QUOTA_ERROR") {
    super(message);
    this.name = "QuotaError";
    this.code = code;
  }
}

/**
 * Ensures the UMKM has an active monthly free quota subscription (BR-S1).
 * Dibuat lazy: saat UMKM membuka dashboard/publish dan belum ada langganan FREE
 * untuk periodKey bulan itu ("YYYY-MM"), sistem membuatnya ACTIVE dengan quotaTotal = 3.
 */
export async function ensureMonthlyFreeQuota(umkmId: string): Promise<Subscription | null> {
  const currentPeriodKey = format(new Date(), "yyyy-MM");

  // Check if monthly free subscription already exists for this period
  const existingFree = await prisma.subscription.findFirst({
    where: {
      umkmId,
      periodKey: currentPeriodKey,
      package: { code: "FREE" },
    },
  });

  if (existingFree) {
    return existingFree;
  }

  // Find FREE package
  const freePkg = await prisma.package.findUnique({
    where: { code: "FREE" },
  });

  if (!freePkg) return null;

  const now = new Date();
  // End of month
  const endsAt = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  return await prisma.subscription.create({
    data: {
      umkmId,
      packageId: freePkg.id,
      status: "ACTIVE",
      periodKey: currentPeriodKey,
      startsAt: now,
      endsAt,
      quotaTotal: freePkg.jobQuota,
      quotaUsed: 0,
    },
  });
}

/**
 * Deducts 1 quota from a subscription and records QuotaLedger (BR-S4).
 * Must be executed inside a transaction.
 */
export async function deductQuota(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  subscriptionId: string,
  jobId: string,
  reason: string
) {
  const sub = await tx.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!sub) {
    throw new QuotaError("Langganan tidak ditemukan.", "SUBSCRIPTION_NOT_FOUND");
  }

  if (sub.status !== "ACTIVE") {
    throw new QuotaError("Langganan tidak sedang aktif.", "SUBSCRIPTION_INACTIVE");
  }

  if (sub.endsAt && sub.endsAt.getTime() < Date.now()) {
    throw new QuotaError("Masa berlaku paket langganan telah berakhir.", "SUBSCRIPTION_EXPIRED");
  }

  if (sub.quotaUsed >= sub.quotaTotal) {
    throw new QuotaError("Kuota pekerjaan pada paket ini telah habis.", "QUOTA_EXHAUSTED");
  }

  // Increment quotaUsed
  await tx.subscription.update({
    where: { id: subscriptionId },
    data: { quotaUsed: { increment: 1 } },
  });

  // Create QuotaLedger entry
  await tx.quotaLedger.create({
    data: {
      subscriptionId,
      jobId,
      delta: -1,
      reason,
    },
  });
}

/**
 * Restores 1 quota to a subscription and records QuotaLedger (BR-S5).
 * Dipulihkan hanya pada: (a) job OPEN dibatalkan UMKM, (b) job EXPIRED tanpa pengambil,
 * (c) job CLAIMED (belum mulai) dibatalkan UMKM, (d) pembatalan setelah kegagalan mahasiswa terkonfirmasi,
 * (e) admin membatalkan job dengan opsi restoreQuota.
 */
export async function restoreQuota(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  subscriptionId: string,
  jobId: string,
  reason: string
) {
  const sub = await tx.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!sub) {
    throw new QuotaError("Langganan tidak ditemukan.", "SUBSCRIPTION_NOT_FOUND");
  }

  // Restore only if quotaUsed > 0
  if (sub.quotaUsed > 0) {
    await tx.subscription.update({
      where: { id: subscriptionId },
      data: { quotaUsed: { decrement: 1 } },
    });
  }

  // Record restoration
  await tx.quotaLedger.create({
    data: {
      subscriptionId,
      jobId,
      delta: +1,
      reason,
    },
  });
}

/**
 * Returns available subscriptions for publishing jobs:
 * Must be ACTIVE, endsAt > now, and remaining quota > 0.
 */
export async function getAvailableSubscriptionsForUmkm(umkmId: string) {
  await ensureMonthlyFreeQuota(umkmId);

  const now = new Date();
  const subs = await prisma.subscription.findMany({
    where: {
      umkmId,
      status: "ACTIVE",
      endsAt: { gt: now },
    },
    include: {
      package: true,
    },
    orderBy: {
      startsAt: "desc",
    },
  });

  return subs.filter((sub) => sub.quotaUsed < sub.quotaTotal);
}

