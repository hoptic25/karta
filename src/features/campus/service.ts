import "server-only";
import { prisma } from "@/lib/db";
import type { Result } from "@/lib/result";
import type {
  CreateCampusInput,
  UpdateCampusInput,
  DeleteCampusInput,
} from "./schemas";
import type { Campus } from "@/generated/prisma/client";
import { getCampusByName } from "./queries";

export async function createCampus(
  input: CreateCampusInput,
  adminUserId: string
): Promise<Result<Campus>> {
  try {
    // Check if campus name already exists
    const existing = await getCampusByName(input.name);
    if (existing) {
      return {
        ok: false,
        error: {
          code: "CAMPUS_EXISTS",
          message: "Kampus dengan nama tersebut sudah ada",
        },
      };
    }

    const campus = await prisma.campus.create({
      data: input,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "CAMPUS_CREATE",
        entity: "Campus",
        entityId: campus.id,
        meta: { campusName: campus.name },
      },
    });

    return { ok: true, data: campus };
  } catch (error) {
    console.error("Error creating campus:", error);
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Gagal membuat kampus",
      },
    };
  }
}

export async function updateCampus(
  input: UpdateCampusInput,
  adminUserId: string
): Promise<Result<Campus>> {
  try {
    const { id, ...data } = input;

    // Check if campus exists
    const existing = await prisma.campus.findUnique({ where: { id } });
    if (!existing) {
      return {
        ok: false,
        error: {
          code: "CAMPUS_NOT_FOUND",
          message: "Kampus tidak ditemukan",
        },
      };
    }

    // If name is being changed, check for duplicates
    if (data.name && data.name !== existing.name) {
      const duplicate = await getCampusByName(data.name);
      if (duplicate) {
        return {
          ok: false,
          error: {
            code: "CAMPUS_EXISTS",
            message: "Kampus dengan nama tersebut sudah ada",
          },
        };
      }
    }

    const campus = await prisma.campus.update({
      where: { id },
      data,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "CAMPUS_UPDATE",
        entity: "Campus",
        entityId: campus.id,
        meta: { changes: data },
      },
    });

    return { ok: true, data: campus };
  } catch (error) {
    console.error("Error updating campus:", error);
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Gagal memperbarui kampus",
      },
    };
  }
}

export async function deleteCampus(
  input: DeleteCampusInput,
  adminUserId: string
): Promise<Result<void>> {
  try {
    const { id } = input;

    // Check if campus exists
    const existing = await prisma.campus.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
            partnerUmkms: true,
            referralCodes: true,
          },
        },
      },
    });

    if (!existing) {
      return {
        ok: false,
        error: {
          code: "CAMPUS_NOT_FOUND",
          message: "Kampus tidak ditemukan",
        },
      };
    }

    // Check if campus has related data
    if (
      existing._count.students > 0 ||
      existing._count.partnerUmkms > 0
    ) {
      return {
        ok: false,
        error: {
          code: "CAMPUS_HAS_RELATIONS",
          message: "Kampus tidak dapat dihapus karena memiliki data terkait",
        },
      };
    }

    // Delete related referral codes first
    if (existing._count.referralCodes > 0) {
      await prisma.referralCode.deleteMany({
        where: { campusId: id },
      });
    }

    await prisma.campus.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "CAMPUS_DELETE",
        entity: "Campus",
        entityId: id,
        meta: { campusName: existing.name },
      },
    });

    return { ok: true, data: undefined };
  } catch (error) {
    console.error("Error deleting campus:", error);
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Gagal menghapus kampus",
      },
    };
  }
}
