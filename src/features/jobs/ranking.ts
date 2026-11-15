import type { PackageTier } from "@/generated/prisma/client";

export interface RankableJob {
  id: string;
  roleKey?: string;
  jobRole?: { key: string } | null;
  packageTier: PackageTier | null;
  deadlineAt: Date;
  publishedAt: Date | null;
  createdAt: Date;
  beginnerFriendly?: boolean;
}

/**
 * SmartMatch™ Engine (D-2 Ranking Rekomendasi):
 *
 * Mengkalkulasi skor kompatibilitas (0 - 100) berbasis multi-faktor:
 * 1. Role / Keahlian Match (Maks 45 poin):
 *    - Jika cocok dengan role minat mahasiswa = +45
 * 2. Tier & Value Fit (Maks 20 poin):
 *    - ULTRA (PREMIUM): +20
 *    - PLUS (PROFESSIONAL): +15
 *    - PRO (BASIC): +10
 *    - FREE: +5
 * 3. Urgensi / Waktu Tersisa (Maks 15 poin):
 *    - Memberi prioritas pada tugas yang aktif dan butuh segera diklaim
 * 4. Freshness / Kebaruan Publikasi (Maks 10 poin):
 *    - Pekerjaan baru diterbitkan mendapatkan prioritas
 * 5. Beginner Friendly Boost (Maks 10 poin):
 *    - Tugas ramah mahasiswa baru mendapat dorongan aksesibilitas
 */
export function calculateRecommendationScore(
  job: RankableJob,
  studentRoleKeys: string[],
  now: Date = new Date()
): number {
  // 1. Role Match (45 poin)
  const roleKey = job.roleKey || job.jobRole?.key;
  const roleMatchScore = roleKey && studentRoleKeys.includes(roleKey) ? 45 : 0;

  // 2. Tier Boost (Maks 20 poin)
  let tierBoostScore = 5;
  if (job.packageTier === "PREMIUM") {
    tierBoostScore = 20;
  } else if (job.packageTier === "PROFESSIONAL") {
    tierBoostScore = 15;
  } else if (job.packageTier === "BASIC") {
    tierBoostScore = 10;
  }

  // 3. Urgency (hoursLeft <= 72 ? 15 * (1 - hoursLeft/72) : 0)
  const msLeft = job.deadlineAt.getTime() - now.getTime();
  const hoursLeft = Math.max(0, msLeft / (1000 * 60 * 60));
  let urgencyScore = 0;
  if (hoursLeft <= 72) {
    urgencyScore = 15 * (1 - hoursLeft / 72);
  }

  // 4. Freshness (max(0, 10 - ageHours/12))
  const baseTime = job.publishedAt || job.createdAt;
  const ageMs = Math.max(0, now.getTime() - baseTime.getTime());
  const ageHours = ageMs / (1000 * 60 * 60);
  const freshnessScore = Math.max(0, 10 - ageHours / 12);

  // 5. Friendly accessibility (10 poin)
  const friendlyScore = job.beginnerFriendly ? 10 : 5;

  const totalRaw = roleMatchScore + tierBoostScore + urgencyScore + freshnessScore + friendlyScore;
  return Math.min(99, Math.max(50, Math.round(totalRaw)));
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

