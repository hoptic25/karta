import "server-only";

import { prisma } from "@/lib/db";
import { getMinimumDeadlineHours } from "./deadline";
import type { FailureReportStatus, StudentLevel } from "@/generated/prisma/client";

export class FailureError extends Error {
  code: string;
  constructor(message: string, code = "FAILURE_ERROR") {
    super(message);
    this.name = "FailureError";
    this.code = code;
  }
}

/**
 * BR-F1: UMKM membuat laporan kegagalan (FailureReport)
 * Berlaku jika job IN_PROGRESS atau REVISION_REQUESTED dan (now > deadlineAt + 12 jam) atau tidak ada progres
 */
export async function reportFailureByUmkm(
  jobId: string,
  umkmUserId: string,
  input: {
    reason: string;
  }
) {
  const reason = input.reason.trim();
  if (reason.length < 30) {
    throw new FailureError(
      "Alasan pelaporan kendala/kegagalan wajib diisi minimal 30 karakter.",
      "REASON_TOO_SHORT"
    );
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      umkm: { select: { id: true, userId: true, businessName: true } },
      assignments: {
        where: { status: "ACTIVE" },
        include: { student: true },
        take: 1,
      },
      failureReports: {
        where: { status: "OPEN" },
      },
    },
  });

  if (!job) {
    throw new FailureError("Pekerjaan tidak ditemukan.", "JOB_NOT_FOUND");
  }

  if (job.umkm.userId !== umkmUserId) {
    throw new FailureError(
      "Anda tidak memiliki izin untuk melaporkan pekerjaan ini.",
      "UNAUTHORIZED"
    );
  }

  if (job.status !== "IN_PROGRESS" && job.status !== "REVISION_REQUESTED") {
    throw new FailureError(
      "Laporan kegagalan hanya dapat dibuat ketika pekerjaan sedang berlangsung (IN_PROGRESS) atau dalam masa revisi (REVISION_REQUESTED).",
      "INVALID_JOB_STATUS"
    );
  }

  if (job.failureReports.length > 0) {
    throw new FailureError(
      "Laporan kendala untuk pekerjaan ini masih dalam antrean peninjauan admin.",
      "PENDING_REPORT_EXISTS"
    );
  }

  const activeAssignment = job.assignments[0];
  if (!activeAssignment) {
    throw new FailureError(
      "Tidak ada mahasiswa aktif yang ditugaskan pada pekerjaan ini.",
      "NO_ACTIVE_ASSIGNMENT"
    );
  }

  return await prisma.$transaction(async (tx) => {
    const report = await tx.failureReport.create({
      data: {
        jobId: job.id,
        assignmentId: activeAssignment.id,
        reportedByUserId: umkmUserId,
        reason,
        status: "OPEN",
      },
    });

    // Notifikasi mahasiswa
    await tx.notification.create({
      data: {
        userId: activeAssignment.student.userId,
        type: "FAILURE_REPORTED",
        title: "Laporan Kendala Pengerjaan dari UMKM",
        body: `UMKM melaporkan kendala pada pengerjaan tugas "${job.title}". Anda dapat memberikan tanggapan/klarifikasi sebelum admin memutuskan.`,
        href: `/student/my-jobs/${job.id}`,
      },
    });

    return report;
  });
}

/**
 * BR-F1: Mahasiswa membalas laporan kegagalan UMKM (studentResponse)
 */
