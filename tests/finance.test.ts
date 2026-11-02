import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  requestWithdrawal,
  updateBankDetails,
  processWithdrawalByAdmin,
} from "../src/features/finance/service";
import { prisma } from "../src/lib/db";

vi.mock("../src/lib/db", () => ({
  prisma: {
    studentProfile: {
      findUnique: vi.fn(),
      update: vi.fn(),
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

describe("Finance & Withdrawal Rules (PRD §6.8 BR-W1, BR-W2, BR-W3, BR-W4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("BR-W3: Batas Minimum & Validasi Pengajuan Penarikan", () => {
    it("should reject withdrawal if student profile has incomplete bank details", async () => {
      vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({
        id: "student-1",
        userId: "user-1",
        bankName: null,
        bankAccountName: null,
        bankAccountNumber: null,
      } as never);

      await expect(requestWithdrawal("user-1")).rejects.toThrow(
        /Harap lengkapi informasi rekening bank/
      );
    });

    it("should reject withdrawal if student already has a pending REQUESTED withdrawal", async () => {
      vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({
        id: "student-1",
        userId: "user-1",
        bankName: "BCA",
        bankAccountName: "Budi Santoso",
        bankAccountNumber: "1234567890",
      } as never);

      vi.mocked(prisma.withdrawal.findFirst).mockResolvedValue({
        id: "with-1",
        studentId: "student-1",
        status: "REQUESTED",
        amountIdr: 100000,
      } as never);

      await expect(requestWithdrawal("user-1")).rejects.toThrow(
        /Anda masih memiliki pengajuan penarikan dana yang sedang diproses admin/
      );
    });

    it("should reject withdrawal if available PAYABLE balance is below Rp 50.000", async () => {
      vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({
        id: "student-1",
        userId: "user-1",
        bankName: "BCA",
        bankAccountName: "Budi Santoso",
        bankAccountNumber: "1234567890",
      } as never);

      vi.mocked(prisma.withdrawal.findFirst).mockResolvedValue(null);

      // Saldo hanya Rp 40.000 (< Rp 50.000)
      vi.mocked(prisma.ledgerEntry.findMany).mockResolvedValue([
        { id: "entry-1", amountIdr: 40000 },
      ] as never);

      await expect(requestWithdrawal("user-1")).rejects.toThrow(
        /kurang dari batas minimum penarikan/
      );
    });

    it("should successfully create withdrawal and tag ledger entries when balance is valid", async () => {
      vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({
        id: "student-1",
        userId: "user-1",
        bankName: "BCA",
        bankAccountName: "Budi Santoso",
        bankAccountNumber: "1234567890",
      } as never);

      vi.mocked(prisma.withdrawal.findFirst).mockResolvedValue(null);

      // Saldo Rp 150.000 (valid >= Rp 50.000)
      const mockEntries = [
        { id: "entry-1", amountIdr: 100000 },
        { id: "entry-2", amountIdr: 50000 },
      ];
      vi.mocked(prisma.ledgerEntry.findMany).mockResolvedValue(mockEntries as never);

      const createdWithdrawal = {
        id: "with-new-1",
        studentId: "student-1",
        amountIdr: 150000,
        bankName: "BCA",
        bankAccountName: "Budi Santoso",
        bankAccountNumber: "1234567890",
        status: "REQUESTED",
      };
      vi.mocked(prisma.withdrawal.create).mockResolvedValue(createdWithdrawal as never);

      const res = await requestWithdrawal("user-1");

      expect(res.amountIdr).toBe(150000);
      expect(prisma.withdrawal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amountIdr: 150000,
            bankName: "BCA",
            status: "REQUESTED",
          }),
        })
      );
      // Memastikan ledger entries ditagging dengan withdrawalId
      expect(prisma.ledgerEntry.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["entry-1", "entry-2"] } },
        data: { withdrawalId: "with-new-1" },
      });
    });
  });

  describe("BR-W2: Pengaturan Rekening Bank", () => {
    it("should reject invalid bank number format", async () => {
      await expect(
        updateBankDetails("user-1", {
          bankName: "BCA",
          bankAccountName: "Budi Santoso",
          bankAccountNumber: "123", // Terlalu pendek (< 5 digit)
        })
      ).rejects.toThrow(/Nomor rekening bank tidak valid/);
    });

    it("should update student profile with clean bank details", async () => {
      vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({
        id: "student-1",
        userId: "user-1",
      } as never);

      vi.mocked(prisma.studentProfile.update).mockResolvedValue({
        id: "student-1",
        userId: "user-1",
        bankName: "BCA",
        bankAccountName: "Budi Santoso",
        bankAccountNumber: "1234567890",
      } as never);

      const res = await updateBankDetails("user-1", {
        bankName: "  BCA  ",
        bankAccountName: "  Budi Santoso  ",
        bankAccountNumber: "1234-5678-90",
      });

      expect(prisma.studentProfile.update).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        data: {
          bankName: "BCA",
          bankAccountName: "Budi Santoso",
          bankAccountNumber: "1234567890",
        },
      });
      expect(res.bankAccountNumber).toBe("1234567890");
    });
  });

  describe("BR-W4: Pemrosesan Penarikan oleh Admin", () => {
    it("should approve (PAY) withdrawal, mark entries as PAID and write audit log", async () => {
      const mockWithdrawal = {
        id: "with-1",
        studentId: "student-1",
        amountIdr: 150000,
        status: "REQUESTED",
        student: {
          userId: "user-student-1",
        },
      };

      vi.mocked(prisma.withdrawal.findUnique).mockResolvedValue(mockWithdrawal as never);
      vi.mocked(prisma.withdrawal.update).mockResolvedValue({
        ...mockWithdrawal,
        status: "PAID",
      } as never);

      const res = await processWithdrawalByAdmin("admin-1", "with-1", "PAY", "Ref BCA 12345");

      expect(res.success).toBe(true);
      // Status ledger diubah ke PAID
      expect(prisma.ledgerEntry.updateMany).toHaveBeenCalledWith({
        where: { withdrawalId: "with-1" },
        data: { status: "PAID" },
      });
      // Audit log tercatat
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "WITHDRAWAL_PAID",
            actorId: "admin-1",
            entityId: "with-1",
          }),
        })
      );
    });

    it("should reject (REJECT) withdrawal, release ledger entries and write audit log", async () => {
      const mockWithdrawal = {
        id: "with-1",
        studentId: "student-1",
        amountIdr: 150000,
        status: "REQUESTED",
        student: {
          userId: "user-student-1",
        },
      };

      vi.mocked(prisma.withdrawal.findUnique).mockResolvedValue(mockWithdrawal as never);
      vi.mocked(prisma.withdrawal.update).mockResolvedValue({
        ...mockWithdrawal,
        status: "REJECTED",
        adminNote: "Nomor rekening tidak aktif",
      } as never);

      const res = await processWithdrawalByAdmin(
        "admin-1",
        "with-1",
        "REJECT",
        "Nomor rekening tidak aktif"
      );

      expect(res.success).toBe(true);
      // Tag withdrawalId dilepas sehingga saldo kembali ke mahasiswa
      expect(prisma.ledgerEntry.updateMany).toHaveBeenCalledWith({
        where: { withdrawalId: "with-1" },
        data: { withdrawalId: null },
      });
      // Audit log tercatat
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "WITHDRAWAL_REJECTED",
            actorId: "admin-1",
            entityId: "with-1",
          }),
        })
      );
    });
  });
});
