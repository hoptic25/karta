import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../src/lib/db";
import { getDetailedImpactMetrics } from "../src/features/platform/impact";

vi.mock("../src/lib/db", () => ({
  prisma: {
    ledgerEntry: {
      aggregate: vi.fn(),
    },
    job: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    jobAssignment: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    campus: {
      count: vi.fn(),
    },
    studentProfile: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    umkmProfile: {
      findMany: vi.fn(),
    },
  },
}));

describe("Impact Metrics Dashboard (PRD §G-14 & SDG 8, 4, 10)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate consolidated metrics accurately", async () => {
    // 1. Total rewards
    vi.mocked(prisma.ledgerEntry.aggregate).mockResolvedValue({
      _sum: { amountIdr: 1_250_000 },
    } as never);

    // 2. Completed jobs
    vi.mocked(prisma.job.count)
      .mockResolvedValueOnce(25) // status: ACCEPTED
      .mockResolvedValueOnce(5); // volunteer projects

    // 3. Active students (completed assignments)
    vi.mocked(prisma.jobAssignment.groupBy).mockResolvedValue([
      { studentId: "s-1", _count: { studentId: 3 } },
      { studentId: "s-2", _count: { studentId: 2 } },
    ] as never);

    // 4. Served UMKM
    vi.mocked(prisma.job.groupBy).mockResolvedValue([
      { umkmId: "u-1", _count: { umkmId: 5 } },
    ] as never);

    // 5. Active campuses
    vi.mocked(prisma.campus.count).mockResolvedValue(4);

    // 6. Total students for rate
    vi.mocked(prisma.studentProfile.count).mockResolvedValue(10);

    // 7. Median time calculation
    const now = new Date();
    const regDate1 = new Date(now.getTime() - 48 * 3600 * 1000);
    const regDate2 = new Date(now.getTime() - 24 * 3600 * 1000);

    vi.mocked(prisma.jobAssignment.findMany).mockResolvedValue([
      {
        studentId: "s-1",
        endedAt: now,
        student: { createdAt: regDate1 },
      },
      {
        studentId: "s-2",
        endedAt: now,
        student: { createdAt: regDate2 },
      },
    ] as never);

    // 8. Province distribution
    vi.mocked(prisma.studentProfile.findMany).mockResolvedValue([
      { campus: { province: "Jawa Barat" } },
      { campus: { province: "Jawa Barat" } },
      { campus: { province: "D.I. Yogyakarta" } },
    ] as never);

    vi.mocked(prisma.umkmProfile.findMany).mockResolvedValue([
      { province: "Jawa Barat" },
      { province: "Jawa Tengah" },
    ] as never);

    const metrics = await getDetailedImpactMetrics();

    expect(metrics.totalRewardsIdr).toBe(1_250_000);
    expect(metrics.completedJobsCount).toBe(25);
    expect(metrics.activeStudentsCount).toBe(2);
    expect(metrics.servedUmkmCount).toBe(1);
    expect(metrics.activeCampusesCount).toBe(4);
    expect(metrics.volunteerProjectsCount).toBe(5);
    // 2 active out of 10 total = 20%
    expect(metrics.firstJobRatePercent).toBe(20);
    // 24 and 48 -> median 36 hours
    expect(metrics.medianTimeToFirstJobHours).toBe(36);
    expect(metrics.studentProvinceDistribution).toEqual([
      { province: "Jawa Barat", count: 2 },
      { province: "D.I. Yogyakarta", count: 1 },
    ]);
  });
});

