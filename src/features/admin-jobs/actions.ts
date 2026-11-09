"use server";

import { revalidatePath } from "next/cache";
import { requireRoleResult } from "@/features/auth/action-helpers";
import type { Result } from "@/lib/result";
import {
  createJobSchema,
  updateJobSchema,
  deleteJobSchema,
  updateJobStatusSchema,
  type CreateJobInput,
  type UpdateJobInput,
  type DeleteJobInput,
  type UpdateJobStatusInput,
} from "./schemas";
import { createJob, updateJob, deleteJob, updateJobStatus } from "./service";
import type { Job } from "@/generated/prisma/client";

export async function createJobAction(
  input: CreateJobInput
): Promise<Result<Job>> {
  const authResult = await requireRoleResult("ADMIN");
  if (!authResult.ok) {
    return authResult;
  }

  const validation = createJobSchema.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.issues[0]?.message ?? "Input tidak valid",
      },
    };
  }

  const result = await createJob(validation.data, authResult.data.userId);

  if (result.ok) {
    revalidatePath("/admin/jobs");
  }

  return result;
}

export async function updateJobAction(
  input: UpdateJobInput
): Promise<Result<Job>> {
  const authResult = await requireRoleResult("ADMIN");
  if (!authResult.ok) {
    return authResult;
  }

  const validation = updateJobSchema.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.issues[0]?.message ?? "Input tidak valid",
      },
    };
  }

  const result = await updateJob(validation.data, authResult.data.userId);

  if (result.ok) {
    revalidatePath("/admin/jobs");
  }

  return result;
}

export async function deleteJobAction(
  input: DeleteJobInput
): Promise<Result<void>> {
  const authResult = await requireRoleResult("ADMIN");
  if (!authResult.ok) {
    return authResult;
  }

  const validation = deleteJobSchema.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.issues[0]?.message ?? "Input tidak valid",
      },
    };
  }

  const result = await deleteJob(validation.data, authResult.data.userId);

  if (result.ok) {
    revalidatePath("/admin/jobs");
  }

  return result;
}

export async function updateJobStatusAction(
  input: UpdateJobStatusInput
): Promise<Result<Job>> {
  const authResult = await requireRoleResult("ADMIN");
  if (!authResult.ok) {
    return authResult;
  }

  const validation = updateJobStatusSchema.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error.issues[0]?.message ?? "Input tidak valid",
      },
    };
  }

  const result = await updateJobStatus(validation.data, authResult.data.userId);

  if (result.ok) {
    revalidatePath("/admin/jobs");
  }

  return result;
}
