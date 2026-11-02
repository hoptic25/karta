"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/features/auth";
import { failure, success, type Result } from "@/lib/result";
import {
  requestWithdrawal,
  updateBankDetails,
  processWithdrawalByAdmin,
  updateStudentPortfolioSettings,
} from "./service";
import {
  submitRatingFromUmkm,
  submitRatingFromStudent,
  type StudentRatingDimensions,
} from "./ratings";

export async function requestWithdrawalAction(): Promise<Result<{ withdrawalId: string; amountIdr: number }>> {
  try {
    const user = await requireRole("STUDENT");
    const withdrawal = await requestWithdrawal(user.id);

    revalidatePath("/student/earnings");
    revalidatePath("/admin/withdrawals");

    return success({
      withdrawalId: withdrawal.id,
      amountIdr: withdrawal.amountIdr,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengajukan penarikan dana.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

export async function updateBankDetailsAction(input: {
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
}): Promise<Result<{ success: boolean }>> {
  try {
    const user = await requireRole("STUDENT");
    await updateBankDetails(user.id, input);

    revalidatePath("/student/earnings");
    revalidatePath("/student/profile");

    return success({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui rekening bank.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

export async function processWithdrawalAction(input: {
  withdrawalId: string;
  action: "PAY" | "REJECT";
  adminNote?: string;
}): Promise<Result<{ success: boolean }>> {
  try {
    const user = await requireRole("ADMIN");
    await processWithdrawalByAdmin(user.id, input.withdrawalId, input.action, input.adminNote);

    revalidatePath("/admin/withdrawals");
    revalidatePath("/student/earnings");

    return success({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memproses penarikan dana.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

export async function submitUmkmRatingAction(input: {
  jobId: string;
  score: number;
  comment?: string;
}): Promise<Result<{ ratingId: string; pointsEarned: number }>> {
  try {
    const user = await requireRole("UMKM");
    const result = await submitRatingFromUmkm(input.jobId, user.id, {
      score: input.score,
      comment: input.comment,
    });

    revalidatePath("/umkm/jobs");
    revalidatePath(`/umkm/jobs/${input.jobId}`);
    revalidatePath("/student/my-jobs");
    revalidatePath(`/student/my-jobs/${input.jobId}`);

    return success({
      ratingId: result.rating.id,
      pointsEarned: result.pointsEarned,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memberikan rating.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

export async function submitStudentRatingAction(input: {
  jobId: string;
  dimensions: StudentRatingDimensions;
  comment?: string;
}): Promise<Result<{ ratingId: string; score: number }>> {
  try {
    const user = await requireRole("STUDENT");
    const result = await submitRatingFromStudent(input.jobId, user.id, {
      dimensions: input.dimensions,
      comment: input.comment,
    });

    revalidatePath("/student/my-jobs");
    revalidatePath(`/student/my-jobs/${input.jobId}`);
    revalidatePath("/umkm/jobs");
    revalidatePath(`/umkm/jobs/${input.jobId}`);

    return success({
      ratingId: result.rating.id,
      score: result.newRatingAvg,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memberikan ulasan.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

export async function updateStudentPortfolioSettingsAction(input: {
  portfolioPublic?: boolean;
  bio?: string;
}): Promise<Result<{ success: boolean }>> {
  try {
    const user = await requireRole("STUDENT");
    await updateStudentPortfolioSettings(user.id, input);

    revalidatePath("/student/profile");
    return success({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui pengaturan portofolio.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}


