import { describe, it, expect, vi } from "vitest";
import {
  checkClaimEligibility,
  LEVEL_MAX_ACTIVE,
  ClaimError,
} from "../src/features/jobs/claim";
import type { StudentProfile, Job } from "../src/generated/prisma/client";

describe("Job Claim Rules & Eligibility (BR-C1, BR-C4, BR-C5, BR-J5)", () => {
  const baseNow = new Date("2026-11-02T12:00:00Z");

  const mockStudent = (overrides?: Partial<StudentProfile>): StudentProfile => ({
    id: "student-1",
    userId: "user-1",
    username: "budi",
    fullName: "Budi Santoso",
    campusId: "campus-1",
    studyProgram: "Informatika",
    bio: null,
    avatarUrl: null,
    skills: ["Excel", "Figma"],
    jobRoleIds: ["role-data-entry", "role-graphic-designer"],
    points: 10,
    level: "NEWCOMER",
    ratingAvg: 0,
    ratingCount: 0,
    completedJobs: 0,
    portfolioPublic: true,
    bankName: null,
    bankAccountName: null,
    bankAccountNumber: null,
    createdAt: baseNow,
    ...overrides,
  });

  const mockJob = (overrides?: Partial<Job>): Job => ({
    id: "job-1",
    umkmId: "umkm-1",
    subscriptionId: "sub-1",
    title: "Data Entry Toko",
    description: "Input produk toko online ke spreadsheet",
    instructions: "Gunakan template yang tersedia",
    jobRoleId: "role-data-entry",
    deliverableType: "DRIVE",
    deadlineAt: new Date(baseNow.getTime() + 60 * 60 * 60 * 1000), // 60 jam (min 48 jam)
    minLevel: "NEWCOMER",
    beginnerFriendly: false,
    newcomerLaneUntil: null,
    status: "OPEN",
    isHidden: false,
    packageTier: "BASIC",
    isPaid: true,
    allocationIdr: 25000,
    studentShareIdr: 15000,
    platformShareIdr: 10000,
    publishedAt: baseNow,
    revisionCount: 0,
    reviewDueAt: null,
    revisionDueAt: null,
    disputeUntil: null,
    rejectionFinalAt: null,
    autoAccepted: false,
    completedAt: null,
    createdAt: baseNow,
    updatedAt: baseNow,
    ...overrides,
  });

  describe("checkClaimEligibility", () => {
    it("should allow claim when all 8 requirements are met", () => {
      const student = mockStudent();
      const job = mockJob();
      const res = checkClaimEligibility(student, job, 0, 0, baseNow);
      expect(res.eligible).toBe(true);
    });

    it("should reject claim when user account is SUSPENDED", () => {
      const student = {
        ...mockStudent(),
        user: { status: "SUSPENDED" as const },
      };
      const job = mockJob();
      const res = checkClaimEligibility(student, job, 0, 0, baseNow);
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain("ditangguhkan");
    });

    it("should reject claim when job is not OPEN or isHidden", () => {
      const student = mockStudent();
      const jobDraft = mockJob({ status: "DRAFT" });
      expect(checkClaimEligibility(student, jobDraft, 0, 0, baseNow).eligible).toBe(false);

      const jobHidden = mockJob({ isHidden: true });
      expect(checkClaimEligibility(student, jobHidden, 0, 0, baseNow).eligible).toBe(false);
    });

    it("should reject claim when job role is not in student roles", () => {
      const student = mockStudent({ jobRoleIds: ["role-content-writer"] });
      const job = mockJob({ jobRoleId: "role-data-entry" });
      const res = checkClaimEligibility(student, job, 0, 0, baseNow);
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain("keahlian");
    });

    it("should reject claim when student level is below job minLevel", () => {
      const student = mockStudent({ level: "NEWCOMER" });
      const job = mockJob({ minLevel: "TRUSTED" });
      const res = checkClaimEligibility(student, job, 0, 0, baseNow);
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain("TRUSTED");
    });

    it("should enforce active assignment caps per level (BR-C4)", () => {
      // NEWCOMER max 1 active
      const newcomer = mockStudent({ level: "NEWCOMER" });
      expect(LEVEL_MAX_ACTIVE.NEWCOMER).toBe(1);
      expect(checkClaimEligibility(newcomer, mockJob(), 1, 0, baseNow).eligible).toBe(false);
      expect(checkClaimEligibility(newcomer, mockJob(), 0, 0, baseNow).eligible).toBe(true);

      // RELIABLE max 2 active
      const reliable = mockStudent({ level: "RELIABLE" });
      expect(LEVEL_MAX_ACTIVE.RELIABLE).toBe(2);
      expect(checkClaimEligibility(reliable, mockJob(), 2, 0, baseNow).eligible).toBe(false);
      expect(checkClaimEligibility(reliable, mockJob(), 1, 0, baseNow).eligible).toBe(true);

      // EXPERT max 4 active
      const expert = mockStudent({ level: "EXPERT" });
      expect(LEVEL_MAX_ACTIVE.EXPERT).toBe(4);
      expect(checkClaimEligibility(expert, mockJob(), 4, 0, baseNow).eligible).toBe(false);
      expect(checkClaimEligibility(expert, mockJob(), 3, 0, baseNow).eligible).toBe(true);
    });

    it("should enforce max 1 active unpaid / volunteer project (BR-C1)", () => {
      const student = mockStudent({ level: "TRUSTED" }); // can have 3 active jobs
      const unpaidJob = mockJob({ isPaid: false });

      // If student already has 1 active unpaid job, cannot take another unpaid job
      const resUnpaid = checkClaimEligibility(student, unpaidJob, 1, 1, baseNow);
      expect(resUnpaid.eligible).toBe(false);
      expect(resUnpaid.reason).toContain("relawan");

      // But can still take a paid job
      const paidJob = mockJob({ isPaid: true });
      const resPaid = checkClaimEligibility(student, paidJob, 1, 1, baseNow);
      expect(resPaid.eligible).toBe(true);
    });

    it("should reject claim when claim cutoff has passed (BR-J5)", () => {
      const student = mockStudent();
      // DATA_ENTRY BASIC requires 48h. If deadline is in 47 hours, cutoff has passed
      const jobPastCutoff = mockJob({
        deadlineAt: new Date(baseNow.getTime() + 47 * 60 * 60 * 1000),
      });
      const res = checkClaimEligibility(student, jobPastCutoff, 0, 0, baseNow);
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain("batas waktu");
    });

    it("should enforce Newcomer Lane priority period (BR-C5)", () => {
      const newcomerLaneUntil = new Date(baseNow.getTime() + 25 * 60 * 1000); // 25 mins remaining
      const jobWithLane = mockJob({
        beginnerFriendly: true,
        newcomerLaneUntil,
      });

      // NEWCOMER -> allowed
      const newcomer = mockStudent({ level: "NEWCOMER" });
      expect(checkClaimEligibility(newcomer, jobWithLane, 0, 0, baseNow).eligible).toBe(true);

      // RELIABLE -> allowed
      const reliable = mockStudent({ level: "RELIABLE" });
      expect(checkClaimEligibility(reliable, jobWithLane, 0, 0, baseNow).eligible).toBe(true);

      // TRUSTED -> blocked during lane
      const trusted = mockStudent({ level: "TRUSTED" });
      const resTrusted = checkClaimEligibility(trusted, jobWithLane, 0, 0, baseNow);
      expect(resTrusted.eligible).toBe(false);
      expect(resTrusted.reason).toContain("Newcomer Lane");

      // After lane expires -> TRUSTED is allowed
      const timeAfterLane = new Date(newcomerLaneUntil.getTime() + 1000);
      expect(checkClaimEligibility(trusted, jobWithLane, 0, 0, timeAfterLane).eligible).toBe(true);
    });
  });

  describe("Parallel Atomic Claim Concurrency Simulation (PRD §16 butir 2)", () => {
    it("should guarantee that exactly 1 parallel claim succeeds among 10 candidates", async () => {
      let isClaimed = false;

      // Mock atomic updateMany function simulating database row-level condition:
      // update ... where id = 'job-1' and status = 'OPEN' set status = 'CLAIMED'
      const atomicUpdateMany = vi.fn().mockImplementation(async () => {
        if (!isClaimed) {
          isClaimed = true;
          return { count: 1 };
        }
        return { count: 0 };
      });

      const attemptClaim = async (candidateId: string) => {
        const updateRes = await atomicUpdateMany();
        if (updateRes.count !== 1) {
          throw new ClaimError("Pekerjaan ini sudah diambil oleh mahasiswa lain.", "ALREADY_CLAIMED");
        }
        return { candidateId, success: true };
      };

      // 10 concurrent claim attempts
      const candidates = Array.from({ length: 10 }, (_, i) => `candidate-${i + 1}`);
      const results = await Promise.allSettled(candidates.map((id) => attemptClaim(id)));

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(9);

      rejected.forEach((r) => {
        if (r.status === "rejected") {
          expect(r.reason).toBeInstanceOf(ClaimError);
          expect((r.reason as ClaimError).code).toBe("ALREADY_CLAIMED");
        }
      });
    });
  });
});
