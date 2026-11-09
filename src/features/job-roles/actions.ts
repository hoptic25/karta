"use server";

import { revalidatePath } from "next/cache";
import { requireRoleResult } from "@/features/auth/action-helpers";
import type { Result } from "@/lib/result";
import {
  createJobRoleSchema,
  updateJobRoleSchema,
  deleteJobRoleSchema,
  type CreateJobRoleInput,
  type UpdateJobRoleInput,
  type DeleteJobRoleInput,
} from "./schemas";
import { createJobRole, updateJobRole, deleteJobRole } from "./service";
import type { JobRole } from "@/generated/prisma/client";

export async function createJobRoleAction(
  input: CreateJobRoleInput
): Promise<Result<JobRole>> {
  const authResult = await requireRoleResult("ADMIN");
  if (!authResult.ok) {
    return authResult;
  }

  const validation = createJobRoleSchema.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.issues[0]?.message ?? "Input tidak valid",
      },
    };
  }

  const result = await createJobRole(validation.data, authResult.data.userId);

  if (result.ok) {
    revalidatePath("/admin/job-roles");
  }

  return result;
}

export async function updateJobRoleAction(
  input: UpdateJobRoleInput
): Promise<Result<JobRole>> {
  const authResult = await requireRoleResult("ADMIN");
  if (!authResult.ok) {
    return authResult;
  }

  const validation = updateJobRoleSchema.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.issues[0]?.message ?? "Input tidak valid",
      },
    };
  }

  const result = await updateJobRole(validation.data, authResult.data.userId);

  if (result.ok) {
    revalidatePath("/admin/job-roles");
  }

  return result;
}

export async function deleteJobRoleAction(
  input: DeleteJobRoleInput
): Promise<Result<void>> {
  const authResult = await requireRoleResult("ADMIN");
  if (!authResult.ok) {
    return authResult;
  }

  const validation = deleteJobRoleSchema.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.issues[0]?.message ?? "Input tidak valid",
      },
    };
  }

  const result = await deleteJobRole(validation.data, authResult.data.userId);

  if (result.ok) {
    revalidatePath("/admin/job-roles");
  }

  return result;
}
