import "server-only";

import { prisma } from "@/lib/db";
import { validateTransition } from "./state-machine";
import { isValidDeliverableUrl } from "@/lib/url";
import type { DisputeResolution, StudentLevel } from "@/generated/prisma/client";

export class DisputeError extends Error {
  code: string;
  constructor(message: string, code = "DISPUTE_ERROR") {
    super(message);
    this.name = "DisputeError";
    this.code = code;
  }
}

/**
 * BR-D1: Mahasiswa membuka sengketa pada pekerjaan REJECTED sebelum disputeUntil
 */
export async function openDispute(
  jobId: string,
  studentUserId: string,
  input: {
    reason: string;
    evidenceUrl?: string;
  }
) {
  const reason = input.reason.trim();
  if (reason.length < 30) {
    throw new DisputeError(
      "Alasan pengajuan sengketa wajib diisi minimal 30 karakter.",
      "REASON_TOO_SHORT"
    );
  }

  if (input.evidenceUrl) {
    const trimmedUrl = input.evidenceUrl.trim();
    const urlValidation = isValidDeliverableUrl(trimmedUrl);
    if (!urlValidation.valid) {
      throw new DisputeError(
        "Tautan bukti sengketa harus berupa URL Google Drive, Figma, GitHub, YouTube, Loom, Canva, atau Notion yang valid.",
        "INVALID_EVIDENCE_URL"
      );
    }
  }

  const student = await prisma.studentProfile.findUnique({
    where: { userId: studentUserId },
  });

  if (!student) {
    throw new DisputeError("Profil mahasiswa tidak ditemukan.", "STUDENT_NOT_FOUND");
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      umkm: { select: { id: true, userId: true, businessName: true } },
      assignments: {
        where: { studentId: student.id },
        orderBy: { claimedAt: "desc" },
        take: 1,
      },
      dispute: true,
    },
  });

  if (!job) {
    throw new DisputeError("Pekerjaan tidak ditemukan.", "JOB_NOT_FOUND");
  }

  if (job.assignments.length === 0) {
    throw new DisputeError(
      "Anda tidak memiliki hak untuk mengajukan sengketa pada pekerjaan ini.",
      "UNAUTHORIZED"
    );
  }

  if (job.status !== "REJECTED") {
    throw new DisputeError(
      "Sengketa hanya dapat diajukan pada pekerjaan yang berstatus REJECTED.",
      "JOB_NOT_REJECTED"
    );
  }

  if (job.dispute) {
    throw new DisputeError(
      "Sengketa untuk pekerjaan ini sudah pernah diajukan.",
      "DISPUTE_ALREADY_EXISTS"
    );
  }

  const now = new Date();
  if (job.disputeUntil && now > job.disputeUntil) {
    throw new DisputeError(
      "Batas waktu pengajuan sengketa (3 hari pasca-penolakan) telah berakhir.",
      "DISPUTE_WINDOW_EXPIRED"
    );
  }

  // Validasi transisi state machine: REJECTED -> DISPUTED (aktor: STUDENT)
  validateTransition("REJECTED", "DISPUTED", "STUDENT");

  return await prisma.$transaction(async (tx) => {
    // 1. Perbarui status job menjadi DISPUTED
    const updatedJob = await tx.job.update({
      where: { id: jobId },
      data: { status: "DISPUTED" },
    });

    // 2. Buat record Dispute
    const dispute = await tx.dispute.create({
      data: {
        jobId,
        raisedByUserId: studentUserId,
        reason,
        evidenceUrl: input.evidenceUrl?.trim() || null,
        status: "OPEN",
      },
    });

    // 3. Notifikasi ke UMKM
    await tx.notification.create({
      data: {
        userId: job.umkm.userId,
        type: "DISPUTE_OPENED",
        title: "Sanggahan / Sengketa Diajukan",
        body: `Mahasiswa mengajukan sanggahan sengketa atas penolakan tugas "${job.title}". Tim admin KARTA akan meninjau dan memberikan keputusan objektif.`,
        href: `/umkm/jobs/${job.id}`,
      },
    });

    return { job: updatedJob, dispute };
  });
}

/**
 * BR-D2: Keputusan Admin terhadap sengketa (ACCEPT_WORK atau UPHOLD_REJECTION) 🧾
 */
