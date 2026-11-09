"use server";

import { revalidatePath } from "next/cache";
import { requireRoleResult } from "@/features/auth/action-helpers";
import type { Result } from "@/lib/result";
import {
  updateUserStatusSchema,
  updateUserRoleSchema,
  type UpdateUserStatusInput,
  type UpdateUserRoleInput,
} from "./schemas";
import { updateUserStatus, updateUserRole } from "./service";
import type { User } from "@/generated/prisma/client";

export async function updateUserStatusAction(
  input: UpdateUserStatusInput
): Promise<Result<User>> {
  const authResult = await requireRoleResult("ADMIN");
  if (!authResult.ok) {
    return authResult;
  }

  const validation = updateUserStatusSchema.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.issues[0]?.message ?? "Input tidak valid",
      },
    };
  }

  const result = await updateUserStatus(
    validation.data,
    authResult.data.userId
  );

  if (result.ok) {
    revalidatePath("/admin/users");
  }

  return result;
}

export async function updateUserRoleAction(
  input: UpdateUserRoleInput
): Promise<Result<User>> {
  const authResult = await requireRoleResult("ADMIN");
  if (!authResult.ok) {
    return authResult;
  }

  const validation = updateUserRoleSchema.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.issues[0]?.message ?? "Input tidak valid",
      },
    };
  }

  const result = await updateUserRole(validation.data, authResult.data.userId);

  if (result.ok) {
    revalidatePath("/admin/users");
  }

  return result;
}
