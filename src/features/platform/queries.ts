import "server-only";
import { prisma } from "@/lib/db";

export async function getLandingImpactMetrics() {
  const [totalUmkm, totalStudents, totalCampuses, completedJobs, paidLedgerSum] =
    await Promise.all([
      prisma.umkmProfile.count(),
      prisma.studentProfile.count(),
      prisma.campus.count({ where: { isActive: true } }),
      prisma.job.count({ where: { status: "ACCEPTED" } }),
      prisma.ledgerEntry.aggregate({
        where: {
          type: "STUDENT_SHARE",
          status: { in: ["PAYABLE", "PAID"] },
        },
        _sum: { amountIdr: true },
      }),
    ]);

  return {
    totalUmkm,
    totalStudents,
    totalCampuses,
    completedJobs,
    totalEarningsIdr: paidLedgerSum?._sum?.amountIdr ?? 0,
  };
}
