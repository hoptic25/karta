import type { PackageTier } from "@/generated/prisma/client";

export interface RankableJob {
  id: string;
  roleKey?: string;
  jobRole?: { key: string } | null;
  packageTier: PackageTier | null;
  deadlineAt: Date;
  publishedAt: Date | null;
  createdAt: Date;
}

/**
 * D-2 Ranking Rekomendasi (PRD §Modul D-2):
 *
 * score = roleMatch(40 jika job.roleKey ∈ student.roleKeys, else 0)
 *       + tierBoost(BASIC 0, PROFESSIONAL 10, PREMIUM 20, FREE 0)
 *       + urgency(hoursLeft ≤ 72 ? 20 × (1 − hoursLeft/72) : 0)
 *       + freshness(max(0, 20 − ageHours/6))
 */
export function calculateRecommendationScore(
  job: RankableJob,
  studentRoleKeys: string[],
  now: Date = new Date()
): number {
  // 1. Role Match (40 poin jika cocok)
  const roleKey = job.roleKey || job.jobRole?.key;
  const roleMatchScore = roleKey && studentRoleKeys.includes(roleKey) ? 40 : 0;

  // 2. Tier Boost (BASIC 0, PROFESSIONAL 10, PREMIUM 20, FREE 0)
  let tierBoostScore = 0;
  if (job.packageTier === "PROFESSIONAL") {
    tierBoostScore = 10;
  } else if (job.packageTier === "PREMIUM") {
    tierBoostScore = 20;
  }

  // 3. Urgency (hoursLeft <= 72 ? 20 * (1 - hoursLeft/72) : 0)
  const msLeft = job.deadlineAt.getTime() - now.getTime();
  const hoursLeft = Math.max(0, msLeft / (1000 * 60 * 60));
  let urgencyScore = 0;
  if (hoursLeft <= 72) {
    urgencyScore = 20 * (1 - hoursLeft / 72);
  }

  // 4. Freshness (max(0, 20 - ageHours/6))
  const baseTime = job.publishedAt || job.createdAt;
  const ageMs = Math.max(0, now.getTime() - baseTime.getTime());
  const ageHours = ageMs / (1000 * 60 * 60);
  const freshnessScore = Math.max(0, 20 - ageHours / 6);

  return roleMatchScore + tierBoostScore + urgencyScore + freshnessScore;
}

/**
 * Mengurutkan daftar pekerjaan berdasarkan skor rekomendasi secara deterministik.
 */
export function rankJobs<T extends RankableJob>(
  jobs: T[],
  studentRoleKeys: string[],
  now: Date = new Date()
): (T & { score: number })[] {
  const scored = jobs.map((job) => ({
    ...job,
    score: calculateRecommendationScore(job, studentRoleKeys, now),
  }));

  return scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Jika skor identik, urutkan berdasarkan deadline terdekat lalu publikasi terbaru
    if (a.deadlineAt.getTime() !== b.deadlineAt.getTime()) {
      return a.deadlineAt.getTime() - b.deadlineAt.getTime();
    }
    const aTime = (a.publishedAt || a.createdAt).getTime();
    const bTime = (b.publishedAt || b.createdAt).getTime();
    return bTime - aTime;
  });
}

