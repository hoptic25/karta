import "server-only";

import { prisma } from "@/lib/db";
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

