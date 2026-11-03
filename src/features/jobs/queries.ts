import "server-only";

import { prisma } from "@/lib/db";
import { evaluateJobTimeRules } from "@/features/platform";
import {
  getAvailableSubscriptionsForUmkm,
  getUmkmSubscriptionOverview,
} from "@/features/subscription";
import type { JobStatus, Prisma } from "@/generated/prisma/client";

export async function getUmkmJobs(
  umkmId: string,
  options?: {
    status?: JobStatus | "ALL";
    search?: string;
  }
) {
  const where: Prisma.JobWhereInput = {
    umkmId,
  };

  if (options?.status && options.status !== "ALL") {
    where.status = options.status;
  }

  if (options?.search && options.search.trim().length > 0) {
    where.title = {
      contains: options.search.trim(),
      mode: "insensitive",
    };
  }

  return await prisma.job.findMany({
    where,
    include: {
      criteria: { orderBy: { position: "asc" } },
      subscription: { include: { package: true } },
      assignments: {
        where: { status: "ACTIVE" },
        include: {
          student: {
            include: {
              user: { select: { name: true, image: true, email: true } },
              campus: { select: { name: true } },
            },
          },
        },
      },
      _count: {
        select: {
          assignments: true,
          images: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUmkmJobDetail(jobId: string, umkmId: string) {
  return await prisma.job.findFirst({
    where: {
      id: jobId,
      umkmId,
    },
    include: {
      criteria: { orderBy: { position: "asc" } },
      images: true,
      subscription: { include: { package: true } },
      assignments: {
        orderBy: { claimedAt: "desc" },
        include: {
          student: {
            include: {
              user: { select: { name: true, image: true, email: true } },
              campus: { select: { name: true, city: true } },
            },
          },
          submissions: {
            orderBy: { number: "desc" },
            include: {
              review: true,
            },
          },
        },
      },
      deadlineRequests: {
        orderBy: { createdAt: "desc" },
      },
      dispute: true,
      failureReports: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getJobPublishOptions(umkmId: string) {
  return await getAvailableSubscriptionsForUmkm(umkmId);
}

export async function getJobForEdit(jobId: string, umkmId: string) {
  return await prisma.job.findFirst({
    where: {
      id: jobId,
      umkmId,
    },
    include: {
      criteria: { orderBy: { position: "asc" } },
      images: true,
    },
  });
}


import { isJobClaimableByDeadline, getClaimCutoffTime } from "./deadline";
import { rankJobs } from "./ranking";
import { checkClaimEligibility } from "./claim";
import type { JobRole } from "@/generated/prisma/client";

export interface DiscoveryFilterOptions {
  role?: JobRole | "ALL";
  type?: "ALL" | "PAID" | "UNPAID";
  search?: string;
  sort?: "RECOMMENDED" | "LATEST" | "DEADLINE" | "REWARD";
  page?: number;
  limit?: number;
}

export async function getStudentDiscoveryJobs(
  studentUserId: string,
  options?: DiscoveryFilterOptions
) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId: studentUserId },
    include: {
      user: { select: { status: true } },
    },
  });

  if (!student) return null;

  // Hitung penugasan aktif mahasiswa
  const activeAssignments = await prisma.jobAssignment.findMany({
    where: {
      studentId: student.id,
      status: "ACTIVE",
    },
    include: {
      job: { select: { isPaid: true } },
    },
  });

  const activeAssignmentsCount = activeAssignments.length;
  const activeUnpaidCount = activeAssignments.filter((a) => !a.job.isPaid).length;

  const now = new Date();

  // Susun filter database
  const where: Prisma.JobWhereInput = {
    status: "OPEN",
    isHidden: false,
  };

  if (options?.role && options.role !== "ALL") {
    where.role = options.role;
  }

  if (options?.type === "PAID") {
    where.isPaid = true;
  } else if (options?.type === "UNPAID") {
    where.isPaid = false;
  }

  if (options?.search && options.search.trim().length > 0) {
    where.title = {
      contains: options.search.trim(),
      mode: "insensitive",
    };
  }

  // Ambil maksimal 200 job OPEN terbaru sesuai D-2
  const rawJobs = await prisma.job.findMany({
    where,
    include: {
      umkm: {
        select: {
          id: true,
          businessName: true,
          logoUrl: true,
          ratingAvg: true,
          ratingCount: true,
          isCampusPartner: true,
          partnerCampus: { select: { name: true } },
        },
      },
      criteria: {
        select: { id: true, text: true, position: true },
        orderBy: { position: "asc" },
      },
      _count: {
        select: { criteria: true, images: true },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: 200,
  });

  // Filter hanya yang belum lewat cutoff klaim (BR-J5)
  const claimableJobs = rawJobs.filter((job) => isJobClaimableByDeadline(job, now));

  // Berikan status kelayakan klaim untuk masing-masing job
  const enrichedJobs = claimableJobs.map((job) => {
    const eligibility = checkClaimEligibility(
      student,
      job,
      activeAssignmentsCount,
      activeUnpaidCount,
      now
    );
    const cutoffAt = getClaimCutoffTime(
      job.deadlineAt,
      job.role,
      job.packageTier || "BASIC"
    );

    return {
      ...job,
      eligibility,
      claimCutoffAt: cutoffAt,
    };
  });

  // Sorting
  const sortMode = options?.sort || "RECOMMENDED";
  let sortedJobs = enrichedJobs;

  if (sortMode === "RECOMMENDED") {
    sortedJobs = rankJobs(enrichedJobs, student.roles, now);
  } else if (sortMode === "LATEST") {
    sortedJobs.sort((a, b) => {
      const aTime = (a.publishedAt || a.createdAt).getTime();
      const bTime = (b.publishedAt || b.createdAt).getTime();
      return bTime - aTime;
    });
  } else if (sortMode === "DEADLINE") {
    sortedJobs.sort((a, b) => a.deadlineAt.getTime() - b.deadlineAt.getTime());
  } else if (sortMode === "REWARD") {
    sortedJobs.sort((a, b) => b.studentShareIdr - a.studentShareIdr);
  }

  // Pagination (20 item per halaman sesuai D-1)
  const page = Math.max(1, options?.page || 1);
  const limit = Math.max(1, options?.limit || 20);
  const total = sortedJobs.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedJobs = sortedJobs.slice((page - 1) * limit, page * limit);

  return {
    student,
    jobs: paginatedJobs,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
    activeAssignmentsCount,
    activeUnpaidCount,
  };
}

export async function getJobDetailForStudent(jobId: string, studentUserId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId: studentUserId },
    include: {
      user: { select: { status: true } },
    },
  });

  if (!student) return null;

  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      status: "OPEN",
      isHidden: false,
    },
    include: {
      umkm: {
        include: {
          partnerCampus: { select: { name: true, city: true } },
        },
      },
      criteria: { orderBy: { position: "asc" } },
      images: true,
    },
  });

  if (!job) return null;

  const activeAssignments = await prisma.jobAssignment.findMany({
    where: {
      studentId: student.id,
      status: "ACTIVE",
    },
    include: {
      job: { select: { isPaid: true } },
    },
  });

  const activeAssignmentsCount = activeAssignments.length;
  const activeUnpaidCount = activeAssignments.filter((a) => !a.job.isPaid).length;

  const now = new Date();
  const eligibility = checkClaimEligibility(
    student,
    job,
    activeAssignmentsCount,
    activeUnpaidCount,
    now
  );

  const claimCutoffAt = getClaimCutoffTime(
    job.deadlineAt,
    job.role,
    job.packageTier || "BASIC"
  );

  return {
    student,
    job,
    eligibility,
    claimCutoffAt,
    activeAssignmentsCount,
    activeUnpaidCount,
  };
}

export type MyJobTab = "ALL" | "ACTIVE" | "REVIEW" | "REVISION" | "COMPLETED" | "OTHER";

export async function getStudentMyJobs(
  studentId: string,
  filter?: {
    tab?: MyJobTab;
    search?: string;
  }
) {
  const currentTab = filter?.tab || "ALL";

  let statusFilter: JobStatus[] | undefined;
  if (currentTab === "ACTIVE") {
    statusFilter = ["CLAIMED", "IN_PROGRESS"];
  } else if (currentTab === "REVIEW") {
    statusFilter = ["SUBMITTED"];
  } else if (currentTab === "REVISION") {
    statusFilter = ["REVISION_REQUESTED"];
  } else if (currentTab === "COMPLETED") {
    statusFilter = ["ACCEPTED"];
  } else if (currentTab === "OTHER") {
    statusFilter = ["REJECTED", "DISPUTED", "CANCELLED", "EXPIRED"];
  }

  const whereAssignment: Prisma.JobAssignmentWhereInput = {
    studentId,
  };

  const jobWhere: Prisma.JobWhereInput = {};
  if (statusFilter) {
    jobWhere.status = { in: statusFilter };
  }
  if (filter?.search && filter.search.trim().length > 0) {
    jobWhere.title = {
      contains: filter.search.trim(),
      mode: "insensitive",
    };
  }

  if (Object.keys(jobWhere).length > 0) {
    whereAssignment.job = jobWhere;
  }

  const assignments = await prisma.jobAssignment.findMany({
    where: whereAssignment,
    orderBy: { claimedAt: "desc" },
    include: {
      job: {
        include: {
          umkm: {
            select: {
              id: true,
              businessName: true,
              logoUrl: true,
              ratingAvg: true,
              ratingCount: true,
              isCampusPartner: true,
              partnerCampus: { select: { name: true } },
            },
          },
          criteria: { orderBy: { position: "asc" } },
        },
      },
      submissions: {
        orderBy: { number: "desc" },
        take: 1,
        include: {
          review: true,
        },
      },
    },
  });

  return assignments;
}

export async function getStudentJobWorkspace(jobId: string, studentId: string) {
  // Evaluasi lazy aturan waktu pekerjaan saat workspace diakses
  await evaluateJobTimeRules(jobId);

  const assignment = await prisma.jobAssignment.findFirst({
    where: {
      jobId,
      studentId,
    },
    include: {
      job: {
        include: {
          umkm: {
            select: {
              id: true,
              businessName: true,
              logoUrl: true,
              ratingAvg: true,
              ratingCount: true,
              isCampusPartner: true,
              partnerCampus: { select: { name: true } },
            },
          },
          criteria: { orderBy: { position: "asc" } },
          images: true,
          dispute: true,
          failureReports: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
      submissions: {
        orderBy: { number: "asc" },
        include: {
          review: true,
        },
      },
      ledgerEntries: true,
    },
  });

  if (!assignment) {
    return null;
  }

  return assignment;
}


/**
 * PRD §11.1: Dashboard ringkas Mahasiswa
 * - Pekerjaan aktif + deadline terdekat
 * - Saldo dapat ditarik (PAYABLE)
 * - Level & progres poin
 * - Rekomendasi 3 pekerjaan
 */
export async function getStudentDashboardSummary(studentId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      campus: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!student) {
    return null;
  }

  // Next level calculation
  let nextLevelName: string | null = null;
  let targetPoints: number | null = null;
  let prevLevelPoints = 0;

  if (student.level === "NEWCOMER") {
    nextLevelName = "RELIABLE";
    targetPoints = 50;
    prevLevelPoints = 0;
  } else if (student.level === "RELIABLE") {
    nextLevelName = "TRUSTED";
    targetPoints = 150;
    prevLevelPoints = 50;
  } else if (student.level === "TRUSTED") {
    nextLevelName = "EXPERT";
    targetPoints = 300;
    prevLevelPoints = 150;
  } else {
    nextLevelName = null;
    targetPoints = null;
  }

  const progressPct = targetPoints
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round(((student.points - prevLevelPoints) / (targetPoints - prevLevelPoints)) * 100)
        )
      )
    : 100;

  const pointsRemaining = targetPoints ? Math.max(0, targetPoints - student.points) : 0;

  // Active assignments
  const activeAssignmentsData = await prisma.jobAssignment.findMany({
    where: {
      studentId: student.id,
      status: "ACTIVE",
      job: {
        status: {
          in: ["CLAIMED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED"],
        },
      },
    },
    include: {
      job: {
        include: {
          umkm: {
            select: {
              businessName: true,
            },
          },
        },
      },
    },
    orderBy: {
      job: {
        deadlineAt: "asc",
      },
    },
  });

  const activeAssignments = activeAssignmentsData.map((a) => ({
    id: a.id,
    jobId: a.job.id,
    title: a.job.title,
    role: a.job.role,
    isPaid: a.job.isPaid,
    studentShareIdr: a.job.studentShareIdr,
    status: a.job.status,
    deadlineAt: a.job.deadlineAt,
    businessName: a.job.umkm.businessName,
  }));

  const nearestDeadlineAssignment = activeAssignments[0] || null;

  // Payable balance
  const payableAggregate = await prisma.ledgerEntry.aggregate({
    where: {
      studentId: student.id,
      status: "PAYABLE",
    },
    _sum: {
      amountIdr: true,
    },
  });

  const payableBalanceIdr = payableAggregate._sum.amountIdr || 0;

  // Recommended 3 jobs
  const recommendedJobsData = await prisma.job.findMany({
    where: {
      status: "OPEN",
      isHidden: false,
      role: {
        in: student.roles,
      },
      deadlineAt: {
        gt: new Date(),
      },
    },
    include: {
      umkm: {
        select: {
          businessName: true,
          logoUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 3,
  });

  const recommendedJobs = recommendedJobsData.map((j) => ({
    id: j.id,
    title: j.title,
    role: j.role,
    isPaid: j.isPaid,
    studentShareIdr: j.studentShareIdr,
    deadlineAt: j.deadlineAt,
    beginnerFriendly: j.beginnerFriendly,
    businessName: j.umkm.businessName,
    logoUrl: j.umkm.logoUrl,
  }));

  return {
    student: {
      id: student.id,
      username: student.username,
      name: student.user.name,
      avatarUrl: student.avatarUrl || student.user.image,
      studyProgram: student.studyProgram,
      campusName: student.campus.name,
      level: student.level,
      points: student.points,
      completedJobs: student.completedJobs,
      ratingAvg: student.ratingAvg,
      roles: student.roles,
      nextLevel: {
        name: nextLevelName,
        targetPoints,
        progressPct,
        pointsRemaining,
      },
    },
    activeAssignments,
    nearestDeadlineAssignment,
    payableBalanceIdr,
    recommendedJobs,
  };
}

export type StudentDashboardSummary = NonNullable<Awaited<ReturnType<typeof getStudentDashboardSummary>>>;


/**
 * PRD §11.1: Dashboard ringkas UMKM
 * - Kuota tersisa (berbayar & gratis)
 * - Pekerjaan per status
 * - Review yang menunggu (dengan sisa waktu SLA)
 * - Informasi langganan berakhir
 */
export async function getUmkmDashboardSummary(umkmId: string) {
  const [overview, jobCounts, pendingReviewJobs] = await Promise.all([
    getUmkmSubscriptionOverview(umkmId),
    prisma.job.groupBy({
      by: ["status"],
      where: { umkmId },
      _count: { status: true },
    }),
    prisma.job.findMany({
      where: {
        umkmId,
        status: "SUBMITTED",
      },
      include: {
        assignments: {
          where: { status: "ACTIVE" },
          include: {
            student: {
              include: {
                user: { select: { name: true, image: true } },
                campus: { select: { name: true } },
              },
            },
            submissions: {
              orderBy: { number: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { reviewDueAt: "asc" },
      take: 5,
    }),
  ]);

  const counts: Record<string, number> = {};
  jobCounts.forEach((c) => {
    counts[c.status] = c._count.status;
  });

  const remainingPaidQuota = overview.activePaidSub
    ? overview.activePaidSub.quotaTotal - overview.activePaidSub.quotaUsed
    : 0;

  const remainingFreeQuota = overview.activeFreeSub
    ? overview.activeFreeSub.quotaTotal - overview.activeFreeSub.quotaUsed
    : 3;

  return {
    overview,
    counts,
    remainingPaidQuota,
    remainingFreeQuota,
    pendingReviewJobs: pendingReviewJobs.map((j) => {
      const activeAssignment = j.assignments[0];
      return {
        id: j.id,
        title: j.title,
        role: j.role,
        isPaid: j.isPaid,
        reviewDueAt: j.reviewDueAt,
        studentName: activeAssignment?.student.user.name || "Mahasiswa Mitra",
        campusName: activeAssignment?.student.campus.name || "Kampus Mitra",
        submissionNumber: activeAssignment?.submissions[0]?.number || 1,
      };
    }),
  };
}

export type UmkmDashboardSummary = Awaited<ReturnType<typeof getUmkmDashboardSummary>>;
