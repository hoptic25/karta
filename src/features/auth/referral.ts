import "server-only";
import { prisma } from "@/lib/db";
import type { Campus, ReferralCode } from "@/generated/prisma/client";

// Rate limit store: userId -> timestamps of failures
const failureMap = new Map<string, number[]>();

export class ReferralError extends Error {
  code: string;
  constructor(message: string, code = "INVALID_REFERRAL") {
    super(message);
    this.name = "ReferralError";
    this.code = code;
  }
}

/**
 * Checks failure rate limit (BR-A4: max 5 attempts per 15 minutes per user)
 */
export function checkReferralRateLimit(userId: string): void {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const attempts = (failureMap.get(userId) || []).filter((time) => now - time < windowMs);

  if (attempts.length >= 5) {
    throw new ReferralError(
      "Terlalu banyak percobaan kode referral yang gagal. Silakan tunggu 15 menit.",
      "RATE_LIMITED"
    );
  }
  failureMap.set(userId, attempts);
}

/**
 * Records a failure attempt for rate limiting
 */
export function recordReferralFailure(userId: string): void {
  const now = Date.now();
  const attempts = failureMap.get(userId) || [];
  attempts.push(now);
  failureMap.set(userId, attempts);
}

/**
 * Validates a referral code string against database and business rules (BR-A3)
 */
export async function validateReferralCode(
  rawCode: string,
  userId: string
): Promise<{ referral: ReferralCode; campus: Campus }> {
  checkReferralRateLimit(userId);

  const normalizedCode = rawCode.trim().toUpperCase();
  if (!normalizedCode) {
    recordReferralFailure(userId);
    throw new ReferralError("Kode referral wajib diisi.", "EMPTY_CODE");
  }

  // Check if user already redeemed a referral code
  const existingRedemption = await prisma.referralRedemption.findUnique({
    where: { userId },
  });
  if (existingRedemption) {
    throw new ReferralError(
      "Anda sudah pernah menukarkan kode referral.",
      "ALREADY_REDEEMED"
    );
  }

  const referral = await prisma.referralCode.findUnique({
    where: { code: normalizedCode },
    include: { campus: true },
  });

  if (!referral) {
    recordReferralFailure(userId);
    throw new ReferralError("Kode referral tidak ditemukan.", "CODE_NOT_FOUND");
  }

  if (!referral.isActive) {
    recordReferralFailure(userId);
    throw new ReferralError("Kode referral sudah tidak aktif.", "CODE_INACTIVE");
  }

  if (referral.expiresAt && referral.expiresAt.getTime() < Date.now()) {
    recordReferralFailure(userId);
    throw new ReferralError("Kode referral sudah kedaluwarsa.", "CODE_EXPIRED");
  }

  if (referral.maxUses !== null && referral.usedCount >= referral.maxUses) {
    recordReferralFailure(userId);
    throw new ReferralError("Kuota penggunaan kode referral ini sudah habis.", "CODE_MAX_USES_REACHED");
  }

  if (!referral.campus || !referral.campus.isActive) {
    recordReferralFailure(userId);
    throw new ReferralError("Kampus mitra untuk kode ini sedang nonaktif.", "CAMPUS_INACTIVE");
  }

  return { referral, campus: referral.campus };
}

