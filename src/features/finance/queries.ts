import "server-only";

import { prisma } from "@/lib/db";
import type { WithdrawalStatus } from "@/generated/prisma/client";

/**
 * F-4: Mengambil data portofolio publik mahasiswa (/s/[username])
 * TIDAK memuat email, imbalan uang (IDR), atau rekening bank.
 */
export async function getPublicStudentPortfolio(username: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { username },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
      campus: {
        select: {
          name: true,
          city: true,
        },
      },
    },
  });

  if (!student) {
    return null;
  }

  // Jika mahasiswa mematikan opsi portofolio publik
  if (!student.portfolioPublic) {
    return {
      isHidden: true as const,
      student: {
        username: student.username,
        name: student.user.name,
        campus: student.campus,
        studyProgram: student.studyProgram,
      },
      completedJobs: [],
    };
  }

  // Ambil daftar pekerjaan yang telah selesai diterima (ACCEPTED)
  const assignments = await prisma.jobAssignment.findMany({
    where: {
      studentId: student.id,
      status: "COMPLETED",
      job: {
        status: "ACCEPTED",
      },
    },
    orderBy: { endedAt: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          role: true,
          isPaid: true,
          publishedAt: true,
          _count: {
            select: { criteria: true },
          },
          umkm: {
            select: {
              businessName: true,
              isCampusPartner: true,
              partnerCampus: { select: { name: true } },
            },
          },
          ratings: {
            where: {
              direction: "UMKM_TO_STUDENT",
            },
            select: {
              score: true,
              comment: true,
            },
          },
        },
      },
    },
  });

  const completedJobs = assignments.map((a) => ({
    assignmentId: a.id,
    endedAt: a.endedAt,
    job: {
      id: a.job.id,
      title: a.job.title,
      role: a.job.role,
      isPaid: a.job.isPaid,
      publishedAt: a.job.publishedAt,
      criteriaCount: a.job._count.criteria,
      umkm: a.job.umkm,
      rating: a.job.ratings[0] || null,
    },
  }));

  return {
    isHidden: false as const,
    student: {
      id: student.id,
      username: student.username,
      name: student.user.name,
      avatarUrl: student.avatarUrl || student.user.image,
      bio: student.bio,
      campus: student.campus,
      studyProgram: student.studyProgram,
      skills: student.skills,
      roles: student.roles,
      points: student.points,
      level: student.level,
      ratingAvg: student.ratingAvg,
      ratingCount: student.ratingCount,
      completedJobsCount: student.completedJobs,
      joinedAt: student.createdAt,
    },
    completedJobs,
  };
}

/**
 * Admin: Mengambil daftar seluruh pengajuan penarikan dana
 */
export async function getAdminWithdrawals(filterStatus?: WithdrawalStatus | "ALL") {
  const where = filterStatus && filterStatus !== "ALL" ? { status: filterStatus } : {};

  return await prisma.withdrawal.findMany({
    where,
    orderBy: { requestedAt: "desc" },
    include: {
      student: {
        include: {
          user: { select: { name: true, email: true } },
          campus: { select: { name: true } },
        },
      },
      _count: {
        select: { entries: true },
      },
    },
  });
}

