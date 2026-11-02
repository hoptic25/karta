import "server-only";

import { prisma } from "@/lib/db";
import type { StudentLevel, Prisma } from "@/generated/prisma/client";

export class RatingError extends Error {
  code: string;
  constructor(message: string, code = "RATING_ERROR") {
    super(message);
    this.name = "RatingError";
    this.code = code;
  }
}

export interface StudentRatingDimensions {
  clarity: number;
  communication: number;
  professionalism: number;
  reviewSpeed: number;
}

/**
 * PRD §6.7 & Rating: UMKM memberi rating 1-5 bintang kepada mahasiswa setelah tugas ACCEPTED
 */
export async function submitRatingFromUmkm(
  jobId: string,
  umkmUserId: string,
  input: {
    score: number;
    comment?: string;
  }
) {
  const score = Math.round(input.score);
  if (score < 1 || score > 5) {
    throw new RatingError("Nilai rating harus berkisar antara 1 hingga 5 bintang.", "INVALID_SCORE");
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      umkm: { select: { id: true, userId: true } },
      assignments: {
        where: { status: "COMPLETED" },
        include: {
          student: true,
        },
      },
    },
  });

  if (!job) {
    throw new RatingError("Pekerjaan tidak ditemukan.", "JOB_NOT_FOUND");
  }

  if (job.umkm.userId !== umkmUserId) {
    throw new RatingError("Anda tidak memiliki izin untuk menilai pekerjaan ini.", "UNAUTHORIZED");
  }

  if (job.status !== "ACCEPTED") {
    throw new RatingError(
      "Rating hanya dapat diberikan untuk pekerjaan yang telah selesai diterima (ACCEPTED).",
      "JOB_NOT_ACCEPTED"
    );
  }

  // Cek apakah rating UMKM -> STUDENT sudah pernah dibuat
  const existingRating = await prisma.rating.findUnique({
    where: {
      jobId_direction: {
        jobId,
        direction: "UMKM_TO_STUDENT",
      },
    },
  });

  if (existingRating) {
    throw new RatingError("Anda sudah memberikan rating untuk pekerjaan ini.", "ALREADY_RATED");
  }

  const assignment = job.assignments[0];
  if (!assignment) {
    throw new RatingError("Data penugasan mahasiswa tidak ditemukan.", "ASSIGNMENT_NOT_FOUND");
  }

  const student = assignment.student;

  // Hitung rata-rata rating baru mahasiswa
  const newRatingCount = student.ratingCount + 1;
  const newRatingAvg =
    ((student.ratingAvg * student.ratingCount) + score) / newRatingCount;

  // Bonus reputasi jika rating >= 4 (+2 poin per PRD §6.7)
  const isHighRating = score >= 4;
  const pointsDelta = isHighRating ? 2 : 0;
  const newPoints = student.points + pointsDelta;

  // Cek potensi kenaikan level mahasiswa
  let newLevel: StudentLevel = student.level;
  if (newPoints >= 300) {
    newLevel = "EXPERT";
  } else if (newPoints >= 150) {
    newLevel = "TRUSTED";
  } else if (newPoints >= 50) {
    newLevel = "RELIABLE";
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Simpan rating
    const createdRating = await tx.rating.create({
      data: {
        jobId,
        direction: "UMKM_TO_STUDENT",
        fromUserId: umkmUserId,
        toUserId: student.userId,
        score,
        comment: input.comment?.trim() || null,
      },
    });

    // 2. Catat point event jika ada bonus
    if (isHighRating) {
      await tx.pointEvent.create({
        data: {
          studentId: student.id,
          jobId,
          delta: 2,
          reason: `Bonus rating tinggi (${score} bintang) dari UMKM`,
        },
      });
    }

    // 3. Update profil mahasiswa
    await tx.studentProfile.update({
      where: { id: student.id },
      data: {
        ratingAvg: Number(newRatingAvg.toFixed(2)),
        ratingCount: newRatingCount,
        points: newPoints,
        level: newLevel,
      },
    });

    // 4. Notifikasi mahasiswa
    await tx.notification.create({
      data: {
        userId: student.userId,
        type: "RATING_RECEIVED",
        title: `Rating Diterima (${score} Bintang)`,
        body: isHighRating
          ? `UMKM memberi Anda ${score} bintang untuk tugas "${job.title}". Anda mendapatkan bonus +2 poin reputasi!`
          : `UMKM memberi Anda ${score} bintang untuk tugas "${job.title}".`,
        href: `/student/my-jobs/${job.id}`,
      },
    });

    return createdRating;
  });

  return {
    success: true,
    rating: result,
    newRatingAvg: Number(newRatingAvg.toFixed(2)),
    pointsEarned: pointsDelta,
  };
}

