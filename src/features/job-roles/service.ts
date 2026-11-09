import { prisma } from "@/lib/db";
import type { Result } from "@/lib/result";
import type {
  CreateJobRoleInput,
  UpdateJobRoleInput,
  DeleteJobRoleInput,
} from "./schemas";
import type { JobRole } from "@/generated/prisma/client";
import { getJobRoleByKey } from "./queries";
import { revalidateTag } from "next/cache";

/**
 * Generate key from label
 * "Video Editor" -> "VIDEO_EDITOR"
 */
/**
 * Kudu export generateKeyFromLabel kanggo seed files
 */
export function generateKeyFromLabel(label: string): string {
  return label
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "") // Remove special chars
    .replace(/\s+/g, "_") // Replace spaces with underscore
    .substring(0, 50); // Limit length
}

export async function createJobRole(
  input: Omit<CreateJobRoleInput, "key">,
  adminUserId: string
): Promise<Result<JobRole>> {
  try {
    // Auto-generate key from label
    const key = generateKeyFromLabel(input.label);

    // Check if key already exists
    const existing = await getJobRoleByKey(key);
    if (existing) {
      return {
        ok: false,
        error: {
          code: "KEY_EXISTS",
          message: `Role dengan nama serupa sudah ada: ${existing.label}`,
        },
      };
    }

    const role = await prisma.jobRole.create({
      data: {
        key,
        label: input.label,
        description: input.description,
        sortOrder: input.sortOrder ?? 0,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "JOB_ROLE_CREATE",
        entity: "JobRole",
        entityId: role.id,
        meta: { key: role.key, label: role.label },
      },
    });

    // Revalidate cache
    revalidateTag("job-roles", "default");

    return { ok: true, data: role };
  } catch (error) {
    console.error("Error creating job role:", error);
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Gagal membuat role",
      },
    };
  }
}

export async function updateJobRole(
  input: UpdateJobRoleInput,
  adminUserId: string
): Promise<Result<JobRole>> {
  try {
    const { id, ...data } = input;

    // Check if role exists
    const existing = await prisma.jobRole.findUnique({ where: { id } });
    if (!existing) {
      return {
        ok: false,
        error: {
          code: "ROLE_NOT_FOUND",
          message: "Role tidak ditemukan",
        },
      };
    }

    const role = await prisma.jobRole.update({
      where: { id },
      data,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "JOB_ROLE_UPDATE",
        entity: "JobRole",
        entityId: role.id,
        meta: { changes: data },
      },
    });

    // Revalidate cache
    revalidateTag("job-roles", "default");

    return { ok: true, data: role };
  } catch (error) {
    console.error("Error updating job role:", error);
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Gagal memperbarui role",
      },
    };
  }
}

export async function deleteJobRole(
  input: DeleteJobRoleInput,
  adminUserId: string
): Promise<Result<void>> {
  try {
    const { id } = input;

    // Check if role exists
    const existing = await prisma.jobRole.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            jobs: true,
            studentProfiles: true,
          },
        },
      },
    });

    if (!existing) {
      return {
        ok: false,
        error: {
          code: "ROLE_NOT_FOUND",
          message: "Role tidak ditemukan",
        },
      };
    }

    // Check if role is in use
    if (existing._count.jobs > 0 || existing._count.studentProfiles > 0) {
      // Soft delete only
      await prisma.jobRole.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // Hard delete if not used
      await prisma.jobRole.delete({
        where: { id },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "JOB_ROLE_DELETE",
        entity: "JobRole",
        entityId: id,
        meta: { key: existing.key, label: existing.label },
      },
    });

    // Revalidate cache
    revalidateTag("job-roles", "default");

    return { ok: true, data: undefined };
  } catch (error) {
    console.error("Error deleting job role:", error);
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Gagal menghapus role",
      },
    };
  }
}
