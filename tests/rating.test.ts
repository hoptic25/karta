import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  submitRatingFromUmkm,
  submitRatingFromStudent,
} from "../src/features/finance/ratings";
import { prisma } from "../src/lib/db";

vi.mock("../src/lib/db", () => ({
  prisma: {
    job: {
      findUnique: vi.fn(),
    },
    rating: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    studentProfile: {
      update: vi.fn(),
    },
    umkmProfile: {
      update: vi.fn(),
    },
    pointEvent: {
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

describe("Rating & Reputation System (PRD §6.7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("UMKM Rating to Student", () => {
    it("should reject rating score outside 1 - 5 range", async () => {
      await expect(
        submitRatingFromUmkm("job-1", "umkm-user-1", { score: 6 })
      ).rejects.toThrow(/Nilai rating harus berkisar antara 1 hingga 5 bintang/);

      await expect(
        submitRatingFromUmkm("job-1", "umkm-user-1", { score: 0 })
      ).rejects.toThrow(/Nilai rating harus berkisar antara 1 hingga 5 bintang/);
    });

    it("should reject rating if job status is not ACCEPTED", async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: "job-1",
        status: "IN_PROGRESS",
        umkm: { id: "umkm-1", userId: "umkm-user-1" },
        assignments: [],
      } as never);

      await expect(
        submitRatingFromUmkm("job-1", "umkm-user-1", { score: 5 })
      ).rejects.toThrow(/hanya dapat diberikan untuk pekerjaan yang telah selesai diterima/);
    });

    it("should award +2 reputation points bonus and update student level when score >= 4", async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: "job-1",
        title: "Desain Feed Instagram",
        status: "ACCEPTED",
        umkm: { id: "umkm-1", userId: "umkm-user-1" },
        assignments: [
          {
            id: "assign-1",
            student: {
              id: "student-1",
              userId: "student-user-1",
              points: 48, // 48 + 2 = 50 -> Naik ke RELIABLE!
              level: "NEWCOMER",
              ratingAvg: 4.0,
              ratingCount: 1,
            },
          },
        ],
      } as never);

      vi.mocked(prisma.rating.findUnique).mockResolvedValue(null); // Belum pernah dirating

      const createdRating = {
        id: "rating-1",
        jobId: "job-1",
        direction: "UMKM_TO_STUDENT",
        score: 5,
        comment: "Sangat rapi dan memuaskan",
      };
      vi.mocked(prisma.rating.create).mockResolvedValue(createdRating as never);

      const res = await submitRatingFromUmkm("job-1", "umkm-user-1", {
        score: 5,
        comment: "Sangat rapi dan memuaskan",
      });

      expect(res.success).toBe(true);
      expect(res.pointsEarned).toBe(2);
      // New average = (4.0 * 1 + 5) / 2 = 4.5
      expect(res.newRatingAvg).toBe(4.5);

      // Pastikan pointEvent dicatat
      expect(prisma.pointEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            studentId: "student-1",
            delta: 2,
            reason: expect.stringContaining("Bonus rating tinggi"),
          }),
        })
      );

      // Pastikan level mahasiswa dipromosikan ke RELIABLE (points 50)
      expect(prisma.studentProfile.update).toHaveBeenCalledWith({
        where: { id: "student-1" },
        data: {
          ratingAvg: 4.5,
          ratingCount: 2,
          points: 50,
          level: "RELIABLE",
        },
      });
    });

    it("should not award bonus points when score < 4", async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: "job-2",
        title: "Penulisan Artikel",
        status: "ACCEPTED",
        umkm: { id: "umkm-1", userId: "umkm-user-1" },
        assignments: [
          {
            id: "assign-2",
            student: {
              id: "student-1",
              userId: "student-user-1",
              points: 20,
              level: "NEWCOMER",
              ratingAvg: 4.0,
              ratingCount: 1,
            },
          },
        ],
      } as never);

      vi.mocked(prisma.rating.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.rating.create).mockResolvedValue({ id: "rating-2" } as never);

      const res = await submitRatingFromUmkm("job-2", "umkm-user-1", {
        score: 3,
        comment: "Bagus tapi ada sedikit typo",
      });

      expect(res.pointsEarned).toBe(0);
      expect(prisma.pointEvent.create).not.toHaveBeenCalled();
      expect(prisma.studentProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            points: 20, // Tetap 20 poin
          }),
        })
      );
    });

    it("should reject duplicate rating from UMKM for same job", async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: "job-1",
        status: "ACCEPTED",
        umkm: { id: "umkm-1", userId: "umkm-user-1" },
        assignments: [
          {
            id: "assign-1",
            student: { id: "student-1", userId: "student-user-1" },
          },
        ],
      } as never);

      vi.mocked(prisma.rating.findUnique).mockResolvedValue({
        id: "existing-rating",
      } as never);

      await expect(
        submitRatingFromUmkm("job-1", "umkm-user-1", { score: 5 })
      ).rejects.toThrow(/Anda sudah memberikan rating untuk pekerjaan ini/);
    });
  });

  describe("Student Rating to UMKM (4 Dimensions)", () => {
    it("should reject if any dimension score is not between 1 and 5", async () => {
      await expect(
        submitRatingFromStudent("job-1", "student-user-1", {
          dimensions: {
            clarity: 6, // Invalid > 5
            communication: 5,
            professionalism: 5,
            reviewSpeed: 5,
          },
        })
      ).rejects.toThrow(/Seluruh dimensi penilaian harus berada di antara 1 dan 5/);

      await expect(
        submitRatingFromStudent("job-1", "student-user-1", {
          dimensions: {
            clarity: 4,
            communication: 0, // Invalid < 1
            professionalism: 5,
            reviewSpeed: 5,
          },
        })
      ).rejects.toThrow(/Seluruh dimensi penilaian harus berada di antara 1 dan 5/);
    });

    it("should calculate average score across 4 dimensions and update UMKM profile", async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: "job-1",
        title: "Toko Online Setup",
        status: "ACCEPTED",
        umkm: {
          id: "umkm-1",
          userId: "umkm-user-1",
          ratingAvg: 4.0,
          ratingCount: 1,
        },
        assignments: [
          {
            id: "assign-1",
            student: { id: "student-1", userId: "student-user-1" },
          },
        ],
      } as never);

      vi.mocked(prisma.rating.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.rating.create).mockResolvedValue({
        id: "student-rating-1",
      } as never);

      // Dimensi: clarity=5, communication=4, professionalism=5, reviewSpeed=4 -> avg = 18/4 = 4.5
      const res = await submitRatingFromStudent("job-1", "student-user-1", {
        dimensions: {
          clarity: 5,
          communication: 4,
          professionalism: 5,
          reviewSpeed: 4,
        },
        comment: "Klien sangat ramah dan brief sangat jelas",
      });

      expect(res.success).toBe(true);
      // New UMKM average = (4.0 * 1 + 4.5) / 2 = 8.5 / 2 = 4.25
      expect(res.newRatingAvg).toBe(4.25);

      expect(prisma.umkmProfile.update).toHaveBeenCalledWith({
        where: { id: "umkm-1" },
        data: {
          ratingAvg: 4.25,
          ratingCount: 2,
        },
      });
    });
  });
});
