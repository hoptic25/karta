import "server-only";

import { prisma } from "@/lib/db";
import { validateTransition } from "./state-machine";
import { isValidDeliverableUrl } from "@/lib/url";
import { getClaimCutoffTime } from "./deadline";
import type {
  JobStatus,
  StudentLevel,
  ReviewDecision,
  Prisma,
} from "@/generated/prisma/client";

export const DEFAULT_MAX_REVISIONS = 2;

export class ExecutionError extends Error {
  code: string;
  constructor(message: string, code = "EXECUTION_ERROR") {
    super(message);
    this.name = "ExecutionError";
    this.code = code;
  }
}

export interface SelfCheckCriterion {
  criterionId: string;
  checked: boolean;
}

export interface CriteriaEvaluation {
  criterionId: string;
  met: boolean;
  comment?: string;
}

/**
 * BR-E1: Mahasiswa menekan Mulai Kerjakan
 * Transisi CLAIMED -> IN_PROGRESS, mengisi startedAt.
 */
export async function startWork(jobId: string, studentUserId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId: studentUserId },
    select: { id: true },
  });

  if (!student) {
    throw new ExecutionError("Profil mahasiswa tidak ditemukan.", "STUDENT_NOT_FOUND");
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      umkm: {
        select: { userId: true },
      },
      assignments: {
        where: {
          studentId: student.id,
          status: "ACTIVE",
        },
      },
    },
  });

  if (!job) {
    throw new ExecutionError("Pekerjaan tidak ditemukan.", "JOB_NOT_FOUND");
  }

  const assignment = job.assignments[0];
  if (!assignment) {
    throw new ExecutionError(
      "Anda tidak memiliki penugasan aktif untuk pekerjaan ini.",
      "ASSIGNMENT_NOT_FOUND"
    );
  }

  // Verifikasi state transition CLAIMED -> IN_PROGRESS oleh STUDENT
  validateTransition(job.status, "IN_PROGRESS", "STUDENT");

  const now = new Date();

  const [updatedJob] = await prisma.$transaction([
    prisma.job.update({
      where: { id: jobId },
      data: { status: "IN_PROGRESS" },
    }),
    prisma.jobAssignment.update({
      where: { id: assignment.id },
      data: { startedAt: now },
    }),
    prisma.notification.create({
      data: {
        userId: job.umkm.userId,
        type: "JOB_STARTED",
        title: "Pekerjaan Mulai Dikerjakan",
        body: `Mahasiswa telah mulai mengerjakan tugas "${job.title}".`,
        href: `/umkm/jobs/${job.id}`,
      },
    }),
  ]);

  return { success: true, job: updatedJob, startedAt: now };
}

/**
 * BR-E6 & BR-E2: Mahasiswa mundur dari pekerjaan
 * - Jika status CLAIMED (sebelum mulai): mundur tanpa penalti, assignment WITHDRAWN, job kembali OPEN (jika masih dalam batas klaim) atau EXPIRED, ledger VOIDED.
 * - Jika status IN_PROGRESS: assignment WITHDRAWN, ledger VOIDED.
 */
export async function withdrawJob(
  jobId: string,
  studentUserId: string,
  reason?: string
) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId: studentUserId },
    select: { id: true, points: true },
  });

  if (!student) {
    throw new ExecutionError("Profil mahasiswa tidak ditemukan.", "STUDENT_NOT_FOUND");
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      umkm: {
        select: { userId: true },
      },
      assignments: {
        where: {
          studentId: student.id,
          status: "ACTIVE",
        },
      },
    },
  });

  if (!job) {
    throw new ExecutionError("Pekerjaan tidak ditemukan.", "JOB_NOT_FOUND");
  }

  const assignment = job.assignments[0];
  if (!assignment) {
    throw new ExecutionError(
      "Anda tidak memiliki penugasan aktif untuk pekerjaan ini.",
      "ASSIGNMENT_NOT_FOUND"
    );
  }

  const now = new Date();
  const isClaimedPhase = job.status === "CLAIMED";

  // Verifikasi state transition
  validateTransition(job.status, "OPEN", "STUDENT");

  // Tentukan apakah job masih dapat dibuka kembali berdasarkan batas klaim
  let nextJobStatus: JobStatus = "OPEN";
  const cutoff = getClaimCutoffTime(job.deadlineAt, job.role, job.packageTier || "BASIC");
  if (now > cutoff) {
    nextJobStatus = "EXPIRED";
  }

  await prisma.$transaction(async (tx) => {
    // 1. Update assignment
    await tx.jobAssignment.update({
      where: { id: assignment.id },
      data: {
        status: "WITHDRAWN",
        endedAt: now,
        endReason: reason || (isClaimedPhase ? "Mahasiswa mundur sebelum mulai" : "Mahasiswa mundur saat pengerjaan"),
      },
    });

    // 2. Void ledger entries
    await tx.ledgerEntry.updateMany({
      where: {
        assignmentId: assignment.id,
        status: { in: ["RESERVED", "HELD"] },
      },
      data: {
        status: "VOIDED",
      },
    });

    // 3. Update job status
    await tx.job.update({
      where: { id: jobId },
      data: { status: nextJobStatus },
    });

    // 4. Notifikasi ke UMKM
    await tx.notification.create({
      data: {
        userId: job.umkm.userId,
        type: "STUDENT_WITHDRAWN",
        title: "Mahasiswa Mundur dari Pekerjaan",
        body: `Mahasiswa mengundurkan diri dari tugas "${job.title}". Status pekerjaan saat ini: ${nextJobStatus}.`,
        href: `/umkm/jobs/${job.id}`,
      },
    });
  });

  return { success: true, nextJobStatus };
}