export async function resolveDisputeByAdmin(
  adminUserId: string,
  disputeId: string,
  decision: DisputeResolution,
  adminNote?: string
) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      job: {
        include: {
          umkm: { select: { id: true, userId: true, businessName: true } },
          assignments: {
            where: { status: { in: ["ACTIVE", "COMPLETED"] } },
            include: {
              student: true,
              submissions: {
                orderBy: { number: "desc" },
                take: 1,
              },
            },
            orderBy: { claimedAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!dispute) {
    throw new DisputeError("Data sengketa tidak ditemukan.", "DISPUTE_NOT_FOUND");
  }

  if (dispute.status !== "OPEN") {
    throw new DisputeError("Sengketa ini sudah diputuskan sebelumnya.", "ALREADY_RESOLVED");
  }

  const job = dispute.job;
  const assignment = job.assignments[0];
  if (!assignment) {
    throw new DisputeError("Penugasan mahasiswa tidak ditemukan.", "ASSIGNMENT_NOT_FOUND");
  }

  const student = assignment.student;
  const now = new Date();

  if (decision === "ACCEPT_WORK") {
    // Validasi state machine: DISPUTED -> ACCEPTED (aktor: ADMIN)
    validateTransition("DISPUTED", "ACCEPTED", "ADMIN");

    // Hitung poin reputasi normal accept:
    // Base: +10, No revision bonus: +3, On-time submit bonus: +2
    const latestSubmission = assignment.submissions?.[0] ?? (job as unknown as { submissions?: { isLate?: boolean }[] }).submissions?.[0];
    const isNoRevision = job.revisionCount === 0;
    const isOnTime = latestSubmission ? !latestSubmission.isLate : true;

    let pointsDelta = 10;
    if (isNoRevision) pointsDelta += 3;
    if (isOnTime) pointsDelta += 2;

    const newPoints = student.points + pointsDelta;
    let newLevel: StudentLevel = student.level;
    if (newPoints >= 300) newLevel = "EXPERT";
    else if (newPoints >= 150) newLevel = "TRUSTED";
    else if (newPoints >= 50) newLevel = "RELIABLE";

    return await prisma.$transaction(async (tx) => {
      // 1. Update job to ACCEPTED
      await tx.job.update({
        where: { id: job.id },
        data: { status: "ACCEPTED" },
      });

      // 2. Update assignment to COMPLETED
      await tx.jobAssignment.update({
        where: { id: assignment.id },
        data: {
          status: "COMPLETED",
          endedAt: now,
        },
      });

      // 3. Mutasi ledger saldo mahasiswa HELD -> PAYABLE, PLATFORM_FEE -> RECOGNIZED
      await tx.ledgerEntry.updateMany({
        where: {
          jobId: job.id,
          type: "STUDENT_SHARE",
          status: "HELD",
        },
        data: { status: "PAYABLE" },
      });

      await tx.ledgerEntry.updateMany({
        where: {
          jobId: job.id,
          type: "PLATFORM_FEE",
        },
        data: { status: "RECOGNIZED" },
      });

      // 4. Catat reputasi mahasiswa
      await tx.studentProfile.update({
        where: { id: student.id },
        data: {
          points: newPoints,
          level: newLevel,
          completedJobs: { increment: 1 },
        },
      });

      await tx.pointEvent.create({
        data: {
          studentId: student.id,
          jobId: job.id,
          delta: pointsDelta,
          reason: `Penyelesaian tugas via resolusi sengketa admin (+10${isNoRevision ? " +3 no-rev" : ""}${isOnTime ? " +2 tepat waktu" : ""})`,
        },
      });

      // 5. Update dispute status
      const resolvedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: "RESOLVED",
          resolution: "ACCEPT_WORK",
          adminNote: adminNote?.trim() || null,
          resolvedBy: adminUserId,
          resolvedAt: now,
        },
      });

      // 6. Catat audit log 🧾
      await tx.auditLog.create({
        data: {
          actorId: adminUserId,
          action: "DISPUTE_RESOLVED",
          entity: "Dispute",
          entityId: disputeId,
          meta: {
            decision: "ACCEPT_WORK",
            jobId: job.id,
            studentId: student.id,
            adminNote,
          },
        },
      });

      // 7. Notifikasi ke mahasiswa & UMKM
      await tx.notification.create({
        data: {
          userId: student.userId,
          type: "DISPUTE_RESOLVED",
          title: "Sengketa Dimenangkan (Karya Diterima)",
          body: `Admin telah memutuskan menerima hasil kerja tugas "${job.title}". Honor telah dialokasikan ke saldo dompet Anda (+${pointsDelta} poin reputasi).`,
          href: `/student/my-jobs/${job.id}`,
        },
      });

      await tx.notification.create({
        data: {
          userId: job.umkm.userId,
          type: "DISPUTE_RESOLVED",
          title: "Sengketa Telah Diputuskan Admin",
          body: `Admin memutuskan menerima hasil kerja tugas "${job.title}" setelah peninjauan objektif kriteria dan bukti karya.`,
          href: `/umkm/jobs/${job.id}`,
        },
      });

      return { success: true, resolution: "ACCEPT_WORK", dispute: resolvedDispute };
    });
  }

  if (decision === "UPHOLD_REJECTION") {
    // Validasi state machine: DISPUTED -> REJECTED (aktor: ADMIN)
    validateTransition("DISPUTED", "REJECTED", "ADMIN");

    return await prisma.$transaction(async (tx) => {
      // 1. Update job to final REJECTED
      await tx.job.update({
        where: { id: job.id },
        data: {
          status: "REJECTED",
          rejectionFinalAt: now,
        },
      });

      // 2. Void ledger entry (saldo dibatalkan)
      await tx.ledgerEntry.updateMany({
        where: {
          jobId: job.id,
          status: "HELD",
        },
        data: { status: "VOIDED" },
      });

      // 3. Update dispute record
      const resolvedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: "RESOLVED",
          resolution: "UPHOLD_REJECTION",
          adminNote: adminNote?.trim() || null,
          resolvedBy: adminUserId,
          resolvedAt: now,
        },
      });

      // 4. Catat audit log 🧾
      await tx.auditLog.create({
        data: {
          actorId: adminUserId,
          action: "DISPUTE_RESOLVED",
          entity: "Dispute",
          entityId: disputeId,
          meta: {
            decision: "UPHOLD_REJECTION",
            jobId: job.id,
            studentId: student.id,
            adminNote,
          },
        },
      });

      // 5. Notifikasi ke mahasiswa & UMKM
      await tx.notification.create({
        data: {
          userId: student.userId,
          type: "DISPUTE_RESOLVED",
          title: "Sengketa Ditolak (Penolakan Ditegakkan)",
          body: `Admin menegakkan penolakan UMKM untuk tugas "${job.title}". Alasan: "${adminNote || "Karya tidak memenuhi kriteria minimum"}".`,
          href: `/student/my-jobs/${job.id}`,
        },
      });

      await tx.notification.create({
        data: {
          userId: job.umkm.userId,
          type: "DISPUTE_RESOLVED",
          title: "Sengketa Selesai (Penolakan Ditegakkan)",
          body: `Admin telah meninjau sengketa tugas "${job.title}" dan menegakkan keputusan penolakan.`,
          href: `/umkm/jobs/${job.id}`,
        },
      });

      return { success: true, resolution: "UPHOLD_REJECTION", dispute: resolvedDispute };
    });
  }

  throw new DisputeError("Resolusi sengketa tidak valid.", "INVALID_RESOLUTION");
}

/**
 * Mengambil daftar sengketa untuk admin
 */
export async function getAdminDisputes(statusFilter?: "OPEN" | "RESOLVED" | "ALL") {
  const where = statusFilter && statusFilter !== "ALL" ? { status: statusFilter } : {};

  return await prisma.dispute.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        include: {
          umkm: { select: { businessName: true, userId: true } },
          criteria: true,
          assignments: {
            include: {
              student: {
                include: {
                  user: { select: { name: true, email: true } },
                  campus: { select: { name: true } },
                },
              },
              submissions: {
                include: { review: true },
                orderBy: { number: "desc" },
              },
            },
            take: 1,
            orderBy: { claimedAt: "desc" },
          },
        },
      },
    },
  });
}