export async function respondToFailureByStudent(
  failureReportId: string,
  studentUserId: string,
  input: {
    response: string;
  }
) {
  const response = input.response.trim();
  if (response.length < 10) {
    throw new FailureError(
      "Tanggapan klarifikasi wajib diisi minimal 10 karakter.",
      "RESPONSE_TOO_SHORT"
    );
  }

  const report = await prisma.failureReport.findUnique({
    where: { id: failureReportId },
    include: {
      assignment: {
        include: {
          student: true,
        },
      },
      job: {
        include: {
          umkm: { select: { userId: true } },
        },
      },
    },
  });

  if (!report) {
    throw new FailureError("Laporan kegagalan tidak ditemukan.", "REPORT_NOT_FOUND");
  }

  if (report.assignment.student.userId !== studentUserId) {
    throw new FailureError(
      "Anda tidak memiliki hak untuk menanggapi laporan ini.",
      "UNAUTHORIZED"
    );
  }

  if (report.status !== "OPEN") {
    throw new FailureError(
      "Laporan ini sudah diproses dan tidak menerima tanggapan baru.",
      "REPORT_NOT_OPEN"
    );
  }

  const updated = await prisma.failureReport.update({
    where: { id: failureReportId },
    data: { studentResponse: response },
  });

  // Notifikasi UMKM bahwa mahasiswa telah memberikan klarifikasi
  await prisma.notification.create({
    data: {
      userId: report.job.umkm.userId,
      type: "FAILURE_RESPONSE",
      title: "Tanggapan Mahasiswa atas Laporan Kendala",
      body: `Mahasiswa telah mengirimkan klarifikasi atas laporan kendala tugas "${report.job.title}".`,
      href: `/umkm/jobs/${report.jobId}`,
    },
  });

  return updated;
}

/**
 * BR-F2: Keputusan Admin terhadap laporan kegagalan (CONFIRMED atau DISMISSED) 🧾
 */
