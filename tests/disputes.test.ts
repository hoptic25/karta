import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  openDispute,
  resolveDisputeByAdmin,
} from "../src/features/jobs/disputes";
import { prisma } from "../src/lib/db";

vi.mock("../src/lib/db", () => ({
  prisma: {
    studentProfile: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    job: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    jobAssignment: {
      update: vi.fn(),
    },
    ledgerEntry: {
      updateMany: vi.fn(),
    },
    pointEvent: {
      create: vi.fn(),
    },
    dispute: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      if (typeof cb === "function") {
        return await cb(prisma);
      }
      return cb;
    }),
  },
}));

describe("Disputes System (PRD §6.6 BR-D1, BR-D2, BR-D3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("BR-D1: Mahasiswa Mengajukan Sengketa (openDispute)", () => {
    it("should reject dispute if reason is less than 30 characters", async () => {
      await expect(
        openDispute("job-1", "user-1", {
          reason: "Tugas saya bagus kok", // Kurang dari 30 karakter
        })
      ).rejects.toThrow(/minimal 30 karakter/);
    });

    it("should reject dispute if evidence URL is outside whitelist", async () => {
      await expect(
        openDispute("job-1", "user-1", {
          reason: "Karya saya telah memenuhi seluruh instruksi brief secara lengkap dan rapi.",
          evidenceUrl: "https://unknown-untrusted-site.com/file.zip",
        })
      ).rejects.toThrow(/harus berupa URL Google Drive, Figma, GitHub/);
    });

    it("should reject dispute if job is not REJECTED", async () => {
      vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({
        id: "student-1",
        userId: "user-1",
      } as never);

      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: "job-1",
        status: "SUBMITTED", // Bukan REJECTED
        umkm: { id: "umkm-1", userId: "umkm-user-1" },
        assignments: [{ id: "assign-1" }],
        dispute: null,
      } as never);

      await expect(
        openDispute("job-1", "user-1", {
          reason: "Karya saya telah memenuhi seluruh instruksi brief secara lengkap dan rapi.",
        })
      ).rejects.toThrow(/hanya dapat diajukan pada pekerjaan yang berstatus REJECTED/);
    });

    it("should reject dispute if disputeUntil window has expired", async () => {
      vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({
        id: "student-1",
        userId: "user-1",
      } as never);

      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: "job-1",
        status: "REJECTED",
        disputeUntil: new Date(Date.now() - 3600 * 1000), // Lewat 1 jam yang lalu
        umkm: { id: "umkm-1", userId: "umkm-user-1" },
        assignments: [{ id: "assign-1" }],
        dispute: null,
      } as never);

      await expect(
        openDispute("job-1", "user-1", {
          reason: "Karya saya telah memenuhi seluruh instruksi brief secara lengkap dan rapi.",
        })
      ).rejects.toThrow(/Batas waktu pengajuan sengketa.*telah berakhir/);
    });

    it("should successfully open dispute, update job to DISPUTED and notify UMKM", async () => {
      vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({
        id: "student-1",
        userId: "user-1",
      } as never);

      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: "job-1",
        title: "Desain Feed Instagram",
        status: "REJECTED",
        disputeUntil: new Date(Date.now() + 24 * 3600 * 1000), // Masih ada 24 jam
        umkm: { id: "umkm-1", userId: "umkm-user-1" },
        assignments: [{ id: "assign-1" }],
        dispute: null,
      } as never);

      vi.mocked(prisma.job.update).mockResolvedValue({
        id: "job-1",
        status: "DISPUTED",
      } as never);

      vi.mocked(prisma.dispute.create).mockResolvedValue({
        id: "dispute-1",
        jobId: "job-1",
        status: "OPEN",
      } as never);

      const res = await openDispute("job-1", "user-1", {
        reason: "Seluruh kriteria revisi telah saya selesaikan sesuai instruksi di Notion.",
        evidenceUrl: "https://www.figma.com/file/12345/design",
      });

      expect(res.job.status).toBe("DISPUTED");
      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: "job-1" },
        data: { status: "DISPUTED" },
      });
      expect(prisma.dispute.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            jobId: "job-1",
            status: "OPEN",
            evidenceUrl: "https://www.figma.com/file/12345/design",
          }),
        })
      );
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "umkm-user-1",
            type: "DISPUTE_OPENED",
          }),
        })
      );
    });
  });

  describe("BR-D2: Keputusan Admin terhadap Sengketa (resolveDisputeByAdmin)", () => {
    it("should resolve dispute with ACCEPT_WORK, mark job ACCEPTED, release ledger to PAYABLE, award points", async () => {
      vi.mocked(prisma.dispute.findUnique).mockResolvedValue({
        id: "dispute-1",
        status: "OPEN",
        job: {
          id: "job-1",
          title: "Copywriting Produk",
          status: "DISPUTED",
          revisionCount: 0,
          umkm: { id: "umkm-1", userId: "umkm-user-1" },
          assignments: [
            {
              id: "assign-1",
              status: "ACTIVE",
              student: {
                id: "student-1",
                userId: "user-student-1",
                points: 40,
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
        },
      } as never);

      vi.mocked(prisma.dispute.update).mockResolvedValue({
        id: "dispute-1",
        status: "RESOLVED",
        resolution: "ACCEPT_WORK",
      } as never);

      const res = await resolveDisputeByAdmin(
        "admin-user-1",
        "dispute-1",
        "ACCEPT_WORK",
        "Karya telah memenuhi seluruh kriteria objektif."
      );

      expect(res.success).toBe(true);
      expect(res.resolution).toBe("ACCEPT_WORK");

      // Job beralih ke ACCEPTED
      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: "job-1" },
        data: { status: "ACCEPTED" },
      });

      // Saldo HELD beralih ke PAYABLE
      expect(prisma.ledgerEntry.updateMany).toHaveBeenCalledWith({
        where: {
          jobId: "job-1",
          type: "STUDENT_SHARE",
          status: "HELD",
        },
        data: { status: "PAYABLE" },
      });

      // Reputasi mahasiswa: 40 + 10 (base) + 3 (no rev) + 2 (on time) = 55 -> Level RELIABLE!
      expect(prisma.studentProfile.update).toHaveBeenCalledWith({
        where: { id: "student-1" },
        data: {
          points: 55,
          level: "RELIABLE",
          completedJobs: { increment: 1 },
        },
      });

      // Audit log tercatat 🧾
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actorId: "admin-user-1",
            action: "DISPUTE_RESOLVED",
            meta: expect.objectContaining({ decision: "ACCEPT_WORK" }),
          }),
        })
      );
    });

    it("should resolve dispute with UPHOLD_REJECTION, finalize REJECTED, void ledger, and write audit log", async () => {
      vi.mocked(prisma.dispute.findUnique).mockResolvedValue({
        id: "dispute-1",
        status: "OPEN",
        job: {
          id: "job-1",
          title: "Copywriting Produk",
          status: "DISPUTED",
          umkm: { id: "umkm-1", userId: "umkm-user-1" },
          assignments: [
            {
              id: "assign-1",
              status: "ACTIVE",
              student: {
                id: "student-1",
                userId: "user-student-1",
                points: 40,
                level: "NEWCOMER",
              },
            },
          ],
          submissions: [],
        },
      } as never);

      vi.mocked(prisma.dispute.update).mockResolvedValue({
        id: "dispute-1",
        status: "RESOLVED",
        resolution: "UPHOLD_REJECTION",
      } as never);

      const res = await resolveDisputeByAdmin(
        "admin-user-1",
        "dispute-1",
        "UPHOLD_REJECTION",
        "Karya terbukti tidak memenuhi kriteria minimum brief."
      );

      expect(res.success).toBe(true);
      expect(res.resolution).toBe("UPHOLD_REJECTION");

      // Job final REJECTED
      expect(prisma.job.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "job-1" },
          data: expect.objectContaining({ status: "REJECTED" }),
        })
      );

      // Saldo HELD di-VOIDED
      expect(prisma.ledgerEntry.updateMany).toHaveBeenCalledWith({
        where: {
          jobId: "job-1",
          status: "HELD",
        },
        data: { status: "VOIDED" },
      });

      // Audit log tercatat 🧾
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actorId: "admin-user-1",
            action: "DISPUTE_RESOLVED",
            meta: expect.objectContaining({ decision: "UPHOLD_REJECTION" }),
          }),
        })
      );
    });
  });
});

