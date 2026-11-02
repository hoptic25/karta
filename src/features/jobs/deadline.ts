import { prisma } from "@/lib/db";
import type { JobRole, PackageTier } from "@/generated/prisma/client";

export class DeadlineError extends Error {
  code: string;
  constructor(message: string, code = "DEADLINE_ERROR") {
    super(message);
    this.name = "DeadlineError";
    this.code = code;
  }
}

/**
 * Default fallback matrix per PRD §15.2:
 * FREE tier memakai nilai BASIC (BR-J3).
 */
export const DEFAULT_DEADLINE_RULES: Record<JobRole, Record<"BASIC" | "PROFESSIONAL" | "PREMIUM", number>> = {
  DATA_ENTRY: { BASIC: 48, PROFESSIONAL: 36, PREMIUM: 24 },
  CONTENT_WRITER: { BASIC: 72, PROFESSIONAL: 48, PREMIUM: 36 },
  GRAPHIC_DESIGNER: { BASIC: 72, PROFESSIONAL: 48, PREMIUM: 36 },
  SOCIAL_MEDIA: { BASIC: 72, PROFESSIONAL: 48, PREMIUM: 36 },
  VIDEO_EDITOR: { BASIC: 120, PROFESSIONAL: 96, PREMIUM: 72 },
  UIUX_DESIGNER: { BASIC: 120, PROFESSIONAL: 96, PREMIUM: 72 },
  FRONTEND_DEV: { BASIC: 168, PROFESSIONAL: 120, PREMIUM: 96 },
};

/**
 * Normalizes tier: FREE becomes BASIC (BR-J3)
 */
export function normalizeTierForDeadline(tier: PackageTier): "BASIC" | "PROFESSIONAL" | "PREMIUM" {
  if (tier === "FREE") return "BASIC";
  return tier;
}

/**
 * Mendapatkan minimum jam pengerjaan untuk role dan tier tertentu.
 * Mencoba query DB `DeadlineRule`, dan fallback ke tabel PRD §15.2.
 */
export async function getMinDeadlineHours(role: JobRole, tier: PackageTier): Promise<number> {
  const effectiveTier = normalizeTierForDeadline(tier);

  try {
    const rule = await prisma.deadlineRule.findUnique({
      where: {
        role_tier: {
          role,
          tier: effectiveTier,
        },
      },
    });

    if (rule?.minHours) {
      return rule.minHours;
    }
  } catch {
    // Database fallback
  }

  return DEFAULT_DEADLINE_RULES[role]?.[effectiveTier] ?? 48;
}

/**
 * Sinkron get min hours dari default fallback matrix (cocok untuk client / validasi cepat).
 */
export function getMinDeadlineHoursSync(role: JobRole, tier: PackageTier): number {
  const effectiveTier = normalizeTierForDeadline(tier);
  return DEFAULT_DEADLINE_RULES[role]?.[effectiveTier] ?? 48;
}

export const getMinimumDeadlineHours = getMinDeadlineHoursSync;

/**
 * Memvalidasi apakah deadlineAt memenuhi batas minimum waktu pengerjaan (BR-J3).
 * deadlineAt >= baseTime + minHours.
 */
export async function assertValidDeadline(
  role: JobRole,
  tier: PackageTier,
  deadlineAt: Date,
  baseTime: Date = new Date()
): Promise<number> {
  const minHours = await getMinDeadlineHours(role, tier);
  const minRequiredTime = new Date(baseTime.getTime() + minHours * 60 * 60 * 1000);

  if (deadlineAt.getTime() < minRequiredTime.getTime()) {
    throw new DeadlineError(
      `Tenggat waktu terlalu dekat. Untuk peran ${role} dan paket ${tier}, tenggat minimum adalah ${minHours} jam sejak publikasi (minimal ${minRequiredTime.toLocaleString("id-ID")}).`,
      "DEADLINE_TOO_SHORT"
    );
  }

  return minHours;
}

/**
 * Menghitung batas waktu terakhir pekerjaan masih boleh diklaim (BR-J5).
 * job tidak bisa diklaim bila now > deadlineAt - minHours.
 */
export function getClaimCutoffTime(
  deadlineAt: Date,
  role: JobRole,
  tier: PackageTier
): Date {
  const minHours = getMinDeadlineHoursSync(role, tier);
  return new Date(deadlineAt.getTime() - minHours * 60 * 60 * 1000);
}

/**
 * Mengecek apakah pekerjaan masih dapat diklaim mahasiswa saat ini (BR-J5).
 */
export function isJobClaimableByDeadline(
  job: {
    deadlineAt: Date;
    role: JobRole;
    packageTier: PackageTier | null;
  },
  now: Date = new Date()
): boolean {
  const tier = job.packageTier || "BASIC";
  const cutoff = getClaimCutoffTime(job.deadlineAt, job.role, tier);
  return now.getTime() <= cutoff.getTime();
}

