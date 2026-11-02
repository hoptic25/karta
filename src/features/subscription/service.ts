import "server-only";
import { prisma } from "@/lib/db";
import { ensureMonthlyFreeQuota } from "./quota";
import { format, addDays } from "date-fns";

export class SubscriptionError extends Error {
  code: string;
  constructor(message: string, code = "SUBSCRIPTION_ERROR") {
    super(message);
    this.name = "SubscriptionError";
    this.code = code;
  }
}

/**
 * Gets subscription overview for UMKM dashboard / subscription page (B-1)
 */
export async function getUmkmSubscriptionOverview(umkmId: string) {
  // Ensure free quota exists for current month (BR-S1)
  await ensureMonthlyFreeQuota(umkmId);

  const now = new Date();
  const currentPeriodKey = format(now, "yyyy-MM");

  const [activePaidSub, activeFreeSub, pendingSub, history, quotaHistory, umkm] =
    await Promise.all([
      // Active paid package
      prisma.subscription.findFirst({
        where: {
          umkmId,
          status: "ACTIVE",
          endsAt: { gt: now },
          package: { segment: { not: "FREE" } },
        },
        include: { package: true },
        orderBy: { endsAt: "desc" },
      }),
      // Active free package for this month
      prisma.subscription.findFirst({
        where: {
          umkmId,
          periodKey: currentPeriodKey,
          package: { code: "FREE" },
        },
        include: { package: true },
      }),
      // Pending payment subscription
      prisma.subscription.findFirst({
        where: {
          umkmId,
          status: "PENDING_PAYMENT",
        },
        include: { package: true },
        orderBy: { createdAt: "desc" },
      }),
      // Subscription history
      prisma.subscription.findMany({
        where: { umkmId },
        include: { package: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      // Quota usage history
      prisma.quotaLedger.findMany({
        where: { subscription: { umkmId } },
        include: {
          subscription: { include: { package: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      // UMKM details (partner status)
      prisma.umkmProfile.findUnique({
        where: { id: umkmId },
      }),
    ]);

  // Payment instructions from PlatformConfig
  const paymentConfig = await prisma.platformConfig.findUnique({
    where: { key: "paymentInstructions" },
  });

  const paymentInstructions =
    (paymentConfig?.value as string) ||
    "Silakan transfer ke rekening BCA 1234567890 a.n. PT Karta Digital Bangsa.";

  return {
    activePaidSub,
    activeFreeSub,
    pendingSub,
    history,
    quotaHistory,
    isCampusPartner: umkm?.isCampusPartner ?? false,
    paymentInstructions,
  };
}

/**
 * Gets packages available for UMKM according to their partnership status
 */
export async function getAvailablePackagesForUmkm(umkmId: string) {
  const umkm = await prisma.umkmProfile.findUnique({
    where: { id: umkmId },
  });

  if (!umkm) {
    throw new SubscriptionError("Profil UMKM tidak ditemukan.", "NOT_FOUND");
  }

  const segment = umkm.isCampusPartner ? "PARTNER" : "NON_PARTNER";

  return await prisma.package.findMany({
    where: {
      segment,
      isActive: true,
    },
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * UMKM selects a paid package -> creates Subscription(PENDING_PAYMENT)
 */
export async function selectPackage(umkmId: string, packageId: string) {
  const umkm = await prisma.umkmProfile.findUnique({
    where: { id: umkmId },
  });

  if (!umkm) {
    throw new SubscriptionError("Profil UMKM tidak ditemukan.", "NOT_FOUND");
  }

  const selectedPkg = await prisma.package.findUnique({
    where: { id: packageId },
  });

  if (!selectedPkg || !selectedPkg.isActive) {
    throw new SubscriptionError("Paket tidak ditemukan atau sedang nonaktif.", "PACKAGE_UNAVAILABLE");
  }

  if (selectedPkg.segment === "FREE") {
    throw new SubscriptionError("Paket gratis diperbarui secara otomatis setiap bulan.", "FREE_AUTO_PROVISION");
  }

  // Segment validation
  const requiredSegment = umkm.isCampusPartner ? "PARTNER" : "NON_PARTNER";
  if (selectedPkg.segment !== requiredSegment) {
    throw new SubscriptionError(
      "Paket ini tidak sesuai dengan segmen akun Anda.",
      "SEGMENT_MISMATCH"
    );
  }

  const now = new Date();

  // Check BR-S3: Maximum 1 active paid subscription. Renewal allowed only if endsAt <= now + 7 days
  const activePaidSub = await prisma.subscription.findFirst({
    where: {
      umkmId,
      status: "ACTIVE",
      endsAt: { gt: now },
      package: { segment: { not: "FREE" } },
    },
  });

  if (activePaidSub && activePaidSub.endsAt) {
    const daysUntilExpiry = (activePaidSub.endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntilExpiry > 7) {
      throw new SubscriptionError(
        `Anda masih memiliki paket aktif yang berlaku hingga ${format(activePaidSub.endsAt, "dd MMM yyyy")}. Perpanjangan baru dapat diajukan 7 hari sebelum masa aktif berakhir.`,
        "ACTIVE_SUBSCRIPTION_EXISTS"
      );
    }
  }

  // Cancel any existing PENDING_PAYMENT to avoid multiple pending
  await prisma.subscription.updateMany({
    where: {
      umkmId,
      status: "PENDING_PAYMENT",
    },
    data: { status: "CANCELLED" },
  });

  // Create new PENDING_PAYMENT subscription
  const subscription = await prisma.subscription.create({
    data: {
      umkmId,
      packageId: selectedPkg.id,
      status: "PENDING_PAYMENT",
      quotaTotal: selectedPkg.jobQuota,
      quotaUsed: 0,
    },
    include: { package: true },
  });

  return subscription;
}

/**
 * UMKM cancels a PENDING_PAYMENT subscription
 */
export async function cancelPendingSubscription(subscriptionId: string, umkmId: string) {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!sub || sub.umkmId !== umkmId) {
    throw new SubscriptionError("Langganan tidak ditemukan.", "NOT_FOUND");
  }

  if (sub.status !== "PENDING_PAYMENT") {
    throw new SubscriptionError("Hanya paket yang menunggu pembayaran yang dapat dibatalkan.", "INVALID_STATUS");
  }

  return await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: "CANCELLED" },
  });
}

/**
 * Admin marks subscription as paid (BR-S2) 🧾
 */
export async function markSubscriptionPaid(
  subscriptionId: string,
  adminUserId: string,
  paymentNote?: string
) {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { package: true, umkm: true },
  });

  if (!sub) {
    throw new SubscriptionError("Langganan tidak ditemukan.", "NOT_FOUND");
  }

  if (sub.status !== "PENDING_PAYMENT") {
    throw new SubscriptionError("Langganan ini sudah tidak berstatus menunggu pembayaran.", "INVALID_STATUS");
  }

  const now = new Date();

  // Check if renewal chain applies (active subscription ending soon)
  const existingActive = await prisma.subscription.findFirst({
    where: {
      umkmId: sub.umkmId,
      status: "ACTIVE",
      endsAt: { gt: now },
      id: { not: sub.id },
      package: { segment: { not: "FREE" } },
    },
  });

  let startsAt = now;
  if (existingActive?.endsAt && existingActive.endsAt > now) {
    startsAt = existingActive.endsAt;
  }
  const endsAt = addDays(startsAt, sub.package.durationDays || 30);

  return await prisma.$transaction(async (tx) => {
    // 1. Activate subscription
    const updatedSub = await tx.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: "ACTIVE",
        startsAt,
        endsAt,
        paidAt: now,
        markedPaidBy: adminUserId,
        paymentNote: paymentNote || null,
      },
      include: { package: true, umkm: true },
    });

    // 2. Audit log 🧾
    await tx.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "SUBSCRIPTION_MARK_PAID",
        entity: "Subscription",
        entityId: subscriptionId,
        meta: {
          startsAt,
          endsAt,
          packageCode: sub.package.code,
          umkmBusinessName: sub.umkm.businessName,
          paymentNote,
        },
      },
    });

    // 3. Notification to UMKM
    await tx.notification.create({
      data: {
        userId: sub.umkm.userId,
        type: "SUBSCRIPTION_ACTIVATED",
        title: "Paket Langganan Telah Aktif",
        body: `Pembayaran paket ${sub.package.name} telah dikonfirmasi. Kuota sebanyak ${sub.package.jobQuota} pekerjaan kini aktif.`,
        href: "/umkm/subscription",
      },
    });

    return updatedSub;
  });
}

