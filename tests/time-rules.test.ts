import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  expireOpenJobsPastCutoff,
  autoAcceptReviewPastSla,
  finalizeRejectionsPastDispute,
  autoReleaseUnstartedClaimedJobs,
  autoDeclineExpiredDeadlineRequests,
  runTimeRulesTick,
} from "../src/features/platform/time-rules";
import { prisma } from "../src/lib/db";

vi.mock("../src/lib/db", () => ({
  prisma: {
    job: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    jobAssignment: {
      update: vi.fn(),
    },
    subscription: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    quotaLedger: {
      create: vi.fn(),
    },
    ledgerEntry: {
      updateMany: vi.fn(),
    },
    studentProfile: {
      update: vi.fn(),
    },
    pointEvent: {
      create: vi.fn(),
    },
    notification: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    deadlineChangeRequest: {
      updateMany: vi.fn(),
    },
    imageAsset: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      if (typeof cb === "function") {
        return await cb(prisma);
      }
      return cb;
    }),
  },
}));

describe("Scheduled Time Rules & Cron Idempotency (PRD §13 Tasks 1-8)", () => {
  const baseNow = new Date("2026-11-02T12:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Tugas 1: expireOpenJobsPastCutoff", () => {
    it("should expire OPEN job when now is past cutoff time and restore quota", async () => {
      // DATA_ENTRY tier BASIC: minHours = 48
      // deadlineAt = baseNow + 24h -> cutoffTime = deadlineAt - 48h = baseNow - 24h
      // Because baseNow > cutoffTime, job must expire!
      const expiredJob = {
        id: "job-1",
        title: "Input Data",
        role: "DATA_ENTRY",
        packageTier: "BASIC",
        deadlineAt: new Date(baseNow.getTime() + 24 * 3600 * 1000),
        subscriptionId: "sub-1",
        umkm: { id: "umkm-1", userId: "umkm-user-1" },
      };

      vi.mocked(prisma.job.findMany).mockResolvedValue([expiredJob] as never);
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
        id: "sub-1",
        quotaUsed: 2,
      } as never);

      const count = await expireOpenJobsPastCutoff(baseNow);

      expect(count).toBe(1);
      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: "job-1" },
        data: { status: "EXPIRED" },
      });
      // Kuota dipulihkan (+1)
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: "sub-1" },
        data: { quotaUsed: { decrement: 1 } },
      });
      expect(prisma.quotaLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subscriptionId: "sub-1",
            delta: 1,
            jobId: "job-1",
          }),
        })
      );
    });

    it("should not expire OPEN job when cutoff time is still in the future", async () => {
      // DATA_ENTRY BASIC: minHours = 48
      // deadlineAt = baseNow + 100h -> cutoffTime = deadlineAt - 48h = baseNow + 52h
      // baseNow < cutoffTime -> job remains OPEN
      const validJob = {
        id: "job-valid",
        title: "Input Data",
        role: "DATA_ENTRY",
        packageTier: "BASIC",
        deadlineAt: new Date(baseNow.getTime() + 100 * 3600 * 1000),
        subscriptionId: "sub-1",
        umkm: { id: "umkm-1", userId: "umkm-user-1" },
      };

      vi.mocked(prisma.job.findMany).mockResolvedValue([validJob] as never);

      const count = await expireOpenJobsPastCutoff(baseNow);
      expect(count).toBe(0);
      expect(prisma.job.update).not.toHaveBeenCalled();
    });
  });

  describe("Tugas 2: autoAcceptReviewPastSla", () => {
    it("should auto-accept SUBMITTED job when reviewDueAt < now", async () => {
      const overdueJob = {
        id: "job-submitted-1",
        title: "Desain Banner",
        revisionCount: 0,
        umkm: { id: "umkm-1", userId: "umkm-user-1" },
        assignments: [
          {
            id: "assign-1",
            student: {
              id: "student-1",
              userId: "student-user-1",
              points: 30,
              level: "NEWCOMER",
            },
          },
        ],
        submissions: [
          {
            id: "sub-1",
            number: 1,
            isLate: false,
          },
        ],
      };

      vi.mocked(prisma.job.findMany).mockResolvedValue([overdueJob] as never);

      const count = await autoAcceptReviewPastSla(baseNow);

      expect(count).toBe(1);
      // Job ACCEPTED with autoAccepted=true
      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: "job-submitted-1" },
        data: {
          status: "ACCEPTED",
          autoAccepted: true,
        },
      });

      // Assignment COMPLETED
      expect(prisma.jobAssignment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "assign-1" },
          data: expect.objectContaining({ status: "COMPLETED" }),
        })
      );

      // Ledger RESERVED -> PAYABLE
      expect(prisma.ledgerEntry.updateMany).toHaveBeenCalledWith({
        where: {
          jobId: "job-submitted-1",
          type: "STUDENT_SHARE",
          status: "RESERVED",
        },
        data: { status: "PAYABLE" },
      });

      // Poin reputasi bertambah: 30 + 10 + 3 (no rev) + 2 (on time) = 45
      expect(prisma.studentProfile.update).toHaveBeenCalledWith({
        where: { id: "student-1" },
        data: {
          points: 45,
          level: "NEWCOMER",
          completedJobs: { increment: 1 },
        },
      });
    });
  });

  describe("Tugas 3: finalizeRejectionsPastDispute", () => {
    it("should finalize rejection and void ledger for REJECTED jobs past disputeUntil without dispute", async () => {
      vi.mocked(prisma.job.findMany).mockResolvedValue([{ id: "job-rejected-1" }] as never);

      const count = await finalizeRejectionsPastDispute(baseNow);

      expect(count).toBe(1);
      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: "job-rejected-1" },
        data: { rejectionFinalAt: baseNow },
      });
      expect(prisma.ledgerEntry.updateMany).toHaveBeenCalledWith({
        where: {
          jobId: "job-rejected-1",
          status: "HELD",
        },
        data: { status: "VOIDED" },
      });
    });
  });

  describe("Tugas 6: autoReleaseUnstartedClaimedJobs (BR-C6)", () => {
    it("should release CLAIMED jobs unstarted after 24h back to OPEN and void ledger", async () => {
      const unstartedJob = {
        id: "job-claimed-1",
        title: "Social Media Post",
        umkm: { userId: "umkm-user-1" },
        assignments: [
          {
            id: "assign-1",
            student: { userId: "student-user-1" },
          },
        ],
      };

      vi.mocked(prisma.job.findMany).mockResolvedValue([unstartedJob] as never);

      const count = await autoReleaseUnstartedClaimedJobs(baseNow);

      expect(count).toBe(1);
      // Job kembali ke OPEN
      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: "job-claimed-1" },
        data: { status: "OPEN" },
      });
      // Assignment menjadi WITHDRAWN
      expect(prisma.jobAssignment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "assign-1" },
          data: expect.objectContaining({ status: "WITHDRAWN" }),
        })
      );
      // Saldo RESERVED di-VOIDED
      expect(prisma.ledgerEntry.updateMany).toHaveBeenCalledWith({
        where: {
          jobId: "job-claimed-1",
          assignmentId: "assign-1",
          status: "RESERVED",
        },
        data: { status: "VOIDED" },
      });
    });
  });

  describe("Tugas 7: autoDeclineExpiredDeadlineRequests", () => {
    it("should auto-decline pending deadline requests older than 3 days", async () => {
      vi.mocked(prisma.deadlineChangeRequest.updateMany).mockResolvedValue({ count: 3 } as never);

      const count = await autoDeclineExpiredDeadlineRequests(baseNow);
      expect(count).toBe(3);
      expect(prisma.deadlineChangeRequest.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "DECLINED",
          }),
        })
      );
    });
  });

  describe("Master Runner: runTimeRulesTick", () => {
    it("should run all 8 tasks and return consolidated result", async () => {
      vi.mocked(prisma.job.findMany).mockResolvedValue([]);
      vi.mocked(prisma.subscription.findMany).mockResolvedValue([]);
      vi.mocked(prisma.deadlineChangeRequest.updateMany).mockResolvedValue({ count: 0 } as never);
      vi.mocked(prisma.imageAsset.deleteMany).mockResolvedValue({ count: 0 } as never);

      const result = await runTimeRulesTick(baseNow);

      expect(result).toEqual({
        expiredOpenJobs: 0,
        autoAcceptedJobs: 0,
        finalizedRejections: 0,
        expiredSubscriptions: 0,
        remindersSent: 0,
        autoReleasedClaims: 0,
        autoDeclinedDeadlineRequests: 0,
        cleanedOrphanAssets: 0,
      });
    });
  });
});

