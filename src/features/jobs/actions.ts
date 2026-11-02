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
import { claimJob } from "./claim";
import {
  startWork,
  withdrawJob,
  submitWork,
  reviewSubmission,
  type SelfCheckCriterion,
  type CriteriaEvaluation,
} from "./execution";
import type { ReviewDecision } from "@/generated/prisma/client";

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


export async function takeJobAction(
  jobId: string
): Promise<Result<{ assignmentId: string; jobId: string }>> {
  try {
    const user = await requireRole("STUDENT");
    const { assignment, job } = await claimJob(jobId, user.id);

    revalidatePath("/student/jobs");
    revalidatePath(`/student/jobs/${jobId}`);
    revalidatePath("/student/my-jobs");
    revalidatePath(`/student/my-jobs/${jobId}`);
    revalidatePath("/umkm/jobs");
    revalidatePath(`/umkm/jobs/${jobId}`);

    return success({ assignmentId: assignment.id, jobId: job.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil pekerjaan.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

export async function startWorkAction(
  jobId: string
): Promise<Result<{ startedAt: Date }>> {
  try {
    const user = await requireRole("STUDENT");
    const result = await startWork(jobId, user.id);

    revalidatePath("/student/my-jobs");
    revalidatePath(`/student/my-jobs/${jobId}`);
    revalidatePath("/umkm/jobs");
    revalidatePath(`/umkm/jobs/${jobId}`);

    return success({ startedAt: result.startedAt });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memulai pengerjaan.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

export async function withdrawJobAction(
  jobId: string,
  reason?: string
): Promise<Result<{ nextJobStatus: string }>> {
  try {
    const user = await requireRole("STUDENT");
    const result = await withdrawJob(jobId, user.id, reason);

    revalidatePath("/student/jobs");
    revalidatePath(`/student/jobs/${jobId}`);
    revalidatePath("/student/my-jobs");
    revalidatePath(`/student/my-jobs/${jobId}`);
    revalidatePath("/umkm/jobs");
    revalidatePath(`/umkm/jobs/${jobId}`);

    return success({ nextJobStatus: result.nextJobStatus });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengundurkan diri.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

export async function submitWorkAction(input: {
  jobId: string;
  url: string;
  note?: string;
  selfCheck: SelfCheckCriterion[];
}): Promise<Result<{ submissionNumber: number; reviewDueAt: Date }>> {
  try {
    const user = await requireRole("STUDENT");
    const result = await submitWork(input.jobId, user.id, {
      url: input.url,
      note: input.note,
      selfCheck: input.selfCheck,
    });

    revalidatePath("/student/my-jobs");
    revalidatePath(`/student/my-jobs/${input.jobId}`);
    revalidatePath("/umkm/jobs");
    revalidatePath(`/umkm/jobs/${input.jobId}`);

    return success({
      submissionNumber: result.submissionNumber,
      reviewDueAt: result.reviewDueAt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengumpulkan tugas.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

export async function reviewSubmissionAction(input: {
  jobId: string;
  decision: ReviewDecision;
  reason?: string;
  criteriaResults: CriteriaEvaluation[];
}): Promise<Result<{ decision: ReviewDecision }>> {
  try {
    const user = await requireRole("UMKM");
    const result = await reviewSubmission(input.jobId, user.id, {
      decision: input.decision,
      reason: input.reason,
      criteriaResults: input.criteriaResults,
    });

    revalidatePath("/umkm/jobs");
    revalidatePath(`/umkm/jobs/${input.jobId}`);
    revalidatePath("/student/my-jobs");
    revalidatePath(`/student/my-jobs/${input.jobId}`);

    return success({ decision: result.decision as ReviewDecision });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memproses penilaian tugas.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}
