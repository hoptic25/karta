"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/features/auth";
import {
  selectPackageSchema,
  markSubscriptionPaidSchema,
  adminCancelSubscriptionSchema,
  updatePackageSchema,
} from "./schemas";
import {
  selectPackage,
  cancelPendingSubscription,
  markSubscriptionPaid,
  adminCancelSubscription,
  updatePackage,
} from "./service";
import { prisma } from "@/lib/db";
import { failure, success, type Result } from "@/lib/result";

export async function selectPackageAction(
  rawInput: unknown
): Promise<Result<{ subscriptionId: string }>> {
  try {
    const user = await requireRole("UMKM");
    const parsed = selectPackageSchema.safeParse(rawInput);
    if (!parsed.success) {
      return failure(parsed.error.issues[0]?.message || "Input tidak valid.", "VALIDATION_ERROR");
    }

    const umkm = await prisma.umkmProfile.findUnique({
      where: { userId: user.id },
    });
    if (!umkm) {
      return failure("Profil UMKM tidak ditemukan.", "PROFILE_NOT_FOUND");
    }

    const sub = await selectPackage(umkm.id, parsed.data.packageId);
    revalidatePath("/umkm/subscription");
    return success({ subscriptionId: sub.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memilih paket.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

export async function cancelPendingSubscriptionAction(
  subscriptionId: string
): Promise<Result<{ subscriptionId: string }>> {
  try {
    const user = await requireRole("UMKM");
    const umkm = await prisma.umkmProfile.findUnique({
      where: { userId: user.id },
    });
    if (!umkm) {
      return failure("Profil UMKM tidak ditemukan.", "PROFILE_NOT_FOUND");
    }

    const sub = await cancelPendingSubscription(subscriptionId, umkm.id);
    revalidatePath("/umkm/subscription");
    return success({ subscriptionId: sub.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membatalkan langganan.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

export async function markSubscriptionPaidAction(
  rawInput: unknown
): Promise<Result<{ subscriptionId: string }>> {
  try {
    const user = await requireRole("ADMIN");
    const parsed = markSubscriptionPaidSchema.safeParse(rawInput);
    if (!parsed.success) {
      return failure(parsed.error.issues[0]?.message || "Input tidak valid.", "VALIDATION_ERROR");
    }

    const sub = await markSubscriptionPaid(
      parsed.data.subscriptionId,
      user.id,
      parsed.data.paymentNote
    );

    revalidatePath("/admin/subscriptions");
    revalidatePath("/umkm/subscription");
    return success({ subscriptionId: sub.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengonfirmasi pembayaran.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

export async function adminCancelSubscriptionAction(
  rawInput: unknown
): Promise<Result<{ subscriptionId: string }>> {
  try {
    const user = await requireRole("ADMIN");
    const parsed = adminCancelSubscriptionSchema.safeParse(rawInput);
    if (!parsed.success) {
      return failure(parsed.error.issues[0]?.message || "Input tidak valid.", "VALIDATION_ERROR");
    }

    const sub = await adminCancelSubscription(
      parsed.data.subscriptionId,
      user.id,
      parsed.data.reason
    );

    revalidatePath("/admin/subscriptions");
    return success({ subscriptionId: sub.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membatalkan langganan.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

export async function updatePackageAction(
  rawInput: unknown
): Promise<Result<{ packageId: string }>> {
  try {
    const user = await requireRole("ADMIN");
    const parsed = updatePackageSchema.safeParse(rawInput);
    if (!parsed.success) {
      return failure(parsed.error.issues[0]?.message || "Input tidak valid.", "VALIDATION_ERROR");
    }

    const { packageId, ...data } = parsed.data;
    const pkg = await updatePackage(packageId, user.id, data);

    revalidatePath("/admin/packages");
    revalidatePath("/umkm/subscription");
    return success({ packageId: pkg.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui paket.";
    return failure(message, (err as { code?: string }).code || "SERVER_ERROR");
  }
}