/**
 * Admin cancels subscription 🧾
 */
export async function adminCancelSubscription(
  subscriptionId: string,
  adminUserId: string,
  reason: string
) {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { package: true, umkm: true },
  });

  if (!sub) {
    throw new SubscriptionError("Langganan tidak ditemukan.", "NOT_FOUND");
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.subscription.update({
      where: { id: subscriptionId },
      data: { status: "CANCELLED" },
    });

    await tx.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "SUBSCRIPTION_CANCELLED",
        entity: "Subscription",
        entityId: subscriptionId,
        meta: { reason, adminUserId },
      },
    });

    return updated;
  });
}

/**
 * Admin updates package pricing / quota 🧾 (G-5)
 */
export async function updatePackage(
  packageId: string,
  adminUserId: string,
  data: {
    priceIdr?: number;
    jobQuota?: number;
    allocationPerJobIdr?: number;
    isActive?: boolean;
  }
) {
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
  });

  if (!pkg) {
    throw new SubscriptionError("Paket tidak ditemukan.", "NOT_FOUND");
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.package.update({
      where: { id: packageId },
      data: {
        priceIdr: data.priceIdr !== undefined ? data.priceIdr : pkg.priceIdr,
        jobQuota: data.jobQuota !== undefined ? data.jobQuota : pkg.jobQuota,
        allocationPerJobIdr:
          data.allocationPerJobIdr !== undefined
            ? data.allocationPerJobIdr
            : pkg.allocationPerJobIdr,
        isActive: data.isActive !== undefined ? data.isActive : pkg.isActive,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "PACKAGE_UPDATED",
        entity: "Package",
        entityId: packageId,
        meta: { previous: pkg, updated: data },
      },
    });

    return updated;
  });
}

