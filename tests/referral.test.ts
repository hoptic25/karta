import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateReferralCode,
  checkReferralRateLimit,
  recordReferralFailure,
} from "../src/features/auth/referral";
import { prisma } from "../src/lib/db";

vi.mock("../src/lib/db", () => ({
  prisma: {
    referralRedemption: {
      findUnique: vi.fn(),
    },
    referralCode: {
      findUnique: vi.fn(),
    },
  },
}));

describe("Referral Service & Validation (BR-A3, BR-A4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes referral code to uppercase and trims whitespace", async () => {
    vi.mocked(prisma.referralRedemption.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.referralCode.findUnique).mockResolvedValue({
      id: "code-1",
      code: "ITBJUARA",
      campusId: "campus-1",
      isActive: true,
      expiresAt: null,
      maxUses: 10,
      usedCount: 0,
      createdAt: new Date(),
      campus: {
        id: "campus-1",
        name: "ITB",
        city: "Bandung",
        province: "Jawa Barat",
        isActive: true,
        createdAt: new Date(),
      },
    } as never);

    const result = await validateReferralCode("  itbjuara  ", "user-test-1");
    expect(result.referral.code).toBe("ITBJUARA");
    expect(result.campus.name).toBe("ITB");
  });

  it("rejects when user already redeemed a referral code", async () => {
    vi.mocked(prisma.referralRedemption.findUnique).mockResolvedValue({
      id: "redemption-1",
      codeId: "code-1",
      userId: "user-already",
      redeemedAt: new Date(),
    } as never);

    await expect(
      validateReferralCode("ITBJUARA", "user-already")
    ).rejects.toThrow("Anda sudah pernah menukarkan kode referral.");
  });

  it("rejects non-existent referral code", async () => {
    vi.mocked(prisma.referralRedemption.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.referralCode.findUnique).mockResolvedValue(null);

    await expect(
      validateReferralCode("KODEPALSU", "user-test-2")
    ).rejects.toThrow("Kode referral tidak ditemukan.");
  });

  it("rejects inactive referral code", async () => {
    vi.mocked(prisma.referralRedemption.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.referralCode.findUnique).mockResolvedValue({
      id: "code-2",
      code: "INACTIVE123",
      campusId: "campus-1",
      isActive: false,
      expiresAt: null,
      maxUses: null,
      usedCount: 0,
      campus: { isActive: true },
    } as never);

    await expect(
      validateReferralCode("INACTIVE123", "user-test-3")
    ).rejects.toThrow("Kode referral sudah tidak aktif.");
  });

  it("rejects expired referral code", async () => {
    vi.mocked(prisma.referralRedemption.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.referralCode.findUnique).mockResolvedValue({
      id: "code-3",
      code: "EXPIRED123",
      campusId: "campus-1",
      isActive: true,
      expiresAt: new Date(Date.now() - 10000), // in the past
      maxUses: null,
      usedCount: 0,
      campus: { isActive: true },
    } as never);

    await expect(
      validateReferralCode("EXPIRED123", "user-test-4")
    ).rejects.toThrow("Kode referral sudah kedaluwarsa.");
  });

  it("rejects when referral code reaches maxUses", async () => {
    vi.mocked(prisma.referralRedemption.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.referralCode.findUnique).mockResolvedValue({
      id: "code-4",
      code: "FULL123",
      campusId: "campus-1",
      isActive: true,
      expiresAt: null,
      maxUses: 5,
      usedCount: 5,
      campus: { isActive: true },
    } as never);

    await expect(
      validateReferralCode("FULL123", "user-test-5")
    ).rejects.toThrow("Kuota penggunaan kode referral ini sudah habis.");
  });

  it("rejects when linked campus is inactive", async () => {
    vi.mocked(prisma.referralRedemption.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.referralCode.findUnique).mockResolvedValue({
      id: "code-5",
      code: "CAMPUSOFF",
      campusId: "campus-inactive",
      isActive: true,
      expiresAt: null,
      maxUses: null,
      usedCount: 0,
      campus: { isActive: false },
    } as never);

    await expect(
      validateReferralCode("CAMPUSOFF", "user-test-6")
    ).rejects.toThrow("Kampus mitra untuk kode ini sedang nonaktif.");
  });

  it("enforces rate limit after 5 failed attempts in 15 minutes", () => {
    const rateLimitedUser = "user-rate-limited";
    for (let i = 0; i < 5; i++) {
      recordReferralFailure(rateLimitedUser);
    }

    expect(() => checkReferralRateLimit(rateLimitedUser)).toThrow(
      "Terlalu banyak percobaan kode referral yang gagal. Silakan tunggu 15 menit."
    );
  });
});

