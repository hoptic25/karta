"use server";

import type { Result } from "@/lib/result";
import { requireRole, type AuthError } from "./guards";
import type { Role } from "@/generated/prisma/client";

export async function requireRoleResult(
  role: Role
): Promise<Result<{ userId: string }>> {
  try {
    const user = await requireRole(role);
    return { ok: true, data: { userId: user.id } };
  } catch (error) {
    const authError = error as AuthError;
    return {
      ok: false,
      error: {
        code: authError.code || "AUTH_ERROR",
        message: authError.message || "Authentication failed",
      },
    };
  }
}
