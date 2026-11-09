"use server";

import { unstable_update } from "@/auth";
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
import { prisma } from "@/lib/db";

/**
 * Checks whether an email is already registered in the Karta database.
 * Public action used during registration to detect duplicate accounts and prompt login.
 */
export async function checkEmailAvailabilityAction(
  rawEmail: string
): Promise<Result<{ registered: boolean; role?: string | null; name?: string | null }>> {
  try {
    const cleanEmail = rawEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return failure("Format email tidak valid.", "INVALID_EMAIL");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, role: true, name: true },
    });

    if (existingUser) {
      return success({
        registered: true,
        role: existingUser.role,
        name: existingUser.name,
      });
    }

    return success({ registered: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memeriksa email.";
    return failure(message, "SERVER_ERROR");
  }
}

/**
 * Checks whether a student username is already taken.
 */
export async function checkUsernameAvailabilityAction(
  rawUsername: string
): Promise<Result<{ available: boolean }>> {
  try {
    const cleanUsername = rawUsername.trim().toLowerCase();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return failure("Username harus 3-30 karakter.", "INVALID_LENGTH");
    }
    if (!/^[a-z0-9-]+$/.test(cleanUsername)) {
      return failure("Username hanya boleh huruf kecil, angka, dan tanda hubung (-).", "INVALID_FORMAT");
    }

    const existing = await prisma.studentProfile.findUnique({
      where: { username: cleanUsername },
      select: { id: true },
    });

    return success({ available: !existing });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memeriksa username.";
    return failure(message, "SERVER_ERROR");
  }
}

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
    await unstable_update({
      user: {
        role: "STUDENT",
      },
    });
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
    await unstable_update({
      user: {
        role: "UMKM",
      },
    });
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