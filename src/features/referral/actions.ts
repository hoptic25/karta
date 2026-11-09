"use server";

import { revalidatePath } from "next/cache";
import { requireRoleResult } from "@/features/auth/action-helpers";
import type { Result } from "@/lib/result";
import {
  createReferralCodeSchema,
  updateReferralCodeSchema,
  deleteReferralCodeSchema,
  type CreateReferralCodeInput,
  type UpdateReferralCodeInput,
  type DeleteReferralCodeInput,
} from "./schemas";
import {
  createReferralCode,
  updateReferralCode,
  deleteReferralCode,
} from "./service";
import type { ReferralCode } from "@/generated/prisma/client";

export async function createReferralCodeAction(
  input: CreateReferralCodeInput
): Promise<Result<ReferralCode>> {
  const authResult = await requireRoleResult("ADMIN");
  if (!authResult.ok) {
    return authResult;
  }

  const validation = createReferralCodeSchema.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.issues[0]?.message ?? "Input tidak valid",
      },
    };
  }

  const result = await createReferralCode(
    validation.data,
    authResult.data.userId
  );

  if (result.ok) {
    revalidatePath("/admin/referrals");
  }

  return result;
}

export async function updateReferralCodeAction(
  input: UpdateReferralCodeInput
): Promise<Result<ReferralCode>> {
  const authResult = await requireRoleResult("ADMIN");
  if (!authResult.ok) {
    return authResult;
  }

  const validation = updateReferralCodeSchema.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.issues[0]?.message ?? "Input tidak valid",
      },
    };
  }

  const result = await updateReferralCode(
    validation.data,
    authResult.data.userId
  );

  if (result.ok) {
    revalidatePath("/admin/referrals");
  }

  return result;
}

export async function deleteReferralCodeAction(
  input: DeleteReferralCodeInput
): Promise<Result<void>> {
  const authResult = await requireRoleResult("ADMIN");
  if (!authResult.ok) {
    return authResult;
  }

  const validation = deleteReferralCodeSchema.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.issues[0]?.message ?? "Input tidak valid",
      },
    };
  }

  const result = await deleteReferralCode(
    validation.data,
    authResult.data.userId
  );

  if (result.ok) {
    revalidatePath("/admin/referrals");
  }

  return result;
}
