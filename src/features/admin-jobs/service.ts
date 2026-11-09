import "server-only";
import { prisma } from "@/lib/db";
import type { Result } from "@/lib/result";
import type {
  CreateJobInput,
  UpdateJobInput,
  DeleteJobInput,
  UpdateJobStatusInput,
} from "./schemas";
import type { Job } from "@/generated/prisma/client";

export async function createJob(
  input: CreateJobInput,
  adminUserId: string
): Promise<Result<Job>> {
  try {
    // Verify UMKM exists
    const umkm = await prisma.umkmProfile.findUnique({
      where: { id: input.umkmId },
    });

    if (!umkm) {
      return {
        ok: false,
        error: {
          code: "UMKM_NOT_FOUND",
          message: "UMKM tidak ditemukan",
        },
      };
    }

    const job = await prisma.job.create({
      data: {
        umkmId: input.umkmId,
        title: input.title,
        description: input.description,
        instructions: input.instructions,
        jobRoleId: input.jobRoleId,
        deliverableType: input.deliverableType,
        deadlineAt: new Date(input.deadlineAt),
        minLevel: input.minLevel,
        beginnerFriendly: input.beginnerFriendly,
        isPaid: input.isPaid,
        allocationIdr: input.allocationIdr,
        status: "DRAFT",
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "JOB_CREATE",
        entity: "Job",
        entityId: job.id,
        meta: {
          jobTitle: job.title,
          umkmId: input.umkmId,
        },
      },
    });

    return { ok: true, data: job };
  } catch (error) {
    console.error("Error creating job:", error);
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Gagal membuat pekerjaan",
      },
    };
  }
}

export async function updateJob(
  input: UpdateJobInput,
  adminUserId: string
): Promise<Result<Job>> {
  try {
    const { id, ...data } = input;

    // Check if job exists
    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) {
      return {
        ok: false,
        error: {
          code: "JOB_NOT_FOUND",
          message: "Pekerjaan tidak ditemukan",
        },
      };
    }

    const updateData: Record<string, unknown> = {};
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.instructions) updateData.instructions = data.instructions;
    if (data.jobRoleId) updateData.jobRoleId = data.jobRoleId;
    if (data.deliverableType) updateData.deliverableType = data.deliverableType;
    if (data.deadlineAt) updateData.deadlineAt = new Date(data.deadlineAt);
    if (data.minLevel) updateData.minLevel = data.minLevel;
    if (data.beginnerFriendly !== undefined) updateData.beginnerFriendly = data.beginnerFriendly;
    if (data.isPaid !== undefined) updateData.isPaid = data.isPaid;
    if (data.allocationIdr !== undefined) updateData.allocationIdr = data.allocationIdr;

    const job = await prisma.job.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "JOB_UPDATE",
        entity: "Job",
        entityId: job.id,
        meta: { changes: data },
      },
    });

    return { ok: true, data: job };
  } catch (error) {
    console.error("Error updating job:", error);
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Gagal memperbarui pekerjaan",
      },
    };
  }
}

export async function deleteJob(
  input: DeleteJobInput,
  adminUserId: string
): Promise<Result<void>> {
  try {
    const { id } = input;

    // Check if job exists
    const existing = await prisma.job.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assignments: true,
          },
        },
      },
    });

    if (!existing) {
      return {
        ok: false,
        error: {
          code: "JOB_NOT_FOUND",
          message: "Pekerjaan tidak ditemukan",
        },
      };
    }

    // Check if job has assignments
    if (existing._count.assignments > 0) {
      return {
        ok: false,
        error: {
          code: "JOB_HAS_ASSIGNMENTS",
          message: "Pekerjaan tidak dapat dihapus karena sudah ada yang mengerjakan",
        },
      };
    }

    await prisma.job.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "JOB_DELETE",
        entity: "Job",
        entityId: id,
        meta: { jobTitle: existing.title },
      },
    });

    return { ok: true, data: undefined };
  } catch (error) {
    console.error("Error deleting job:", error);
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Gagal menghapus pekerjaan",
      },
    };
  }
}

export async function updateJobStatus(
  input: UpdateJobStatusInput,
  adminUserId: string
): Promise<Result<Job>> {
  try {
    const { jobId, status } = input;

    // Check if job exists
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return {
        ok: false,
        error: {
          code: "JOB_NOT_FOUND",
          message: "Pekerjaan tidak ditemukan",
        },
      };
    }

    // Update job status
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: { status },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "JOB_STATUS_CHANGE",
        entity: "Job",
        entityId: jobId,
        meta: {
          jobTitle: job.title,
          oldStatus: job.status,
          newStatus: status,
        },
      },
    });

    return { ok: true, data: updatedJob };
  } catch (error) {
    console.error("Error updating job status:", error);
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Gagal memperbarui status pekerjaan",
      },
    };
  }
}
