import "server-only";

import { prisma } from "@/lib/db";
import { validateTransition } from "./state-machine";
import { assertValidDeadline } from "./deadline";
import { deductQuota, restoreQuota } from "@/features/subscription";
import type {
  SaveJobDraftInput,
  UpdateOpenJobInput,
} from "./schemas";
import type { Job, PackageTier } from "@/generated/prisma/client";

export class JobServiceError extends Error {
  code: string;
  constructor(message: string, code = "JOB_SERVICE_ERROR") {
    super(message);
    this.name = "JobServiceError";
    this.code = code;
  }
}

/**
 * Menyimpan draf pekerjaan baru atau memperbarui draf yang sudah ada (C-2).
 */
export async function saveJobDraft(
  umkmId: string,
  input: SaveJobDraftInput
): Promise<Job> {
  const { id, criteria, ...jobData } = input;

  if (id) {
    const existing = await prisma.job.findUnique({
      where: { id },
      select: { id: true, umkmId: true, status: true },
    });

    if (!existing) {
      throw new JobServiceError("Draf pekerjaan tidak ditemukan.", "JOB_NOT_FOUND");
    }

    if (existing.umkmId !== umkmId) {
      throw new JobServiceError("Anda tidak memiliki akses ke pekerjaan ini.", "FORBIDDEN");
    }

    if (existing.status !== "DRAFT") {
      throw new JobServiceError(
        "Hanya pekerjaan berstatus DRAFT yang dapat diedit sebagai draf.",
        "INVALID_STATUS"
      );
    }

    return await prisma.$transaction(async (tx) => {
      // Hapus kriteria lama dan ganti dengan yang baru
      await tx.acceptanceCriterion.deleteMany({
        where: { jobId: id },
      });

      const updated = await tx.job.update({
        where: { id },
        data: {
          ...jobData,
          criteria: {
            create: criteria.map((text, idx) => ({
              text,
              position: idx,
            })),
          },
        },
      });

      return updated;
    });
  }

  // Buat pekerjaan baru berstatus DRAFT
  return await prisma.$transaction(async (tx) => {
    return await tx.job.create({
      data: {
        ...jobData,
        umkmId,
        status: "DRAFT",
        criteria: {
          create: criteria.map((text, idx) => ({
            text,
            position: idx,
          })),
        },
      },
    });
  });
}

/**
 * Mempublikasikan pekerjaan dari DRAFT menjadi OPEN (BR-J1, BR-J2, BR-J3, BR-S4, BR-S7).
 */