/**
 * BR-E2: Submit hasil kerja mahasiswa
 * Menghasilkan record Submission baru dengan URL yang divalidasi, self-check checklist,
 * dan kalkulasi review SLA (+3 hari).
 */
export async function submitWork(
  jobId: string,
  studentUserId: string,
  input: {
    url: string;
    note?: string;
    selfCheck: SelfCheckCriterion[];
  }
) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId: studentUserId },
    select: { id: true },
  });

  if (!student) {
    throw new ExecutionError("Profil mahasiswa tidak ditemukan.", "STUDENT_NOT_FOUND");
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      umkm: {
        select: { userId: true },
      },
      criteria: true,
      assignments: {
        where: {
          studentId: student.id,
          status: "ACTIVE",
        },
        include: {
          submissions: true,
        },
      },
    },
  });

  if (!job) {
    throw new ExecutionError("Pekerjaan tidak ditemukan.", "JOB_NOT_FOUND");
  }

  const assignment = job.assignments[0];
  if (!assignment) {
    throw new ExecutionError(
      "Anda tidak memiliki penugasan aktif untuk pekerjaan ini.",
      "ASSIGNMENT_NOT_FOUND"
    );
  }

  // Hanya boleh submit saat status IN_PROGRESS atau REVISION_REQUESTED
  if (job.status !== "IN_PROGRESS" && job.status !== "REVISION_REQUESTED") {
    throw new ExecutionError(
      `Pekerjaan tidak dalam status pengerjaan (status saat ini: ${job.status}).`,
      "INVALID_STATUS"
    );
  }

  // Verifikasi state transition
  validateTransition(job.status, "SUBMITTED", "STUDENT");

  // Validasi URL deliverable (BR-J7)
  const trimmedUrl = input.url.trim();
  const urlValidation = isValidDeliverableUrl(trimmedUrl);
  if (!urlValidation.valid) {
    throw new ExecutionError(
      urlValidation.error || "Tautan pengumpulan tidak valid.",
      "INVALID_DELIVERABLE_URL"
    );
  }

  // Validasi self-check checklist kriteria (seluruh kriteria pekerjaan harus dicentang)
  const checkedCriterionIds = new Set(
    input.selfCheck.filter((item) => item.checked).map((item) => item.criterionId)
  );

  const missingCriteria = job.criteria.filter((c) => !checkedCriterionIds.has(c.id));
  if (missingCriteria.length > 0) {
    throw new ExecutionError(
      `Anda harus memastikan seluruh kriteria penerimaan telah terpenuhi (${missingCriteria.length} belum dicentang).`,
      "CRITERIA_NOT_CHECKED"
    );
  }

  const now = new Date();
  const isLate = now.getTime() > new Date(job.deadlineAt).getTime();
  const submissionNumber = assignment.submissions.length + 1;

  // SLA review UMKM: 3 hari dari waktu submit (PRD §6.5 BR-E2)
  const reviewDueAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const submission = await prisma.$transaction(async (tx) => {
    // 1. Buat submission baru
    const createdSubmission = await tx.submission.create({
      data: {
        assignmentId: assignment.id,
        jobId: job.id,
        number: submissionNumber,
        url: trimmedUrl,
        note: input.note?.trim() || null,
        selfCheck: input.selfCheck as unknown as Prisma.InputJsonValue,
        isLate,
        submittedAt: now,
      },
    });

    // 2. Ubah status job menjadi SUBMITTED dan set reviewDueAt
    await tx.job.update({
      where: { id: jobId },
      data: {
        status: "SUBMITTED",
        reviewDueAt,
      },
    });

    // 3. Notifikasi UMKM
    await tx.notification.create({
      data: {
        userId: job.umkm.userId,
        type: "JOB_SUBMITTED",
        title: `Hasil Kerja Dikumpulkan (Pengumpulan #${submissionNumber})`,
        body: `Mahasiswa telah mengumpulkan hasil kerja untuk "${job.title}". Harap tinjau sebelum SLA 3 hari berakhir.`,
        href: `/umkm/jobs/${job.id}`,
      },
    });

    return createdSubmission;
  });

  return {
    success: true,
    submission,
    submissionNumber,
    isLate,
    reviewDueAt,
  };
}

