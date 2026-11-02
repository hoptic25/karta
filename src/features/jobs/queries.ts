import "server-only";

import { prisma } from "@/lib/db";
import { evaluateJobTimeRules } from "@/features/platform";
import { getAvailableSubscriptionsForUmkm } from "@/features/subscription";
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