export async function publishJob(
  jobId: string,
  umkmId: string,
  subscriptionId: string
): Promise<Job> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { criteria: true },
  });

  if (!job) {
    throw new JobServiceError("Pekerjaan tidak ditemukan.", "JOB_NOT_FOUND");
  }

  if (job.umkmId !== umkmId) {
    throw new JobServiceError("Anda tidak berhak mempublikasikan pekerjaan ini.", "FORBIDDEN");
  }

  validateTransition(job.status, "OPEN", "UMKM");

  if (!job.criteria || job.criteria.length < 1 || job.criteria.length > 7) {
    throw new JobServiceError(
      "Pekerjaan wajib memiliki antara 1 hingga 7 kriteria penerimaan.",
      "INVALID_CRITERIA"
    );
  }

  // Verifikasi langganan yang dipilih
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { package: true },
  });

  if (!sub || sub.umkmId !== umkmId) {
    throw new JobServiceError("Paket langganan tidak ditemukan atau tidak valid.", "INVALID_SUBSCRIPTION");
  }

  if (sub.status !== "ACTIVE") {
    throw new JobServiceError("Paket langganan tidak sedang aktif.", "SUBSCRIPTION_INACTIVE");
  }

  const now = new Date();
  if (sub.endsAt && sub.endsAt.getTime() < now.getTime()) {
    throw new JobServiceError("Masa berlaku paket langganan telah berakhir.", "SUBSCRIPTION_EXPIRED");
  }

  if (sub.quotaUsed >= sub.quotaTotal) {
    throw new JobServiceError("Kuota pada paket langganan ini telah habis.", "QUOTA_EXHAUSTED");
  }

  const pkg = sub.package;

  // Validasi tenggat minimum (BR-J3)
  await assertValidDeadline(job.jobRoleId, pkg.tier, job.deadlineAt, now);

  // Ambil studentSharePct dari PlatformConfig bila ada (default: 60)
  let studentSharePct = 60;
  try {
    const config = await prisma.platformConfig.findUnique({
      where: { key: "studentSharePct" },
    });
    if (config?.value) {
      studentSharePct = Number(config.value) || 60;
    }
  } catch {
    studentSharePct = 60;
  }

  // Hitung snapshot keuangan (BR-J2)
  const allocationIdr = pkg.allocationPerJobIdr;
  const isPaid = pkg.isPaidJobs;
  const studentShareIdr = isPaid ? Math.floor((allocationIdr * studentSharePct) / 100) : 0;
  const platformShareIdr = isPaid ? allocationIdr - studentShareIdr : 0;
  const packageTier: PackageTier = pkg.tier;

  // Waktu Newcomer Lane (BR-C5: 30 menit)
  let newcomerLaneUntil: Date | null = null;
  if (job.beginnerFriendly) {
    newcomerLaneUntil = new Date(now.getTime() + 30 * 60 * 1000);
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Kurangi kuota langganan (BR-S4)
    await deductQuota(tx, subscriptionId, jobId, `Publikasi pekerjaan: ${job.title}`);

    // 2. Update status dan simpan snapshot keuangan ke Job
    const published = await tx.job.update({
      where: { id: jobId },
      data: {
        status: "OPEN",
        subscriptionId,
        packageTier,
        isPaid,
        allocationIdr,
        studentShareIdr,
        platformShareIdr,
        publishedAt: now,
        newcomerLaneUntil,
      },
    });

    return published;
  });
}

/**
 * Memperbarui pekerjaan yang berstatus OPEN (BR-J4).
 * Role, paket, dan alokasi terkunci; hanya konten dan deadline yang boleh diubah.
 */
export async function updateOpenJob(
  jobId: string,
  umkmId: string,
  input: UpdateOpenJobInput
): Promise<Job> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new JobServiceError("Pekerjaan tidak ditemukan.", "JOB_NOT_FOUND");
  }

  if (job.umkmId !== umkmId) {
    throw new JobServiceError("Anda tidak memiliki akses ke pekerjaan ini.", "FORBIDDEN");
  }

  if (job.status !== "OPEN") {
    throw new JobServiceError("Hanya pekerjaan berstatus OPEN yang dapat diedit di sini.", "INVALID_STATUS");
  }

  const { criteria, ...contentData } = input;
  const effectiveTier = job.packageTier || "BASIC";

  // Validasi deadline baru terhadap tanggal publikasi awal (atau saat ini)
  const baseTime = job.publishedAt || new Date();
  await assertValidDeadline(job.jobRoleId, effectiveTier, contentData.deadlineAt, baseTime);

  return await prisma.$transaction(async (tx) => {
    await tx.acceptanceCriterion.deleteMany({
      where: { jobId },
    });

    return await tx.job.update({
      where: { id: jobId },
      data: {
        ...contentData,
        criteria: {
          create: criteria.map((text, idx) => ({
            text,
            position: idx,
          })),
        },
      },
    });
  });
}

/**
 * Membatalkan pekerjaan oleh UMKM (BR-J4, BR-S5a, BR-S5c, BR-E7).
 * Dapat dilakukan jika status OPEN atau CLAIMED (sebelum mahasiswa mulai).
 */
