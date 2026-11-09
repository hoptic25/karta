import "server-only";
import { prisma } from "@/lib/db";
import type { Result } from "@/lib/result";
import type {
  CreateReferralCodeInput,
  UpdateReferralCodeInput,
  DeleteReferralCodeInput,
} from "./schemas";
import type { ReferralCode } from "@/generated/prisma/client";
import { getReferralCodeByCode } from "./queries";

export async function createReferralCode(
  input: CreateReferralCodeInput,
  adminUserId: string
): Promise<Result<ReferralCode>> {
  try {
    // Check if code already exists
    const existing = await getReferralCodeByCode(input.code);
    if (existing) {
      return {
        ok: false,
        error: {
          code: "CODE_EXISTS",
          message: "Kode referral sudah digunakan",
        },
      };
    }

    // Check if campus exists
    const campus = await prisma.campus.findUnique({
      where: { id: input.campusId },
    });
    if (!campus) {
      return {
        ok: false,
        error: {
          code: "CAMPUS_NOT_FOUND",
          message: "Kampus tidak ditemukan",
        },
      };
    }

    const referralCode = await prisma.referralCode.create({
      data: {
        code: input.code,
        campusId: input.campusId,
        isActive: input.isActive,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        maxUses: input.maxUses ?? null,
        usedCount: 0,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "REFERRAL_CODE_CREATE",
        entity: "ReferralCode",
        entityId: referralCode.id,
        meta: { code: referralCode.code, campusId: input.campusId },
      },
    });

    return { ok: true, data: referralCode };
  } catch (error) {
    console.error("Error creating referral code:", error);
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Gagal membuat kode referral",
      },
    };
  }
}

export async function updateReferralCode(
  input: UpdateReferralCodeInput,
  adminUserId: string
): Promise<Result<ReferralCode>> {
  try {
    const { id, ...data } = input;

    // Check if referral code exists
    const existing = await prisma.referralCode.findUnique({ where: { id } });
    if (!existing) {
      return {
        ok: false,
        error: {
          code: "REFERRAL_CODE_NOT_FOUND",
          message: "Kode referral tidak ditemukan",
        },
      };
    }

    // If code is being changed, check for duplicates
    if (data.code && data.code !== existing.code) {
      const duplicate = await getReferralCodeByCode(data.code);
      if (duplicate) {
        return {
          ok: false,
          error: {
            code: "CODE_EXISTS",
            message: "Kode referral sudah digunakan",
          },
        };
      }
    }

    // If campus is being changed, check if it exists
    if (data.campusId) {
      const campus = await prisma.campus.findUnique({
        where: { id: data.campusId },
      });
      if (!campus) {
        return {
          ok: false,
          error: {
            code: "CAMPUS_NOT_FOUND",
            message: "Kampus tidak ditemukan",
          },
        };
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.code !== undefined) updateData.code = data.code;
    if (data.campusId !== undefined) updateData.campusId = data.campusId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.expiresAt !== undefined)
      updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    if (data.maxUses !== undefined) updateData.maxUses = data.maxUses;

    const referralCode = await prisma.referralCode.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "REFERRAL_CODE_UPDATE",
        entity: "ReferralCode",
        entityId: referralCode.id,
        meta: { changes: data },
      },
    });

    return { ok: true, data: referralCode };
  } catch (error) {
    console.error("Error updating referral code:", error);
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Gagal memperbarui kode referral",
      },
    };
  }
}

export async function deleteReferralCode(
  input: DeleteReferralCodeInput,
  adminUserId: string
): Promise<Result<void>> {
  try {
    const { id } = input;

    // Check if referral code exists
    const existing = await prisma.referralCode.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
    });

    if (!existing) {
      return {
        ok: false,
        error: {
          code: "REFERRAL_CODE_NOT_FOUND",
          message: "Kode referral tidak ditemukan",
        },
      };
    }

    // Check if code has been redeemed
    if (existing._count.redemptions > 0) {
      return {
        ok: false,
        error: {
          code: "REFERRAL_CODE_HAS_REDEMPTIONS",
          message:
            "Kode referral tidak dapat dihapus karena sudah digunakan",
        },
      };
    }

    await prisma.referralCode.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "REFERRAL_CODE_DELETE",
        entity: "ReferralCode",
        entityId: id,
        meta: { code: existing.code },
      },
    });

    return { ok: true, data: undefined };
  } catch (error) {
    console.error("Error deleting referral code:", error);
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Gagal menghapus kode referral",
      },
    };
  }
}
