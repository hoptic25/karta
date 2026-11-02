import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  reportFailureByUmkm,
  respondToFailureByStudent,
  resolveFailureByAdmin,
} from "../src/features/jobs/failures";
import { prisma } from "../src/lib/db";

vi.mock("../src/lib/db", () => ({
  prisma: {
    studentProfile: {
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
    failureReport: {
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

describe("Failure Reports System (PRD §6.6 BR-F1, BR-F2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("BR-F1: UMKM Melaporkan Kendala / Kegagalan (reportFailureByUmkm)", () => {
    it("should reject failure report if reason is less than 30 characters", async () => {
      await expect(
        reportFailureByUmkm("job-1", "umkm-user-1", {
          reason: "Mahasiswa tidak aktif", // Kurang dari 30 karakter
        })
      ).rejects.toThrow(/minimal 30 karakter/);
    });

    it("should reject failure report if job is not IN_PROGRESS or REVISION_REQUESTED", async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: "job-1",
        status: "OPEN", // Bukan IN_PROGRESS
        umkm: { id: "umkm-1", userId: "umkm-user-1" },
        assignments: [],
        failureReports: [],
      } as never);

      await expect(
        reportFailureByUmkm("job-1", "umkm-user-1", {
          reason: "Mahasiswa sama sekali tidak dapat dihubungi dan tidak ada kabar progress.",
        })
      ).rejects.toThrow(/hanya dapat dibuat ketika pekerjaan sedang berlangsung/);
    });

    it("should successfully create failure report and notify student", async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: "job-1",
        title: "Input Data Akuntansi",
        status: "IN_PROGRESS",
        umkm: { id: "umkm-1", userId: "umkm-user-1" },
        assignments: [
          {
            id: "assign-1",
            status: "ACTIVE",
            student: { userId: "user-student-1" },
          },
        ],
        failureReports: [],
      } as never);

      vi.mocked(prisma.failureReport.create).mockResolvedValue({
        id: "fail-1",
        jobId: "job-1",
        status: "OPEN",
      } as never);

      const report = await reportFailureByUmkm("job-1", "umkm-user-1", {
        reason: "Mahasiswa sama sekali tidak dapat dihubungi dan telah melewati batas toleransi.",
      });

      expect(report.id).toBe("fail-1");
      expect(prisma.failureReport.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            jobId: "job-1",
            assignmentId: "assign-1",
            status: "OPEN",
          }),
        })
      );
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-student-1",
            type: "FAILURE_REPORTED",
          }),
        })
      );
    });
  });

  describe("BR-F1: Tanggapan Mahasiswa (respondToFailureByStudent)", () => {
    it("should reject response if less than 10 characters", async () => {
      await expect(
        respondToFailureByStudent("fail-1", "user-student-1", {
          response: "Maaf ya",
        })
      ).rejects.toThrow(/minimal 10 karakter/);
    });

    it("should update studentResponse on open failure report", async () => {
      vi.mocked(prisma.failureReport.findUnique).mockResolvedValue({
        id: "fail-1",
        jobId: "job-1",
        status: "OPEN",
        assignment: {
          student: { userId: "user-student-1" },
        },
        job: {
          title: "Desain Feed",
          umkm: { userId: "umkm-user-1" },
        },
      } as never);

      vi.mocked(prisma.failureReport.update).mockResolvedValue({
        id: "fail-1",
        studentResponse: "Mohon maaf terjadi pemadaman listrik di kampus kami, file siap dikirim.",
      } as never);

      const res = await respondToFailureByStudent("fail-1", "user-student-1", {
        response: "Mohon maaf terjadi pemadaman listrik di kampus kami, file siap dikirim.",
      });

      expect(res.studentResponse).toContain("pemadaman listrik");
      expect(prisma.failureReport.update).toHaveBeenCalledWith({
        where: { id: "fail-1" },
        data: {
          studentResponse: "Mohon maaf terjadi pemadaman listrik di kampus kami, file siap dikirim.",
        },
      });
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "umkm-user-1",
            type: "FAILURE_RESPONSE",
          }),
        })
      );
    });
  });

  describe("BR-F2: Keputusan Admin terhadap Laporan Kendala (resolveFailureByAdmin)", () => {
    it("should confirm failure (CONFIRMED): assignment FAILED, student -15 points, ledger VOIDED, job reset to OPEN", async () => {
      vi.mocked(prisma.failureReport.findUnique).mockResolvedValue({
        id: "fail-1",
        status: "OPEN",
        job: {
          id: "job-1",
          title: "Desain Feed",
          role: "GRAPHIC_DESIGNER",
          packageTier: "BASIC",
          deadlineAt: new Date(Date.now() + 10 * 3600 * 1000),
          umkm: { id: "umkm-1", userId: "umkm-user-1" },
        },
        assignment: {
          id: "assign-1",
          student: {
            id: "student-1",
            userId: "user-student-1",
            points: 20, // 20 - 15 = 5 points
            level: "NEWCOMER",
          },
        },
      } as never);

      vi.mocked(prisma.failureReport.update).mockResolvedValue({
        id: "fail-1",
        status: "CONFIRMED",
      } as never);

      const res = await resolveFailureByAdmin("admin-1", "fail-1", "CONFIRMED", "Pelamar tidak merespon");

      expect(res.success).toBe(true);
      expect(res.resolution).toBe("CONFIRMED");

      // Assignment FAILED
      expect(prisma.jobAssignment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "assign-1" },
          data: expect.objectContaining({ status: "FAILED" }),
        })
      );

      // Job kembali OPEN
      expect(prisma.job.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "job-1" },
          data: expect.objectContaining({ status: "OPEN" }),
        })
      );

      // Mahasiswa disanksi -15 poin
      expect(prisma.studentProfile.update).toHaveBeenCalledWith({
        where: { id: "student-1" },
        data: {
          points: 5,
          level: "NEWCOMER",
        },
      });

      expect(prisma.pointEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            studentId: "student-1",
            delta: -15,
          }),
        })
      );

      // Ledger dibatalkan (VOIDED)
      expect(prisma.ledgerEntry.updateMany).toHaveBeenCalledWith({
        where: {
          jobId: "job-1",
          assignmentId: "assign-1",
          status: { in: ["RESERVED", "HELD"] },
        },
        data: { status: "VOIDED" },
      });

      // Audit log tercatat 🧾
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actorId: "admin-1",
            action: "FAILURE_CONFIRMED",
          }),
        })
      );
    });

    it("should dismiss report (DISMISSED): job continues, report DISMISSED", async () => {
      vi.mocked(prisma.failureReport.findUnique).mockResolvedValue({
        id: "fail-1",
        status: "OPEN",
        job: {
          id: "job-1",
          title: "Desain Feed",
          umkm: { id: "umkm-1", userId: "umkm-user-1" },
        },
        assignment: {
          id: "assign-1",
          student: { id: "student-1", userId: "user-student-1" },
        },
      } as never);

      vi.mocked(prisma.failureReport.update).mockResolvedValue({
        id: "fail-1",
        status: "DISMISSED",
      } as never);

      const res = await resolveFailureByAdmin(
        "admin-1",
        "fail-1",
        "DISMISSED",
        "Mahasiswa telah memberikan konfirmasi kendala teknis dan siap mengumpulkan hari ini."
      );

      expect(res.success).toBe(true);
      expect(res.resolution).toBe("DISMISSED");

      expect(prisma.failureReport.update).toHaveBeenCalledWith({
        where: { id: "fail-1" },
        data: expect.objectContaining({
          status: "DISMISSED",
          adminNote: expect.stringContaining("kendala teknis"),
        }),
      });

      // Job dan assignment TIDAK diubah
      expect(prisma.job.update).not.toHaveBeenCalled();
      expect(prisma.jobAssignment.update).not.toHaveBeenCalled();
    });
  });
});

