import "server-only";

import { prisma } from "@/lib/db";
import { isJobClaimableByDeadline } from "./deadline";
import type {
  Job,
  StudentProfile,
  StudentLevel,
  User,
} from "@/generated/prisma/client";

export class ClaimError extends Error {
  code: string;
  constructor(message: string, code = "CLAIM_ERROR") {
    super(message);
    this.name = "ClaimError";
    this.code = code;
  }
}

export const LEVEL_HIERARCHY: Record<StudentLevel, number> = {
  NEWCOMER: 0,
  RELIABLE: 1,
  TRUSTED: 2,
  EXPERT: 3,
};

export const LEVEL_MAX_ACTIVE: Record<StudentLevel, number> = {
  NEWCOMER: 1,
  RELIABLE: 2,
  TRUSTED: 3,
  EXPERT: 4,
};

export interface ClaimEligibilityCheck {
  eligible: boolean;
  reason?: string;
}

/**
 * Validasi 8 aturan klaim pekerjaan (BR-C1, BR-C4, BR-C5, BR-J5).
 */
export function checkClaimEligibility(
  student: StudentProfile & { user?: Pick<User, "status"> },
  job: Pick<
    Job,
    | "id"
    | "role"
    | "status"
    | "isHidden"
    | "minLevel"
    | "isPaid"
    | "deadlineAt"
    | "packageTier"
    | "beginnerFriendly"
    | "newcomerLaneUntil"
  >,
  activeAssignmentsCount: number,
  activeUnpaidCount: number,
  now: Date = new Date()
): ClaimEligibilityCheck {
  // 1. Akun pengguna harus aktif
  if (student.user && student.user.status !== "ACTIVE") {
    return {
      eligible: false,
      reason: "Akun Anda sedang ditangguhkan dan tidak dapat mengambil pekerjaan.",
    };
  }

  // 2. Status pekerjaan harus OPEN dan tidak disembunyikan
  if (job.status !== "OPEN" || job.isHidden) {
    return {
      eligible: false,
      reason: "Pekerjaan tidak sedang membuka pelamar.",
    };
  }

  // 3. Batas waktu klaim (BR-J5)
  if (!isJobClaimableByDeadline(job, now)) {
    return {
      eligible: false,
      reason: "Pekerjaan telah melewati batas waktu pengambilan.",
    };
  }

  // 4. Role pekerjaan harus sesuai dengan keahlian mahasiswa (BR-C1)
  if (!student.roles.includes(job.role)) {
    return {
      eligible: false,
      reason: `Bidang pekerjaan ini (${job.role}) belum terdaftar pada profil keahlian Anda.`,
    };
  }

  // 5. Level pengalaman mahasiswa harus memenuhi syarat (BR-C1)
  if (LEVEL_HIERARCHY[student.level] < LEVEL_HIERARCHY[job.minLevel]) {
    return {
      eligible: false,
      reason: `Pekerjaan ini memerlukan level minimum ${job.minLevel} (Level Anda saat ini: ${student.level}).`,
    };
  }

  // 6. Batas pekerjaan aktif per level (BR-C4)
  const maxActive = LEVEL_MAX_ACTIVE[student.level] ?? 1;
  if (activeAssignmentsCount >= maxActive) {
    return {
      eligible: false,
      reason: `Batas pekerjaan aktif tercapai (${activeAssignmentsCount}/${maxActive}). Selesaikan pekerjaan Anda yang sedang berjalan terlebih dahulu.`,
    };
  }

  // 7. Maksimal 1 pekerjaan unpaid / volunteer aktif (BR-C1)
  if (!job.isPaid && activeUnpaidCount > 0) {
    return {
      eligible: false,
      reason: "Anda sudah memiliki 1 proyek relawan (unpaid) yang sedang aktif.",
    };
  }

  // 8. Newcomer Lane (BR-C5: 30 menit pertama hanya untuk Newcomer & Reliable)
  if (
    job.beginnerFriendly &&
    job.newcomerLaneUntil &&
    now.getTime() < job.newcomerLaneUntil.getTime()
  ) {
    const isNewcomerLaneEligible =
      student.level === "NEWCOMER" || student.level === "RELIABLE";
    if (!isNewcomerLaneEligible) {
      return {
        eligible: false,
        reason:
          "Tugas ini sedang dalam periode prioritas mahasiswa pemula (Newcomer Lane) selama 30 menit pertama.",
      };
    }
  }

  return { eligible: true };
}

