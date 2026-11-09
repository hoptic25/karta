import "server-only";

import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";

export interface ProvinceDistribution {
  province: string;
  count: number;
}

export interface DetailedImpactMetrics {
  totalRewardsIdr: number;
  completedJobsCount: number;
  activeStudentsCount: number;
  servedUmkmCount: number;
  activeCampusesCount: number;
  volunteerProjectsCount: number;
  firstJobRatePercent: number;
  medianTimeToFirstJobHours: number;
  studentProvinceDistribution: ProvinceDistribution[];
  umkmProvinceDistribution: ProvinceDistribution[];
}

/**
 * G-14: Menghitung seluruh metrik dampak sosial & ekonomi KARTA (SDG 8, 4, 10)
 */
export async function getDetailedImpactMetrics(): Promise<DetailedImpactMetrics> {
  // 1. Total imbalan tersalurkan: STUDENT_SHARE dengan status PAYABLE atau PAID
  const rewardSum = await prisma.ledgerEntry.aggregate({
    where: {
      type: "STUDENT_SHARE",
      status: { in: ["PAYABLE", "PAID"] },
    },
    _sum: { amountIdr: true },
  });
  const totalRewardsIdr = rewardSum._sum.amountIdr ?? 0;

  // 2. Jumlah pekerjaan selesai (status ACCEPTED)
  const completedJobsCount = await prisma.job.count({
    where: { status: "ACCEPTED" },
  });

  // 3. Mahasiswa aktif: memiliki setidaknya 1 penugasan yang selesai (COMPLETED)
  const activeStudentGroups = await prisma.jobAssignment.groupBy({
    by: ["studentId"],
    where: { status: "COMPLETED" },
    _count: { studentId: true },
  });
  const activeStudentsCount = activeStudentGroups.length;

  // 4. UMKM terlayani: memiliki setidaknya 1 pekerjaan ACCEPTED
  const servedUmkmGroups = await prisma.job.groupBy({
    by: ["umkmId"],
    where: { status: "ACCEPTED" },
    _count: { umkmId: true },
  });
  const servedUmkmCount = servedUmkmGroups.length;

  // 5. Kampus mitra aktif
  const activeCampusesCount = await prisma.campus.count({
    where: { isActive: true },
  });

  // 6. Jumlah Volunteer Project selesai (packageTier === 'FREE' atau isPaid === false)
  const volunteerProjectsCount = await prisma.job.count({
    where: {
      status: "ACCEPTED",
      OR: [{ packageTier: "FREE" }, { isPaid: false }],
    },
  });

  // 7. Persentase mahasiswa yang mendapat pekerjaan pertama
  const totalStudents = await prisma.studentProfile.count();
  const firstJobRatePercent =
    totalStudents > 0
      ? Math.round((activeStudentsCount / totalStudents) * 100)
      : 0;

  // 8. Median waktu dari registrasi mahasiswa ke pekerjaan pertama diterima (dalam jam)
  // Query penugasan pertama tiap mahasiswa yang COMPLETED
  const firstCompletedAssignments = await prisma.jobAssignment.findMany({
    where: { status: "COMPLETED" },
    include: {
      student: { select: { createdAt: true } },
    },
    orderBy: { endedAt: "asc" },
  });

  const studentFirstCompletionMap = new Map<string, number>();
  for (const assign of firstCompletedAssignments) {
    if (!studentFirstCompletionMap.has(assign.studentId) && assign.endedAt) {
      const durationHours =
        (assign.endedAt.getTime() - assign.student.createdAt.getTime()) /
        (1000 * 60 * 60);
      studentFirstCompletionMap.set(
        assign.studentId,
        Math.max(0, Math.round(durationHours))
      );
    }
  }

  const durationList = Array.from(studentFirstCompletionMap.values()).sort(
    (a, b) => a - b
  );
  let medianTimeToFirstJobHours = 0;
  if (durationList.length > 0) {
    const mid = Math.floor(durationList.length / 2);
    medianTimeToFirstJobHours =
      durationList.length % 2 !== 0
        ? durationList[mid]
        : Math.round((durationList[mid - 1] + durationList[mid]) / 2);
  }

  // 9. Sebaran provinsi mahasiswa (via kampus)
  const studentsWithCampus = await prisma.studentProfile.findMany({
    select: {
      campus: { select: { province: true } },
    },
  });

  const studentProvinceMap = new Map<string, number>();
  for (const s of studentsWithCampus) {
    const prov = s.campus?.province || "Lainnya";
    studentProvinceMap.set(prov, (studentProvinceMap.get(prov) || 0) + 1);
  }

  const studentProvinceDistribution: ProvinceDistribution[] = Array.from(
    studentProvinceMap.entries()
  )
    .map(([province, count]) => ({ province, count }))
    .sort((a, b) => b.count - a.count);

  // 10. Sebaran provinsi UMKM (via profil)
  const umkmProfiles = await prisma.umkmProfile.findMany({
    select: { province: true },
  });

  const umkmProvinceMap = new Map<string, number>();
  for (const u of umkmProfiles) {
    const prov = u.province || "Lainnya";
    umkmProvinceMap.set(prov, (umkmProvinceMap.get(prov) || 0) + 1);
  }

  const umkmProvinceDistribution: ProvinceDistribution[] = Array.from(
    umkmProvinceMap.entries()
  )
    .map(([province, count]) => ({ province, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalRewardsIdr,
    completedJobsCount,
    activeStudentsCount,
    servedUmkmCount,
    activeCampusesCount,
    volunteerProjectsCount,
    firstJobRatePercent,
    medianTimeToFirstJobHours,
    studentProvinceDistribution,
    umkmProvinceDistribution,
  };
}

/**
 * 4 Counter teratas untuk landing page (di-cache 1 jam / 3600 detik per PRD §G-14 & J-1)
 */
export const getCachedLandingMetrics = unstable_cache(
  async () => {
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
  },
  ["landing-impact-metrics"],
  { revalidate: 3600, tags: ["impact-metrics"] }
);

