import "server-only";
import { prisma } from "@/lib/db";
import { validateReferralCode } from "./referral";
import type { StudentOnboardingInput, UmkmOnboardingInput } from "./schemas";
import { format } from "date-fns";

export class OnboardingError extends Error {
  code: string;
  constructor(message: string, code = "ONBOARDING_ERROR") {
    super(message);
    this.name = "OnboardingError";
    this.code = code;
  }
}

/**
 * Completes Student onboarding: validates referral, binds campus, creates profile & redemption
 */
export async function completeStudentOnboarding(
  userId: string,
  input: StudentOnboardingInput
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { student: true },
  });

  if (!user) {
    throw new OnboardingError("Pengguna tidak ditemukan.", "USER_NOT_FOUND");
  }

  if (user.student) {
    throw new OnboardingError("Profil mahasiswa sudah pernah dibuat.", "ALREADY_COMPLETED");
  }

  // Check username uniqueness
  const existingUsername = await prisma.studentProfile.findUnique({
    where: { username: input.username.toLowerCase() },
  });
  if (existingUsername) {
    throw new OnboardingError("Username sudah digunakan. Silakan pilih username lain.", "USERNAME_TAKEN");
  }

  // Validate campus email requirement if enabled in PlatformConfig (BR-A5)
  const campusEmailConfig = await prisma.platformConfig.findUnique({
    where: { key: "requireCampusEmail" },
  });
  const requireCampusEmail =
    campusEmailConfig?.value === true || campusEmailConfig?.value === "true";
  if (requireCampusEmail && !user.isCampusEmail && !user.email.toLowerCase().endsWith(".ac.id")) {
    throw new OnboardingError(
      "Pendaftaran mahasiswa mewajibkan penggunaan akun Google dengan email institusi (.ac.id).",
      "CAMPUS_EMAIL_REQUIRED"
    );
  }

  // Validate referral code (BR-A2, BR-A3, BR-A4)
  const { referral, campus } = await validateReferralCode(input.referralCode, userId);

  // Execute in transaction
  return await prisma.$transaction(async (tx) => {
    // 1. Increment referral usedCount
    await tx.referralCode.update({
      where: { id: referral.id },
      data: { usedCount: { increment: 1 } },
    });

    // 2. Create ReferralRedemption
    await tx.referralRedemption.create({
      data: {
        codeId: referral.id,
        userId: user.id,
      },
    });

    // 3. Create StudentProfile
    const student = await tx.studentProfile.create({
      data: {
        userId: user.id,
        username: input.username.toLowerCase(),
        campusId: campus.id,
        studyProgram: input.studyProgram,
        roles: input.roles,
        bio: input.bio || null,
        avatarUrl: input.avatarUrl || user.image || null,
        skills: input.skills || [],
      },
      include: { campus: true },
    });

    // 4. Update User role
    await tx.user.update({
      where: { id: user.id },
      data: { role: "STUDENT" },
    });

    return student;
  });
}

/**
 * Completes UMKM onboarding: creates business profile, updates role, provisions free monthly quota
 */
export async function completeUmkmOnboarding(
  userId: string,
  input: UmkmOnboardingInput
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { umkm: true },
  });

  if (!user) {
    throw new OnboardingError("Pengguna tidak ditemukan.", "USER_NOT_FOUND");
  }

  if (user.umkm) {
    throw new OnboardingError("Profil UMKM sudah pernah dibuat.", "ALREADY_COMPLETED");
  }

  const periodKey = format(new Date(), "yyyy-MM");

  return await prisma.$transaction(async (tx) => {
    // 1. Create UmkmProfile
    const umkm = await tx.umkmProfile.create({
      data: {
        userId: user.id,
        businessName: input.businessName,
        category: input.category,
        province: input.province,
        city: input.city,
        description: input.description || null,
        phone: input.phone || null,
        logoUrl: input.logoUrl || null,
        isCampusPartner: false,
      },
    });

    // 2. Update User role
    await tx.user.update({
      where: { id: user.id },
      data: { role: "UMKM" },
    });

    // 3. Find Free package and provision monthly free subscription (BR-S1)
    const freePkg = await tx.package.findUnique({
      where: { code: "FREE" },
    });

    if (freePkg) {
      const now = new Date();
      const endsAt = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      await tx.subscription.create({
        data: {
          umkmId: umkm.id,
          packageId: freePkg.id,
          status: "ACTIVE",
          periodKey,
          startsAt: now,
          endsAt,
          quotaTotal: freePkg.jobQuota,
          quotaUsed: 0,
        },
      });
    }

    return umkm;
  });
}

/**
 * Gets user details and their associated profile
 */
export async function getUserWithProfile(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: {
        include: { campus: true },
      },
      umkm: {
        include: { partnerCampus: true },
      },
      redemption: {
        include: { code: true },
      },
    },
  });
}
