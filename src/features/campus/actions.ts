"use server";

import { revalidatePath } from "next/cache";
import { requireRoleResult } from "@/features/auth/action-helpers";
import type { Result } from "@/lib/result";
import {
  createCampusSchema,
  updateCampusSchema,
  deleteCampusSchema,
  type CreateCampusInput,
  type UpdateCampusInput,
  type DeleteCampusInput,
} from "./schemas";
import { createCampus, updateCampus, deleteCampus } from "./service";
import type { Campus } from "@/generated/prisma/client";

export async function createCampusAction(
  input: CreateCampusInput
): Promise<Result<Campus>> {
  const authResult = await requireRoleResult("ADMIN");
  if (!authResult.ok) {
    return authResult;
  }

  const validation = createCampusSchema.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.issues[0]?.message ?? "Input tidak valid",
      },
    };
  }

  const result = await createCampus(validation.data, authResult.data.userId);

  if (result.ok) {
    revalidatePath("/admin/campuses");
  }

  return result;
}

export async function updateCampusAction(
  input: UpdateCampusInput
): Promise<Result<Campus>> {
  const authResult = await requireRoleResult("ADMIN");
  if (!authResult.ok) {
    return authResult;
  }

  const validation = updateCampusSchema.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.issues[0]?.message ?? "Input tidak valid",
      },
    };
  }

  const result = await updateCampus(validation.data, authResult.data.userId);

  if (result.ok) {
    revalidatePath("/admin/campuses");
  }

  return result;
}

export async function deleteCampusAction(
  input: DeleteCampusInput
): Promise<Result<void>> {
  const authResult = await requireRoleResult("ADMIN");
  if (!authResult.ok) {
    return authResult;
  }

  const validation = deleteCampusSchema.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.issues[0]?.message ?? "Input tidak valid",
      },
    };
  }

  const result = await deleteCampus(validation.data, authResult.data.userId);

  if (result.ok) {
    revalidatePath("/admin/campuses");
  }

  return result;
}