export async function resolveFailureByAdmin(
  adminUserId: string,
  failureReportId: string,
  decision: "CONFIRMED" | "DISMISSED",
  adminNote?: string
) {
  const report = await prisma.failureReport.findUnique({
    where: { id: failureReportId },
    include: {
      job: {
        include: {
          umkm: { select: { id: true, userId: true, businessName: true } },
        },
      },
      assignment: {
        include: {
          student: true,
        },
      },
    },
  });

  if (!report) {
    throw new FailureError("Laporan kegagalan tidak ditemukan.", "REPORT_NOT_FOUND");
  }

  if (report.status !== "OPEN") {
    throw new FailureError("Laporan ini sudah diputuskan sebelumnya.", "ALREADY_RESOLVED");
  }

  const job = report.job;
  const assignment = report.assignment;
  const student = assignment.student;
  const now = new Date();

  if (decision === "CONFIRMED") {
    // 1. Assignment FAILED
    // 2. Mahasiswa -15 poin (tidak pernah di bawah 0)
    const newPoints = Math.max(0, student.points - 15);
    let newLevel: StudentLevel = "NEWCOMER";
    if (newPoints >= 300) newLevel = "EXPERT";
    else if (newPoints >= 150) newLevel = "TRUSTED";
    else if (newPoints >= 50) newLevel = "RELIABLE";

    // 3. Ledger VOIDED
    // 4. Job kembali OPEN dengan deadlineAt = max(deadlineAt lama, now + minHours)
    const minHours = getMinimumDeadlineHours(job.role, job.packageTier || "BASIC");
    const minNewDeadline = new Date(now.getTime() + minHours * 60 * 60 * 1000);
    const updatedDeadline = job.deadlineAt > minNewDeadline ? job.deadlineAt : minNewDeadline;

    return await prisma.$transaction(async (tx) => {
      // Perbarui assignment ke FAILED
      await tx.jobAssignment.update({
        where: { id: assignment.id },
        data: {
          status: "FAILED",
          endedAt: now,
        },
      });

      // Kembalikan job ke OPEN agar dapat diklaim pelamar baru
      await tx.job.update({
        where: { id: job.id },
        data: {
          status: "OPEN",
          deadlineAt: updatedDeadline,
          revisionCount: 0,
          reviewDueAt: null,
          revisionDueAt: null,
        },
      });

      // Batalkan ledger entry (VOIDED)
      await tx.ledgerEntry.updateMany({
        where: {
          jobId: job.id,
          assignmentId: assignment.id,
          status: { in: ["RESERVED", "HELD"] },
        },
        data: { status: "VOIDED" },
      });

      // Kurangi reputasi mahasiswa (-15 poin)
      await tx.studentProfile.update({
        where: { id: student.id },
        data: {
          points: newPoints,
          level: newLevel,
        },
      });

      await tx.pointEvent.create({
        data: {
          studentId: student.id,
          jobId: job.id,
          delta: -15,
          reason: `Sanksi kegagalan pengerjaan tugas "${job.title}" yang dikonfirmasi admin`,
        },
      });

      // Update status laporan kegagalan
      const updatedReport = await tx.failureReport.update({
        where: { id: failureReportId },
        data: {
          status: "CONFIRMED",
          adminNote: adminNote?.trim() || null,
          resolvedBy: adminUserId,
          resolvedAt: now,
        },
      });

      // Catat audit log 🧾
      await tx.auditLog.create({
        data: {
          actorId: adminUserId,
          action: "FAILURE_CONFIRMED",
          entity: "FailureReport",
          entityId: failureReportId,
          meta: {
            jobId: job.id,
            studentId: student.id,
            adminNote,
          },
        },
      });

      // Notifikasi mahasiswa & UMKM
      await tx.notification.create({
        data: {
          userId: student.userId,
          type: "FAILURE_CONFIRMED",
          title: "Kegagalan Pengerjaan Dikonfirmasi (-15 Poin)",
          body: `Admin mengonfirmasi kendala pada tugas "${job.title}". Penugasan dihentikan dan poin reputasi Anda berkurang 15 poin.`,
          href: "/student/my-jobs",
        },
      });

      await tx.notification.create({
        data: {
          userId: job.umkm.userId,
          type: "FAILURE_CONFIRMED",
          title: "Laporan Kendala Dikonfirmasi Admin",
          body: `Laporan kendala tugas "${job.title}" telah dikonfirmasi. Tugas dibuka kembali untuk mahasiswa lain, atau Anda dapat membatalkannya untuk mengembalikan kuota.`,
          href: `/umkm/jobs/${job.id}`,
        },
      });

      return { success: true, resolution: "CONFIRMED", report: updatedReport };
    });
  }

  if (decision === "DISMISSED") {
    // Admin menolak laporan kegagalan -> job berlanjut
    return await prisma.$transaction(async (tx) => {
      const updatedReport = await tx.failureReport.update({
        where: { id: failureReportId },
        data: {
          status: "DISMISSED",
          adminNote: adminNote?.trim() || null,
          resolvedBy: adminUserId,
          resolvedAt: now,
        },
      });

      // Catat audit log 🧾
      await tx.auditLog.create({
        data: {
          actorId: adminUserId,
          action: "FAILURE_DISMISSED",
          entity: "FailureReport",
          entityId: failureReportId,
          meta: {
            jobId: job.id,
            studentId: student.id,
            adminNote,
          },
        },
      });

      // Notifikasi ke UMKM & mahasiswa
      await tx.notification.create({
        data: {
          userId: job.umkm.userId,
          type: "FAILURE_DISMISSED",
          title: "Laporan Kendala Ditolak Admin",
          body: `Admin menolak laporan kendala tugas "${job.title}". Alasan: "${adminNote || "Mahasiswa masih dalam batas toleransi pengerjaan"}". Tugas berlanjut seperti biasa.`,
          href: `/umkm/jobs/${job.id}`,
        },
      });

      await tx.notification.create({
        data: {
          userId: student.userId,
          type: "FAILURE_DISMISSED",
          title: "Laporan Kendala Telah Diselesaikan",
          body: `Admin telah meninjau laporan kendala tugas "${job.title}" dan memutuskan pengerjaan tugas tetap dilanjutkan.`,
          href: `/student/my-jobs/${job.id}`,
        },
      });

      return { success: true, resolution: "DISMISSED", report: updatedReport };
    });
  }

  throw new FailureError("Keputusan laporan kegagalan tidak valid.", "INVALID_DECISION");
}

/**
 * Mengambil daftar laporan kegagalan untuk admin
 */
export async function getAdminFailureReports(statusFilter?: FailureReportStatus | "ALL") {
  const where = statusFilter && statusFilter !== "ALL" ? { status: statusFilter } : {};

  return await prisma.failureReport.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        include: {
          umkm: { select: { businessName: true, userId: true } },
        },
      },
      assignment: {
        include: {
          student: {
            include: {
              user: { select: { name: true, email: true } },
              campus: { select: { name: true } },
            },
          },
        },
      },
    },
  });
}