/**
 * Mengklaim pekerjaan secara atomik oleh mahasiswa (BR-C1..BR-C4).
 * Menjamin konkurensi (hanya 1 mahasiswa yang berhasil mengklaim job OPEN).
 */
export async function claimJob(jobId: string, studentUserId: string) {
  // Ambil profil mahasiswa
  const student = await prisma.studentProfile.findUnique({
    where: { userId: studentUserId },
    include: {
      user: { select: { id: true, name: true, status: true } },
    },
  });

  if (!student) {
    throw new ClaimError("Profil mahasiswa tidak ditemukan.", "PROFILE_NOT_FOUND");
  }

  // Ambil data pekerjaan dan UMKM
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      umkm: { select: { userId: true, businessName: true } },
    },
  });

  if (!job) {
    throw new ClaimError("Pekerjaan tidak ditemukan.", "JOB_NOT_FOUND");
  }

  const umkmUserId = job.umkm?.userId;

  // Hitung jumlah pekerjaan aktif mahasiswa saat ini (BR-C4)
  // "Aktif" = assignment ACTIVE (status job CLAIMED / IN_PROGRESS / SUBMITTED / REVISION_REQUESTED)
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

  if (!eligibility.eligible) {
    throw new ClaimError(eligibility.reason || "Tidak memenuhi syarat klaim.", "NOT_ELIGIBLE");
  }

  // Eksekusi atomik menggunakan transaksi Prisma
  return await prisma.$transaction(async (tx) => {
    // 1. Klaim atomic: ubah status hanya jika masih OPEN (BR-C2)
    const updateResult = await tx.job.updateMany({
      where: {
        id: jobId,
        status: "OPEN",
      },
      data: {
        status: "CLAIMED",
      },
    });

    if (updateResult.count !== 1) {
      throw new ClaimError(
        "Pekerjaan ini sudah diambil oleh mahasiswa lain.",
        "ALREADY_CLAIMED"
      );
    }

    // 2. Buat assignment baru
    const assignment = await tx.jobAssignment.create({
      data: {
        jobId,
        studentId: student.id,
        status: "ACTIVE",
        claimedAt: now,
      },
    });

    // 3. Untuk job berbayar, buat entri LedgerEntry (BR-C2 & PRD §8.1)
    if (job.isPaid) {
      // Entri imbalan mahasiswa (STUDENT_SHARE)
      await tx.ledgerEntry.create({
        data: {
          jobId,
          assignmentId: assignment.id,
          type: "STUDENT_SHARE",
          status: "RESERVED",
          amountIdr: job.studentShareIdr,
          studentId: student.id,
        },
      });

      // Entri fee platform (PLATFORM_FEE)
      await tx.ledgerEntry.create({
        data: {
          jobId,
          assignmentId: assignment.id,
          type: "PLATFORM_FEE",
          status: "RESERVED",
          amountIdr: job.platformShareIdr,
          studentId: null,
        },
      });
    }

    // 4. Kirim notifikasi ke UMKM pemilik pekerjaan
    if (umkmUserId) {
      await tx.notification.create({
        data: {
          userId: umkmUserId,
          type: "JOB_CLAIMED",
          title: "Pekerjaan Telah Diambil!",
          body: `Mahasiswa ${student.user.name || "seorang mahasiswa"} telah mengambil pekerjaan "${job.title}".`,
          href: `/umkm/jobs/${job.id}`,
        },
      });
    }

    return { assignment, job };
  });
}
