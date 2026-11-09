import { describe, it, expect } from "vitest";
import type { PackageTier } from "@/generated/prisma/client";
import {
  calculateRecommendationScore,
  rankJobs,
  type RankableJob,
} from "../src/features/jobs/ranking";

describe("Job Ranking Recommendation (PRD §Modul D-2)", () => {
  const baseNow = new Date("2026-11-02T12:00:00Z");

  it("should calculate exact score with full matching criteria", () => {
    // Role match: DATA_ENTRY in ["DATA_ENTRY"] -> 40
    // Tier boost: PREMIUM -> 20
    // Urgency: deadline in 36 hours (<= 72) -> 20 * (1 - 36/72) = 10
    // Freshness: published 6 hours ago -> max(0, 20 - 6/6) = 19
    // Total expected = 40 + 20 + 10 + 19 = 89
    const job: RankableJob = {
      id: "job-1",
      roleKey: "DATA_ENTRY",
      packageTier: "PREMIUM",
      deadlineAt: new Date(baseNow.getTime() + 36 * 60 * 60 * 1000),
      publishedAt: new Date(baseNow.getTime() - 6 * 60 * 60 * 1000),
      createdAt: new Date(baseNow.getTime() - 6 * 60 * 60 * 1000),
    };

    const score = calculateRecommendationScore(job, ["DATA_ENTRY"], baseNow);
    expect(score).toBeCloseTo(89, 2);
  });

  it("should give 0 for roleMatch when student does not have the job role", () => {
    const job: RankableJob = {
      id: "job-2",
      roleKey: "FRONTEND_DEV",
      packageTier: "BASIC",
      deadlineAt: new Date(baseNow.getTime() + 100 * 60 * 60 * 1000), // > 72 hours -> urgency = 0
      publishedAt: baseNow, // age 0 -> freshness = 20
      createdAt: baseNow,
    };

    // Role mismatch -> 0
    // Tier BASIC -> 0
    // Urgency (> 72h) -> 0
    // Freshness -> 20
    // Total = 20
    const score = calculateRecommendationScore(job, ["DATA_ENTRY", "CONTENT_WRITER"], baseNow);
    expect(score).toBeCloseTo(20, 2);
  });

  it("should give correct tier boosts", () => {
    const createJobWithTier = (tier: PackageTier | null): RankableJob => ({
      id: `job-${tier}`,
      roleKey: "DATA_ENTRY",
      packageTier: tier,
      deadlineAt: new Date(baseNow.getTime() + 100 * 60 * 60 * 1000), // 0 urgency
      publishedAt: new Date(baseNow.getTime() - 120 * 60 * 60 * 1000), // age 120h -> 20 - 20 = 0 freshness
      createdAt: new Date(baseNow.getTime() - 120 * 60 * 60 * 1000),
    });

    const scoreFree = calculateRecommendationScore(createJobWithTier("FREE"), [], baseNow);
    const scoreBasic = calculateRecommendationScore(createJobWithTier("BASIC"), [], baseNow);
    const scorePro = calculateRecommendationScore(createJobWithTier("PROFESSIONAL"), [], baseNow);
    const scorePremium = calculateRecommendationScore(createJobWithTier("PREMIUM"), [], baseNow);

    expect(scoreFree).toBe(0);
    expect(scoreBasic).toBe(0);
    expect(scorePro).toBe(10);
    expect(scorePremium).toBe(20);
  });

  it("should sort jobs properly with rankJobs", () => {
    const jobs: RankableJob[] = [
      {
        id: "low-match",
        roleKey: "VIDEO_EDITOR",
        packageTier: "BASIC",
        deadlineAt: new Date(baseNow.getTime() + 100 * 60 * 60 * 1000),
        publishedAt: new Date(baseNow.getTime() - 24 * 60 * 60 * 1000),
        createdAt: new Date(baseNow.getTime() - 24 * 60 * 60 * 1000),
      },
      {
        id: "high-match",
        roleKey: "DATA_ENTRY",
        packageTier: "PREMIUM",
        deadlineAt: new Date(baseNow.getTime() + 24 * 60 * 60 * 1000),
        publishedAt: baseNow,
        createdAt: baseNow,
      },
      {
        id: "mid-match",
        roleKey: "DATA_ENTRY",
        packageTier: "BASIC",
        deadlineAt: new Date(baseNow.getTime() + 48 * 60 * 60 * 1000),
        publishedAt: new Date(baseNow.getTime() - 6 * 60 * 60 * 1000),
        createdAt: new Date(baseNow.getTime() - 6 * 60 * 60 * 1000),
      },
    ];

    const ranked = rankJobs(jobs, ["DATA_ENTRY"], baseNow);
    expect(ranked[0].id).toBe("high-match");
    expect(ranked[1].id).toBe("mid-match");
    expect(ranked[2].id).toBe("low-match");
  });
});