/**
 * PRD §6.7: Mahasiswa memberi rating 4 dimensi kepada UMKM setelah tugas ACCEPTED
 */
export async function submitRatingFromStudent(
  jobId: string,
  studentUserId: string,
  input: {
    dimensions: StudentRatingDimensions;
    comment?: string;
  }
) {
  const { clarity, communication, professionalism, reviewSpeed } = input.dimensions;

  // Validasi dimensi 1 - 5
  const values = [clarity, communication, professionalism, reviewSpeed];
  for (const v of values) {
    if (v < 1 || v > 5) {
      throw new RatingError("Seluruh dimensi penilaian harus berada di antara 1 dan 5.", "INVALID_DIMENSIONS");
    }
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      umkm: true,
      assignments: {
        where: { status: "COMPLETED" },
        include: { student: true },
      },
    },
  });

  if (!job) {
    throw new RatingError("Pekerjaan tidak ditemukan.", "JOB_NOT_FOUND");
  }

  const assignment = job.assignments.find((a) => a.student.userId === studentUserId);
  if (!assignment) {
    throw new RatingError("Anda tidak terdaftar sebagai pengerja tugas ini.", "UNAUTHORIZED");
  }

  if (job.status !== "ACCEPTED") {
    throw new RatingError(
      "Rating hanya dapat diberikan setelah tugas selesai diterima (ACCEPTED).",
      "JOB_NOT_ACCEPTED"
    );
  }

  // Cek apakah rating STUDENT -> UMKM sudah pernah dibuat
  const existingRating = await prisma.rating.findUnique({
    where: {
      jobId_direction: {
        jobId,
        direction: "STUDENT_TO_UMKM",
      },
    },
  });

  if (existingRating) {
    throw new RatingError("Anda sudah memberikan ulasan untuk UMKM ini.", "ALREADY_RATED");
  }

  // Rata-rata 4 dimensi
  const avgScore = Number(((clarity + communication + professionalism + reviewSpeed) / 4).toFixed(2));
  const umkm = job.umkm;

  const newRatingCount = umkm.ratingCount + 1;
  const newRatingAvg = Number((((umkm.ratingAvg * umkm.ratingCount) + avgScore) / newRatingCount).toFixed(2));

  const result = await prisma.$transaction(async (tx) => {
    // 1. Simpan rating
    const createdRating = await tx.rating.create({
      data: {
        jobId,
        direction: "STUDENT_TO_UMKM",
        fromUserId: studentUserId,
        toUserId: umkm.userId,
        score: avgScore,
        dimensions: input.dimensions as unknown as Prisma.InputJsonValue,
        comment: input.comment?.trim() || null,
      },
    });

    // 2. Update UMKM profile rating
    await tx.umkmProfile.update({
      where: { id: umkm.id },
      data: {
        ratingAvg: newRatingAvg,
        ratingCount: newRatingCount,
      },
    });

    // 3. Notifikasi UMKM
    await tx.notification.create({
      data: {
        userId: umkm.userId,
        type: "RATING_RECEIVED",
        title: `Ulasan Mahasiswa (${avgScore} Bintang)`,
        body: `Mahasiswa telah memberikan penilaian untuk tugas "${job.title}".`,
        href: `/umkm/jobs/${job.id}`,
      },
    });

    return createdRating;
  });

  return {
    success: true,
    rating: result,
    newRatingAvg,
  };
}

