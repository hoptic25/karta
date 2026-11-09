import "server-only";
import { prisma } from "@/lib/db";
import type { Result } from "@/lib/result";
import type { UpdateUserStatusInput, UpdateUserRoleInput } from "./schemas";
import type { User } from "@/generated/prisma/client";

export async function updateUserStatus(
  input: UpdateUserStatusInput,
  adminUserId: string
): Promise<Result<User>> {
  try {
    const { userId, status } = input;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return {
        ok: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User tidak ditemukan",
        },
      };
    }

    // Prevent admin from suspending themselves
    if (userId === adminUserId) {
      return {
        ok: false,
        error: {
          code: "CANNOT_SUSPEND_SELF",
          message: "Anda tidak dapat mengubah status akun sendiri",
        },
      };
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: status === "SUSPENDED" ? "USER_SUSPEND" : "USER_ACTIVATE",
        entity: "User",
        entityId: userId,
        meta: { userEmail: user.email, newStatus: status },
      },
    });

    return { ok: true, data: updatedUser };
  } catch (error) {
    console.error("Error updating user status:", error);
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Gagal memperbarui status user",
      },
    };
  }
}

export async function updateUserRole(
  input: UpdateUserRoleInput,
  adminUserId: string
): Promise<Result<User>> {
  try {
    const { userId, role } = input;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return {
        ok: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User tidak ditemukan",
        },
      };
    }

    // Prevent admin from changing their own role
    if (userId === adminUserId) {
      return {
        ok: false,
        error: {
          code: "CANNOT_CHANGE_OWN_ROLE",
          message: "Anda tidak dapat mengubah role akun sendiri",
        },
      };
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: "USER_ROLE_CHANGE",
        entity: "User",
        entityId: userId,
        meta: {
          userEmail: user.email,
          oldRole: user.role,
          newRole: role,
        },
      },
    });

    return { ok: true, data: updatedUser };
  } catch (error) {
    console.error("Error updating user role:", error);
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Gagal memperbarui role user",
      },
    };
  }
}
