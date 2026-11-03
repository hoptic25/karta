import "server-only";

import { prisma } from "@/lib/db";
import type { JobStatus } from "@/generated/prisma/client";

export interface AdminDashboardSummary {
  users: {
    total: number;
    students: number;
    umkm: number;
    suspended: number;
  };
  jobsByStatus: Record<JobStatus, number>;
  totalJobs: number;
  queues: {
    pendingSubscriptions: number;
    openDisputes: number;
    openFailureReports: number;
    requestedWithdrawals: number;
  };
  financial: {
    totalPayableIdr: number;
    totalPaidIdr: number;
    totalPlatformFeeIdr: number;
  };
}

/**
 * G-1: Mengambil ringkasan operasional KARTA untuk halaman /admin
 */
export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  const [
    totalUsers,
    totalStudents,
    totalUmkm,
    suspendedUsers,
    jobsGrouped,
    pendingSubscriptions,
    openDisputes,
    openFailureReports,
    requestedWithdrawals,
    studentPayableSum,
    studentPaidSum,
    platformFeeSum,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.studentProfile.count(),
    prisma.umkmProfile.count(),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
    prisma.job.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.subscription.count({ where: { status: "PENDING_PAYMENT" } }),
    prisma.dispute.count({ where: { status: "OPEN" } }),
    prisma.failureReport.count({ where: { status: "OPEN" } }),
    prisma.withdrawal.count({ where: { status: "REQUESTED" } }),
    prisma.ledgerEntry.aggregate({
      where: { type: "STUDENT_SHARE", status: "PAYABLE" },
      _sum: { amountIdr: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: { type: "STUDENT_SHARE", status: "PAID" },
      _sum: { amountIdr: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: { type: "PLATFORM_FEE", status: "RECOGNIZED" },
      _sum: { amountIdr: true },
    }),
  ]);

  const allStatuses: JobStatus[] = [
    "DRAFT",
    "OPEN",
    "CLAIMED",
    "IN_PROGRESS",
    "SUBMITTED",
    "REVISION_REQUESTED",
    "ACCEPTED",
    "REJECTED",
    "DISPUTED",
    "EXPIRED",
    "CANCELLED",
  ];

  const jobsByStatus = allStatuses.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {} as Record<JobStatus, number>);

  let totalJobs = 0;
  for (const group of jobsGrouped) {
    jobsByStatus[group.status] = group._count.status;
    totalJobs += group._count.status;
  }

  return {
    users: {
      total: totalUsers,
      students: totalStudents,
      umkm: totalUmkm,
      suspended: suspendedUsers,
    },
    jobsByStatus,
    totalJobs,
    queues: {
      pendingSubscriptions,
      openDisputes,
      openFailureReports,
      requestedWithdrawals,
    },
    financial: {
      totalPayableIdr: studentPayableSum._sum.amountIdr ?? 0,
      totalPaidIdr: studentPaidSum._sum.amountIdr ?? 0,
      totalPlatformFeeIdr: platformFeeSum._sum.amountIdr ?? 0,
    },
  };
}

