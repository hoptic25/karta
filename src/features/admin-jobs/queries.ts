import "server-only";
import { prisma } from "@/lib/db";
import type { Job, User, UmkmProfile, JobRole } from "@/generated/prisma/client";

export type JobWithRelations = Job & {
  jobRole: JobRole | null;
  umkm: UmkmProfile & {
    user: User;
  };
  _count: {
    assignments: number;
  };
};

export async function getAllJobs(): Promise<JobWithRelations[]> {
  const jobs = await prisma.job.findMany({
    include: {
      jobRole: true,
      umkm: {
        include: {
          user: true,
        },
      },
      _count: {
        select: {
          assignments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return jobs as JobWithRelations[];
}

export async function getAllUmkms() {
  const umkms = await prisma.umkmProfile.findMany({
    include: {
      user: true,
    },
    orderBy: { businessName: "asc" },
  });

  return umkms;
}

export async function getJobById(id: string): Promise<JobWithRelations | null> {
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      jobRole: true,
      umkm: {
        include: {
          user: true,
        },
      },
      _count: {
        select: {
          assignments: true,
        },
      },
    },
  });

  return job as JobWithRelations | null;
}
