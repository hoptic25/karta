import "dotenv/config";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PackageSegment,
  PackageTier,
  JobRole,
} from "../src/generated/prisma/enums";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL must be defined for seeding.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Seed Packages (§15.1)
  const packages = [
    {
      code: "FREE",
      name: "Paket Gratis (Bulanan)",
      segment: PackageSegment.FREE,
      tier: PackageTier.FREE,
      priceIdr: 0,
      jobQuota: 3,
      allocationPerJobIdr: 0,
      durationDays: 30,
      isPaidJobs: false,
      sortOrder: 0,
    },
    {
      code: "PARTNER_BASIC",
      name: "Mitra Basic",
      segment: PackageSegment.PARTNER,
      tier: PackageTier.BASIC,
      priceIdr: 75_000,
      jobQuota: 3,
      allocationPerJobIdr: 25_000,
      durationDays: 30,
      isPaidJobs: true,
      sortOrder: 1,
    },
    {
      code: "PARTNER_PROFESSIONAL",
      name: "Mitra Professional",
      segment: PackageSegment.PARTNER,
      tier: PackageTier.PROFESSIONAL,
      priceIdr: 180_000,
      jobQuota: 6,
      allocationPerJobIdr: 30_000,
      durationDays: 30,
      isPaidJobs: true,
      sortOrder: 2,
    },
    {
      code: "PARTNER_PREMIUM",
      name: "Mitra Premium",
      segment: PackageSegment.PARTNER,
      tier: PackageTier.PREMIUM,
      priceIdr: 480_000,
      jobQuota: 12,
      allocationPerJobIdr: 40_000,
      durationDays: 30,
      isPaidJobs: true,
      sortOrder: 3,
    },
    {
      code: "NON_PARTNER_BASIC",
      name: "Reguler Basic",
      segment: PackageSegment.NON_PARTNER,
      tier: PackageTier.BASIC,
      priceIdr: 90_000,
      jobQuota: 3,
      allocationPerJobIdr: 30_000,
      durationDays: 30,
      isPaidJobs: true,
      sortOrder: 4,
    },
    {
      code: "NON_PARTNER_PROFESSIONAL",
      name: "Reguler Professional",
      segment: PackageSegment.NON_PARTNER,
      tier: PackageTier.PROFESSIONAL,
      priceIdr: 216_000,
      jobQuota: 6,
      allocationPerJobIdr: 36_000,
      durationDays: 30,
      isPaidJobs: true,
      sortOrder: 5,
    },
    {
      code: "NON_PARTNER_PREMIUM",
      name: "Reguler Premium",
      segment: PackageSegment.NON_PARTNER,
      tier: PackageTier.PREMIUM,
      priceIdr: 576_000,
      jobQuota: 12,
      allocationPerJobIdr: 48_000,
      durationDays: 30,
      isPaidJobs: true,
      sortOrder: 6,
    },
  ];

  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { code: pkg.code },
      update: pkg,
      create: pkg,
    });
  }
  console.log(`✅ Seeded ${packages.length} packages`);

  // 2. Seed DeadlineRule (§15.2)
  const deadlineRules = [
    { role: JobRole.DATA_ENTRY, tier: PackageTier.BASIC, minHours: 48 },
    { role: JobRole.DATA_ENTRY, tier: PackageTier.PROFESSIONAL, minHours: 36 },
    { role: JobRole.DATA_ENTRY, tier: PackageTier.PREMIUM, minHours: 24 },

    { role: JobRole.CONTENT_WRITER, tier: PackageTier.BASIC, minHours: 72 },
    { role: JobRole.CONTENT_WRITER, tier: PackageTier.PROFESSIONAL, minHours: 48 },
    { role: JobRole.CONTENT_WRITER, tier: PackageTier.PREMIUM, minHours: 36 },

    { role: JobRole.GRAPHIC_DESIGNER, tier: PackageTier.BASIC, minHours: 72 },
    { role: JobRole.GRAPHIC_DESIGNER, tier: PackageTier.PROFESSIONAL, minHours: 48 },
    { role: JobRole.GRAPHIC_DESIGNER, tier: PackageTier.PREMIUM, minHours: 36 },

    { role: JobRole.SOCIAL_MEDIA, tier: PackageTier.BASIC, minHours: 72 },
    { role: JobRole.SOCIAL_MEDIA, tier: PackageTier.PROFESSIONAL, minHours: 48 },
    { role: JobRole.SOCIAL_MEDIA, tier: PackageTier.PREMIUM, minHours: 36 },

    { role: JobRole.VIDEO_EDITOR, tier: PackageTier.BASIC, minHours: 120 },
    { role: JobRole.VIDEO_EDITOR, tier: PackageTier.PROFESSIONAL, minHours: 96 },
    { role: JobRole.VIDEO_EDITOR, tier: PackageTier.PREMIUM, minHours: 72 },

    { role: JobRole.UIUX_DESIGNER, tier: PackageTier.BASIC, minHours: 120 },
    { role: JobRole.UIUX_DESIGNER, tier: PackageTier.PROFESSIONAL, minHours: 96 },
    { role: JobRole.UIUX_DESIGNER, tier: PackageTier.PREMIUM, minHours: 72 },

    { role: JobRole.FRONTEND_DEV, tier: PackageTier.BASIC, minHours: 168 },
    { role: JobRole.FRONTEND_DEV, tier: PackageTier.PROFESSIONAL, minHours: 120 },
    { role: JobRole.FRONTEND_DEV, tier: PackageTier.PREMIUM, minHours: 96 },
  ];

  for (const rule of deadlineRules) {
    await prisma.deadlineRule.upsert({
      where: {
        role_tier: {
          role: rule.role,
          tier: rule.tier,
        },
      },
      update: { minHours: rule.minHours },
      create: rule,
    });
  }
  console.log(`✅ Seeded ${deadlineRules.length} deadline rules`);

  // 3. Seed PlatformConfig (§15.3)
  const configs: Record<string, unknown> = {
    studentSharePct: 60,
    freeQuotaPerMonth: 3,
    maxRevisions: 2,
    reviewSlaDays: 3,
    revisionWindowDays: 3,
    disputeWindowDays: 3,
    failureGraceHours: 12,
    startWithinHours: 24,
    newcomerLaneMinutes: 30,
    ratingWindowDays: 14,
    minWithdrawalIdr: 50_000,
    requireCampusEmail: false,
    levelThresholds: {
      RELIABLE: 50,
      TRUSTED: 150,
      EXPERT: 300,
    },
    levelCaps: {
      NEWCOMER: 1,
      RELIABLE: 2,
      TRUSTED: 3,
      EXPERT: 4,
    },
    points: {
      accept: 10,
      noRevision: 3,
      onTime: 2,
      highRating: 2,
      failure: -15,
    },
    linkWhitelist: [
      "drive.google.com",
      "docs.google.com",
      "figma.com",
      "github.com",
      "canva.com",
      "notion.so",
      "notion.site",
      "youtube.com",
      "youtu.be",
      "behance.net",
      "dribbble.com",
    ],
    paymentInstructions:
      "Silakan transfer sesuai nominal paket ke rekening BCA 1234567890 a.n. PT Karta Digital Bangsa. Admin akan memverifikasi dan mengaktifkan kuota paket Anda dalam 1x24 jam.",
    imageMaxBytes: 2097152, // 2MB
    jobImagesMax: 3,
    imageUploadsPerHour: 10,
    imageAllowedTypes: ["image/jpeg", "image/png", "image/webp"],
  };

  for (const [key, value] of Object.entries(configs)) {
    await prisma.platformConfig.upsert({
      where: { key },
      update: { value: value as Prisma.InputJsonValue },
      create: { key, value: value as Prisma.InputJsonValue },
    });
  }
  console.log(`✅ Seeded ${Object.keys(configs).length} platform configs`);

  // 4. Seed Initial Campuses & Referral Codes (§15.4)
  const itb = await prisma.campus.upsert({
    where: { name: "Institut Teknologi Bandung" },
    update: {},
    create: {
      name: "Institut Teknologi Bandung",
      city: "Bandung",
      province: "Jawa Barat",
      isActive: true,
    },
  });

  const ugm = await prisma.campus.upsert({
    where: { name: "Universitas Gadjah Mada" },
    update: {},
    create: {
      name: "Universitas Gadjah Mada",
      city: "Yogyakarta",
      province: "D.I. Yogyakarta",
      isActive: true,
    },
  });

  await prisma.referralCode.upsert({
    where: { code: "ITBJUARA" },
    update: {},
    create: {
      code: "ITBJUARA",
      campusId: itb.id,
      isActive: true,
      maxUses: null,
    },
  });

  await prisma.referralCode.upsert({
    where: { code: "UGMHEBAT" },
    update: {},
    create: {
      code: "UGMHEBAT",
      campusId: ugm.id,
      isActive: true,
      maxUses: 100,
    },
  });

  console.log("✅ Seeded initial campuses and referral codes");
  console.log("🎉 Seed finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