export async function cancelJobByUmkm(
  jobId: string,
  umkmId: string,
  reason?: string
): Promise<Job> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      assignments: {
        where: { status: "ACTIVE" },
      },
    },
  });

  if (!job) {
    throw new JobServiceError("Pekerjaan tidak ditemukan.", "JOB_NOT_FOUND");
  }

  if (job.umkmId !== umkmId) {
    throw new JobServiceError("Anda tidak berhak membatalkan pekerjaan ini.", "FORBIDDEN");
  }

  validateTransition(job.status, "CANCELLED", "UMKM");

  return await prisma.$transaction(async (tx) => {
    // Kasus OPEN dibatalkan UMKM (BR-S5a)
    if (job.status === "OPEN") {
      const cancelled = await tx.job.update({
        where: { id: jobId },
        data: { status: "CANCELLED" },
      });

      if (job.subscriptionId) {
        await restoreQuota(
          tx,
          job.subscriptionId,
          jobId,
          `Pembatalan pekerjaan OPEN oleh UMKM: ${reason || "Dibatalkan"}`
        );
      }

      return cancelled;
    }

    // Kasus CLAIMED dibatalkan UMKM sebelum mahasiswa mulai (BR-S5c)
    if (job.status === "CLAIMED") {
      const cancelled = await tx.job.update({
        where: { id: jobId },
        data: { status: "CANCELLED" },
      });

      // Update assignment aktif menjadi WITHDRAWN
      const activeAssignment = job.assignments[0];
      if (activeAssignment) {
        await tx.jobAssignment.update({
          where: { id: activeAssignment.id },
          data: {
            status: "WITHDRAWN",
            endedAt: new Date(),
            endReason: reason || "Dibatalkan oleh UMKM sebelum pengerjaan dimulai",
          },
        });

        // Void ledger entries terkait jika ada
        await tx.ledgerEntry.updateMany({
          where: {
            assignmentId: activeAssignment.id,
            status: "RESERVED",
          },
          data: {
            status: "VOIDED",
          },
        });
      }

      if (job.subscriptionId) {
        await restoreQuota(
          tx,
          job.subscriptionId,
          jobId,
          `Pembatalan pekerjaan CLAIMED oleh UMKM: ${reason || "Dibatalkan"}`
        );
      }

      return cancelled;
    }

    throw new JobServiceError(
      "Pekerjaan yang sedang berjalan tidak dapat dibatalkan langsung. Gunakan Lapor Masalah.",
      "CANNOT_CANCEL"
    );
  });
}

/**
 * Menduplikasi pekerjaan untuk membuat draf baru (C-2).
 */
export async function duplicateJob(jobId: string, umkmId: string): Promise<Job> {
  const original = await prisma.job.findUnique({
    where: { id: jobId },
    include: { criteria: { orderBy: { position: "asc" } } },
  });

  if (!original) {
    throw new JobServiceError("Pekerjaan asli tidak ditemukan.", "JOB_NOT_FOUND");
  }

  if (original.umkmId !== umkmId) {
    throw new JobServiceError("Anda tidak memiliki izin menduplikasi pekerjaan ini.", "FORBIDDEN");
  }

  // Deadline default 3 hari ke depan
  const defaultDeadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  return await prisma.$transaction(async (tx) => {
    return await tx.job.create({
      data: {
        umkmId,
        title: `(Salinan) ${original.title}`.slice(0, 120),
        description: original.description,
        instructions: original.instructions,
        jobRoleId: original.jobRoleId,
        deliverableType: original.deliverableType,
        deadlineAt: defaultDeadline,
        minLevel: original.minLevel,
        beginnerFriendly: original.beginnerFriendly,
        status: "DRAFT",
        criteria: {
          create: original.criteria.map((c) => ({
            text: c.text,
            position: c.position,
          })),
        },
      },
    });
  });
}

/**
 * Menghapus draf pekerjaan (beserta gambar referensi pendukungnya per BR-I5).
 */
export async function deleteJobDraft(jobId: string, umkmId: string): Promise<void> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, umkmId: true, status: true },
  });

  if (!job) {
    throw new JobServiceError("Draf tidak ditemukan.", "JOB_NOT_FOUND");
  }

  if (job.umkmId !== umkmId) {
    throw new JobServiceError("Anda tidak memiliki akses menghapus pekerjaan ini.", "FORBIDDEN");
  }

  if (job.status !== "DRAFT") {
    throw new JobServiceError("Hanya pekerjaan berstatus DRAFT yang dapat dihapus.", "CANNOT_DELETE");
  }

  await prisma.$transaction(async (tx) => {
    await tx.acceptanceCriterion.deleteMany({
      where: { jobId },
    });
    await tx.imageAsset.deleteMany({
      where: { jobId },
    });
    await tx.job.delete({
      where: { id: jobId },
    });
  });
}
