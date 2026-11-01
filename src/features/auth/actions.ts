"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "./guards";
import {
  studentOnboardingSchema,
  umkmOnboardingSchema,
} from "./schemas";
import {
  completeStudentOnboarding,
  completeUmkmOnboarding,
} from "./service";
import { validateReferralCode } from "./referral";
import { failure, success, type Result } from "@/lib/result";

export async function completeStudentOnboardingAction(
  rawInput: unknown
): Promise<Result<{ studentId: string; username: string }>> {
  try {
    const user = await requireUser();
    const parsed = studentOnboardingSchema.safeParse(rawInput);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Input tidak valid.";
      return failure(message, "VALIDATION_ERROR");
    }

    const student = await completeStudentOnboarding(user.id, parsed.data);
    revalidatePath("/", "layout");
    return success({ studentId: student.id, username: student.username });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyelesaikan onboarding.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

export async function completeUmkmOnboardingAction(
  rawInput: unknown
): Promise<Result<{ umkmId: string }>> {
  try {
    const user = await requireUser();
    const parsed = umkmOnboardingSchema.safeParse(rawInput);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Input tidak valid.";
      return failure(message, "VALIDATION_ERROR");
    }

    const umkm = await completeUmkmOnboarding(user.id, parsed.data);
    revalidatePath("/", "layout");
    return success({ umkmId: umkm.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyelesaikan onboarding.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

export async function checkReferralCodeAction(
  code: string
): Promise<Result<{ campusName: string; campusCity: string }>> {
  try {
    const user = await requireUser();
    const { campus } = await validateReferralCode(code, user.id);
    return success({ campusName: campus.name, campusCity: campus.city });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kode referral tidak valid.";
    return failure(message, (err as { code?: string }).code || "INVALID_REFERRAL");
  }
}

