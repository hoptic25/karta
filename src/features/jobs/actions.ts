"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/features/auth";
import { prisma } from "@/lib/db";
import { failure, success, type Result } from "@/lib/result";
import {
  saveJobDraftSchema,
  publishJobSchema,
  updateOpenJobSchema,
  cancelJobSchema,
} from "./schemas";
import {
  saveJobDraft,
  publishJob,
  updateOpenJob,
  cancelJobByUmkm,
  duplicateJob,
  deleteJobDraft,
} from "./service";

async function getAuthenticatedUmkm() {
  const user = await requireRole("UMKM");
  const umkm = await prisma.umkmProfile.findUnique({
    where: { userId: user.id },
  });
  if (!umkm) {
    throw new Error("Profil UMKM tidak ditemukan.");
  }
  return umkm;
}

export async function saveJobDraftAction(
  rawInput: unknown
): Promise<Result<{ jobId: string }>> {
  try {
    const umkm = await getAuthenticatedUmkm();
    const parsed = saveJobDraftSchema.safeParse(rawInput);
    if (!parsed.success) {
      return failure(parsed.error.issues[0]?.message || "Data draf tidak valid.", "VALIDATION_ERROR");
    }

    const job = await saveJobDraft(umkm.id, parsed.data);
    revalidatePath("/umkm/jobs");
    revalidatePath(`/umkm/jobs/${job.id}`);
    return success({ jobId: job.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan draf.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

export async function publishJobAction(
  rawInput: unknown
): Promise<Result<{ jobId: string }>> {
  try {
    const umkm = await getAuthenticatedUmkm();
    const parsed = publishJobSchema.safeParse(rawInput);
    if (!parsed.success) {
      return failure(parsed.error.issues[0]?.message || "Pilihan publikasi tidak valid.", "VALIDATION_ERROR");
    }

    const job = await publishJob(parsed.data.jobId, umkm.id, parsed.data.subscriptionId);
    revalidatePath("/umkm/jobs");
    revalidatePath(`/umkm/jobs/${job.id}`);
    revalidatePath("/umkm/subscription");
    return success({ jobId: job.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mempublikasikan pekerjaan.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

export async function updateOpenJobAction(
  rawInput: unknown
): Promise<Result<{ jobId: string }>> {
  try {
    const umkm = await getAuthenticatedUmkm();
    const parsed = updateOpenJobSchema.safeParse(rawInput);
    if (!parsed.success) {
      return failure(parsed.error.issues[0]?.message || "Data perubahan tidak valid.", "VALIDATION_ERROR");
    }

    const { jobId, ...data } = parsed.data;
    const job = await updateOpenJob(jobId, umkm.id, { jobId, ...data });
    revalidatePath("/umkm/jobs");
    revalidatePath(`/umkm/jobs/${job.id}`);
    return success({ jobId: job.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui pekerjaan.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

export async function cancelJobAction(
  rawInput: unknown
): Promise<Result<{ jobId: string }>> {
  try {
    const umkm = await getAuthenticatedUmkm();
    const parsed = cancelJobSchema.safeParse(rawInput);
    if (!parsed.success) {
      return failure(parsed.error.issues[0]?.message || "Input pembatalan tidak valid.", "VALIDATION_ERROR");
    }

    const job = await cancelJobByUmkm(parsed.data.jobId, umkm.id, parsed.data.reason);
    revalidatePath("/umkm/jobs");
    revalidatePath(`/umkm/jobs/${job.id}`);
    revalidatePath("/umkm/subscription");
    return success({ jobId: job.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membatalkan pekerjaan.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

export async function duplicateJobAction(
  jobId: string
): Promise<Result<{ jobId: string }>> {
  try {
    const umkm = await getAuthenticatedUmkm();
    const newJob = await duplicateJob(jobId, umkm.id);
    revalidatePath("/umkm/jobs");
    return success({ jobId: newJob.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menduplikasi pekerjaan.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

export async function deleteJobDraftAction(
  jobId: string
): Promise<Result<{ success: boolean }>> {
  try {
    const umkm = await getAuthenticatedUmkm();
    await deleteJobDraft(jobId, umkm.id);
    revalidatePath("/umkm/jobs");
    return success({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus draf.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

