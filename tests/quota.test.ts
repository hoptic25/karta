import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ensureMonthlyFreeQuota,
  deductQuota,
  restoreQuota,
} from "../src/features/subscription/quota";
import { selectPackage } from "../src/features/subscription/service";
import { prisma } from "../src/lib/db";
import { addDays } from "date-fns";

vi.mock("../src/lib/db", () => ({
  prisma: {
    subscription: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    package: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    quotaLedger: {
      create: vi.fn(),
    },
    umkmProfile: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
      return cb(prisma);
    }),
  },
}));

describe("Subscription Quota & Management (BR-S1 - BR-S5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("provisions monthly free quota lazily if none exists (BR-S1)", async () => {
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.package.findUnique).mockResolvedValue({
      id: "pkg-free",
      code: "FREE",
      jobQuota: 3,
    } as never);
    vi.mocked(prisma.subscription.create).mockResolvedValue({
      id: "sub-free-1",
      umkmId: "umkm-1",
      packageId: "pkg-free",
      status: "ACTIVE",
      quotaTotal: 3,
      quotaUsed: 0,
    } as never);

    const result = await ensureMonthlyFreeQuota("umkm-1");
    expect(prisma.subscription.create).toHaveBeenCalled();
    expect(result?.quotaTotal).toBe(3);
  });

  it("deducts quota by 1 and records QuotaLedger entry (BR-S4)", async () => {
    const tx = prisma;
    vi.mocked(tx.subscription.findUnique).mockResolvedValue({
      id: "sub-paid-1",
      status: "ACTIVE",
      quotaTotal: 6,
      quotaUsed: 2,
      endsAt: addDays(new Date(), 15),
    } as never);

    await deductQuota(tx as never, "sub-paid-1", "job-1", "PUBLISH_JOB");

    expect(tx.subscription.update).toHaveBeenCalledWith({
      where: { id: "sub-paid-1" },
      data: { quotaUsed: { increment: 1 } },
    });
    expect(tx.quotaLedger.create).toHaveBeenCalledWith({
      data: {
        subscriptionId: "sub-paid-1",
        jobId: "job-1",
        delta: -1,
        reason: "PUBLISH_JOB",
      },
    });
  });

  it("throws error when trying to deduct from exhausted subscription", async () => {
    const tx = prisma;
    vi.mocked(tx.subscription.findUnique).mockResolvedValue({
      id: "sub-paid-2",
      status: "ACTIVE",
      quotaTotal: 3,
      quotaUsed: 3,
      endsAt: addDays(new Date(), 10),
    } as never);

    await expect(
      deductQuota(tx as never, "sub-paid-2", "job-2", "PUBLISH_JOB")
    ).rejects.toThrow("Kuota pekerjaan pada paket ini telah habis.");
  });

  it("restores quota by 1 and records QuotaLedger entry (BR-S5)", async () => {
    const tx = prisma;
    vi.mocked(tx.subscription.findUnique).mockResolvedValue({
      id: "sub-paid-1",
      quotaUsed: 3,
    } as never);

    await restoreQuota(tx as never, "sub-paid-1", "job-1", "JOB_CANCELLED_RESTORE");

    expect(tx.subscription.update).toHaveBeenCalledWith({
      where: { id: "sub-paid-1" },
      data: { quotaUsed: { decrement: 1 } },
    });
    expect(tx.quotaLedger.create).toHaveBeenCalledWith({
      data: {
        subscriptionId: "sub-paid-1",
        jobId: "job-1",
        delta: +1,
        reason: "JOB_CANCELLED_RESTORE",
      },
    });
  });

  it("prevents selecting new package when active subscription has > 7 days remaining (BR-S3)", async () => {
    vi.mocked(prisma.umkmProfile.findUnique).mockResolvedValue({
      id: "umkm-1",
      isCampusPartner: true,
    } as never);

    vi.mocked(prisma.package.findUnique).mockResolvedValue({
      id: "pkg-partner-pro",
      segment: "PARTNER",
      isActive: true,
      jobQuota: 6,
    } as never);

    // Active subscription expires in 20 days (> 7 days)
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
      id: "sub-active",
      status: "ACTIVE",
      endsAt: addDays(new Date(), 20),
    } as never);

    await expect(
      selectPackage("umkm-1", "pkg-partner-pro")
    ).rejects.toThrow("Perpanjangan baru dapat diajukan 7 hari sebelum masa aktif berakhir.");
  });

  it("allows selecting new package when active subscription has <= 7 days remaining (BR-S3)", async () => {
    vi.mocked(prisma.umkmProfile.findUnique).mockResolvedValue({
      id: "umkm-1",
      isCampusPartner: true,
    } as never);

    vi.mocked(prisma.package.findUnique).mockResolvedValue({
      id: "pkg-partner-pro",
      segment: "PARTNER",
      isActive: true,
      jobQuota: 6,
    } as never);

    // Active subscription expires in 3 days (<= 7 days)
    vi.mocked(prisma.subscription.findFirst).mockResolvedValue({
      id: "sub-active",
      status: "ACTIVE",
      endsAt: addDays(new Date(), 3),
    } as never);

    vi.mocked(prisma.subscription.create).mockResolvedValue({
      id: "sub-new-pending",
      status: "PENDING_PAYMENT",
    } as never);

    const result = await selectPackage("umkm-1", "pkg-partner-pro");
    expect(result.status).toBe("PENDING_PAYMENT");
  });
});

