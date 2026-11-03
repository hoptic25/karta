import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateTransition } from "../src/features/jobs/state-machine";
import { isValidDeliverableUrl } from "../src/lib/url";
import { checkClaimEligibility } from "../src/features/jobs/claim";
import { requestWithdrawal, processWithdrawalByAdmin } from "../src/features/finance/service";
import { completeStudentOnboarding, OnboardingError } from "../src/features/auth/service";
import { prisma } from "../src/lib/db";
import type { StudentProfile, Job } from "../src/generated/prisma/client";

vi.mock("../src/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    studentProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    platformConfig: {
      findUnique: vi.fn(),
    },
    referralCode: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    referralRedemption: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    ledgerEntry: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    withdrawal: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
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

describe("E2E Marketplace Lifecycle Test (PRD §16 P1 Happy Path)", () => {
  const baseNow = new Date("2026-11-03T10:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("completes full lifecycle: Publish -> Claim -> Submit -> Accept -> Payable -> Withdraw -> Paid", async () => {
    // 1. UMKM Publishes Job (DRAFT -> OPEN)
    expect(() => {
      validateTransition("DRAFT", "OPEN", "UMKM");
    }).not.toThrow();

    // 2. Student Claims Job (OPEN -> CLAIMED)
    const mockStudent: StudentProfile = {
      id: "student-1",
      userId: "user-student-1",
      campusId: "campus-1",
      username: "budisantoso",
      studyProgram: "Ilmu Komputer",
      roles: ["GRAPHIC_DESIGNER"],
      bio: "Graphic designer",
      avatarUrl: null,
      skills: ["Canva", "Photoshop"],
      level: "RELIABLE",
      points: 85,
      ratingAvg: 4.8,
      ratingCount: 5,
      completedJobs: 5,
      portfolioPublic: true,
      bankName: "BCA",
      bankAccountName: "Budi Santoso",
      bankAccountNumber: "1234567890",
      createdAt: baseNow,
    };

    const mockJob: Pick<
      Job,
      | "id"
      | "role"
      | "status"
      | "isHidden"
      | "isPaid"
      | "minLevel"
      | "deadlineAt"
      | "packageTier"
      | "beginnerFriendly"
      | "newcomerLaneUntil"
    > = {
      id: "job-1",
      role: "GRAPHIC_DESIGNER",
      status: "OPEN",
      isHidden: false,
      isPaid: true,
      minLevel: "NEWCOMER",
      deadlineAt: new Date(baseNow.getTime() + 96 * 60 * 60 * 1000),
      packageTier: "BASIC",
      beginnerFriendly: true,
      newcomerLaneUntil: new Date(baseNow.getTime() + 15 * 60 * 1000), // Active Newcomer Lane
    };

    // Verify eligibility
    const claimCheck = checkClaimEligibility(mockStudent, mockJob, 0, 0, baseNow);
    expect(claimCheck.eligible).toBe(true);

    // State transition to CLAIMED
    expect(() => {
      validateTransition("OPEN", "CLAIMED", "STUDENT");
    }).not.toThrow();

    // 3. Student Starts Work (CLAIMED -> IN_PROGRESS)
    expect(() => {
      validateTransition("CLAIMED", "IN_PROGRESS", "STUDENT");
    }).not.toThrow();

    // 4. Student Submits Deliverables (IN_PROGRESS -> SUBMITTED)
    const deliverableUrl = "https://drive.google.com/drive/folders/1a2b3c4d5e";
    const urlValidation = isValidDeliverableUrl(deliverableUrl);
    expect(urlValidation.valid).toBe(true);

    expect(() => {
      validateTransition("IN_PROGRESS", "SUBMITTED", "STUDENT");
    }).not.toThrow();

    // 5. UMKM Reviews and Accepts Work (SUBMITTED -> ACCEPTED)
    expect(() => {
      validateTransition("SUBMITTED", "ACCEPTED", "UMKM");
    }).not.toThrow();

    // 6. Balance Becomes PAYABLE (Rp 60.000)
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue(mockStudent);
    vi.mocked(prisma.withdrawal.findFirst).mockResolvedValue(null); // No active withdrawal

    vi.mocked(prisma.ledgerEntry.aggregate).mockResolvedValue({
      _sum: { amountIdr: 60000 },
      _count: { id: 2 },
      _avg: {},
      _min: {},
      _max: {},
    } as never);

    vi.mocked(prisma.ledgerEntry.findMany).mockResolvedValue([
      { id: "ledger-1", amountIdr: 30000, status: "PAYABLE", studentId: "student-1" },
      { id: "ledger-2", amountIdr: 30000, status: "PAYABLE", studentId: "student-1" },
    ] as never);

    vi.mocked(prisma.withdrawal.create).mockResolvedValue({
      id: "wd-101",
      studentId: "student-1",
      amountIdr: 60000,
      bankName: "BCA",
      bankAccountName: "Budi Santoso",
      bankAccountNumber: "1234567890",
      status: "REQUESTED",
      createdAt: baseNow,
    } as never);

    // 7. Student Requests Withdrawal
    const withdrawal = await requestWithdrawal("user-student-1");
    expect(withdrawal.amountIdr).toBe(60000);
    expect(withdrawal.status).toBe("REQUESTED");

    // 8. Admin Verifies and Confirms Transfer Payment
    vi.mocked(prisma.withdrawal.findUnique).mockResolvedValue({
      id: "wd-101",
      studentId: "student-1",
      amountIdr: 60000,
      status: "REQUESTED",
      student: { userId: "user-student-1" },
    } as never);

    const paidResult = await processWithdrawalByAdmin("user-admin-1", "wd-101", "PAY");

    expect(paidResult.success).toBe(true);
    expect(prisma.ledgerEntry.updateMany).toHaveBeenCalledWith({
      where: { withdrawalId: "wd-101" },
      data: { status: "PAID" },
    });
    expect(prisma.withdrawal.update).toHaveBeenCalledWith({
      where: { id: "wd-101" },
      data: expect.objectContaining({ status: "PAID" }),
    });
  });

  describe("BR-A5: Campus Email Policy (.ac.id)", () => {
    it("rejects student onboarding when requireCampusEmail is true and email is not .ac.id", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-std",
        email: "student@gmail.com",
        isCampusEmail: false,
        student: null,
      } as never);

      vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue(null);

      vi.mocked(prisma.platformConfig.findUnique).mockResolvedValue({
        key: "requireCampusEmail",
        value: true,
        updatedAt: baseNow,
      });

      await expect(
        completeStudentOnboarding("user-std", {
          username: "studentbaru",
          referralCode: "ITB123",
          studyProgram: "Informatika",
          roles: ["GRAPHIC_DESIGNER"],
        })
      ).rejects.toThrow(OnboardingError);

      await expect(
        completeStudentOnboarding("user-std", {
          username: "studentbaru",
          referralCode: "ITB123",
          studyProgram: "Informatika",
          roles: ["GRAPHIC_DESIGNER"],
        })
      ).rejects.toThrow("mewajibkan penggunaan akun Google dengan email institusi (.ac.id)");
    });

    it("allows student onboarding when user email ends with .ac.id even if requireCampusEmail is true", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-itb",
        email: "mahasiswa@itb.ac.id",
        isCampusEmail: true,
        student: null,
      } as never);

      vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue(null);

      vi.mocked(prisma.platformConfig.findUnique).mockResolvedValue({
        key: "requireCampusEmail",
        value: true,
        updatedAt: baseNow,
      });

      vi.mocked(prisma.referralRedemption.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.referralCode.findUnique).mockResolvedValue({
        id: "ref-itb",
        code: "ITB123",
        campusId: "campus-1",
        isActive: true,
        expiresAt: null,
        maxUses: null,
        usedCount: 0,
        campus: { id: "campus-1", name: "ITB", isActive: true },
      } as never);

      vi.mocked(prisma.studentProfile.create).mockResolvedValue({
        id: "std-itb-1",
        userId: "user-itb",
        username: "mahasiswaitb",
      } as never);

      const res = await completeStudentOnboarding("user-itb", {
        username: "mahasiswaitb",
        referralCode: "ITB123",
        studyProgram: "Teknik Informatika",
        roles: ["GRAPHIC_DESIGNER"],
      });

      expect(res).toBeDefined();
    });
  });
});