/**
 * BR-E3 & BR-E4: UMKM Meninjau Pengumpulan (Accept, Request Revision, Reject)
 */
export async function reviewSubmission(
  jobId: string,
  umkmUserId: string,
  input: {
    decision: ReviewDecision;
    reason?: string;
    criteriaResults: CriteriaEvaluation[];
  }
) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      umkm: {
        select: { id: true, userId: true },
      },
      assignments: {
        where: { status: "ACTIVE" },
        include: {
          student: true,
          submissions: {
            orderBy: { number: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!job) {
    throw new ExecutionError("Pekerjaan tidak ditemukan.", "JOB_NOT_FOUND");
  }

  if (job.umkm.userId !== umkmUserId) {
    throw new ExecutionError(
      "Anda tidak memiliki hak akses untuk meninjau pekerjaan ini.",
      "UNAUTHORIZED"
    );
  }

  if (job.status !== "SUBMITTED") {
    throw new ExecutionError(
      `Pekerjaan tidak dalam status menunggu review (status saat ini: ${job.status}).`,
      "INVALID_STATUS"
    );
  }

  const activeAssignment = job.assignments[0];
  if (!activeAssignment) {
    throw new ExecutionError(
      "Penugasan aktif untuk pekerjaan ini tidak ditemukan.",
      "ASSIGNMENT_NOT_FOUND"
    );
  }

  const latestSubmission = activeAssignment.submissions[0];
  if (!latestSubmission) {
    throw new ExecutionError(
      "Tidak ada data pengumpulan hasil kerja yang dapat ditinjau.",
      "SUBMISSION_NOT_FOUND"
    );
  }

  const student = activeAssignment.student;
  const now = new Date();

  // 1. KEPUTUSAN: ACCEPT (Diterima)
  if (input.decision === "ACCEPT") {
    validateTransition("SUBMITTED", "ACCEPTED", "UMKM");

    // Hitung poin reputasi per PRD §6.7:
    // +10 poin base accepted
    // +3 poin jika tanpa revisi (revisionCount === 0)
    // +2 poin jika submit pertama tepat waktu (!latestSubmission.isLate && latestSubmission.number === 1)
    let pointsEarned = 10;
    if (job.revisionCount === 0) {
      pointsEarned += 3;
    }
    if (!latestSubmission.isLate && latestSubmission.number === 1) {
      pointsEarned += 2;
    }

    const newPoints = student.points + pointsEarned;
    const newCompletedJobs = student.completedJobs + 1;

    // Evaluasi kenaikan level mahasiswa (PRD §6.7)
    let newLevel: StudentLevel = student.level;
    if (newPoints >= 300) {
      newLevel = "EXPERT";
    } else if (newPoints >= 150) {
      newLevel = "TRUSTED";
    } else if (newPoints >= 50) {
      newLevel = "RELIABLE";
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update Job status ACCEPTED
      await tx.job.update({
        where: { id: jobId },
        data: { status: "ACCEPTED" },
      });

      // 2. Selesaikan assignment
      await tx.jobAssignment.update({
        where: { id: activeAssignment.id },
        data: {
          status: "COMPLETED",
          endedAt: now,
        },
      });

      // 3. Buat Review
      await tx.review.create({
        data: {
          submissionId: latestSubmission.id,
          reviewerUserId: umkmUserId,
          decision: "ACCEPT",
          reason: input.reason?.trim() || null,
          criteriaResults: input.criteriaResults as unknown as Prisma.InputJsonValue,
        },
      });

      // 4. Update Ledger: STUDENT_SHARE menjadi PAYABLE, PLATFORM_FEE menjadi RECOGNIZED
      await tx.ledgerEntry.updateMany({
        where: {
          assignmentId: activeAssignment.id,
          type: "STUDENT_SHARE",
          status: "RESERVED",
        },
        data: {
          status: "PAYABLE",
        },
      });

      await tx.ledgerEntry.updateMany({
        where: {
          assignmentId: activeAssignment.id,
          type: "PLATFORM_FEE",
          status: "RESERVED",
        },
        data: {
          status: "RECOGNIZED",
        },
      });

      // 5. Update profil mahasiswa (poin, level, completedJobs)
      await tx.studentProfile.update({
        where: { id: student.id },
        data: {
          points: newPoints,
          completedJobs: newCompletedJobs,
          level: newLevel,
        },
      });

      // 6. Notifikasi mahasiswa
      await tx.notification.create({
        data: {
          userId: student.userId,
          type: "JOB_ACCEPTED",
          title: "Hasil Kerja Disetujui!",
          body: `Selamat! Hasil kerja Anda untuk "${job.title}" telah diterima. Anda mendapatkan +${pointsEarned} poin reputasi.`,
          href: `/student/my-jobs/${job.id}`,
        },
      });
    });

    return {
      success: true,
      decision: "ACCEPT",
      pointsEarned,
      newLevel,
    };
  }

  // 2. KEPUTUSAN: REQUEST_REVISION (Minta Revisi)
  if (input.decision === "REQUEST_REVISION") {
    // BR-E3 & BR-E4: Maksimal 2 revisi
    if (job.revisionCount >= DEFAULT_MAX_REVISIONS) {
      throw new ExecutionError(
        `Batas maksimum revisi (${DEFAULT_MAX_REVISIONS} kali) telah tercapai. Anda hanya dapat menerima atau menolak hasil kerja ini.`,
        "MAX_REVISIONS_REACHED"
      );
    }

    validateTransition("SUBMITTED", "REVISION_REQUESTED", "UMKM");

    // SLA mahasiswa mengumpulkan revisi: 3 hari (PRD §15.3 revisionWindowDays: 3)
    const revisionDueAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      // 1. Update job status dan increment revisionCount
      await tx.job.update({
        where: { id: jobId },
        data: {
          status: "REVISION_REQUESTED",
          revisionCount: { increment: 1 },
          revisionDueAt,
        },
      });

      // 2. Buat Review
      await tx.review.create({
        data: {
          submissionId: latestSubmission.id,
          reviewerUserId: umkmUserId,
          decision: "REQUEST_REVISION",
          reason: input.reason?.trim() || "Perlu revisi sesuai catatan kriteria.",
          criteriaResults: input.criteriaResults as unknown as Prisma.InputJsonValue,
        },
      });

      // 3. Notifikasi mahasiswa
      await tx.notification.create({
        data: {
          userId: student.userId,
          type: "REVISION_REQUESTED",
          title: `Permintaan Revisi #${job.revisionCount + 1}`,
          body: `UMKM meminta revisi untuk tugas "${job.title}". Harap kumpulkan perbaikan sebelum tenggat revisi.`,
          href: `/student/my-jobs/${job.id}`,
        },
      });
    });

    return {
      success: true,
      decision: "REQUEST_REVISION",
      revisionCount: job.revisionCount + 1,
      revisionDueAt,
    };
  }

  // 3. KEPUTUSAN: REJECT (Penolakan)
  if (input.decision === "REJECT") {
    validateTransition("SUBMITTED", "REJECTED", "UMKM");

    // BR-E3: Alasan wajib minimal 20 karakter
    const reason = input.reason?.trim() || "";
    if (reason.length < 20) {
      throw new ExecutionError(
        "Alasan penolakan wajib diisi dengan jelas minimal 20 karakter.",
        "REASON_TOO_SHORT"
      );
    }

    // Jendela sanggahan mahasiswa: 3 hari (PRD §6.5 BR-E3 disputeUntil)
    const disputeUntil = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      // 1. Update job status REJECTED dan set disputeUntil
      await tx.job.update({
        where: { id: jobId },
        data: {
          status: "REJECTED",
          disputeUntil,
        },
      });

      // 2. Buat Review
      await tx.review.create({
        data: {
          submissionId: latestSubmission.id,
          reviewerUserId: umkmUserId,
          decision: "REJECT",
          reason,
          criteriaResults: input.criteriaResults as unknown as Prisma.InputJsonValue,
        },
      });

      // 3. Tahan saldo mahasiswa (status HELD) selama jendela sengketa
      await tx.ledgerEntry.updateMany({
        where: {
          assignmentId: activeAssignment.id,
          type: "STUDENT_SHARE",
          status: "RESERVED",
        },
        data: {
          status: "HELD",
        },
      });

      // 4. Notifikasi mahasiswa beserta informasi jendela sengketa 3 hari
      await tx.notification.create({
        data: {
          userId: student.userId,
          type: "JOB_REJECTED",
          title: "Hasil Kerja Ditolak oleh UMKM",
          body: `Pengerjaan tugas "${job.title}" ditolak. Anda memiliki waktu 3 hari untuk mengajukan sengketa jika hasil kerja dirasa telah memenuhi syarat.`,
          href: `/student/my-jobs/${job.id}`,
        },
      });
    });

    return {
      success: true,
      decision: "REJECT",
      disputeUntil,
    };
  }

  throw new ExecutionError("Keputusan review tidak dikenali.", "UNKNOWN_DECISION");
}
