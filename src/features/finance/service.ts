import "server-only";

import { prisma } from "@/lib/db";
import { formatRupiah } from "@/lib/format";
import type {
  Withdrawal,
  LedgerEntry,
} from "@/generated/prisma/client";

export class FinanceError extends Error {
  code: string;
  constructor(message: string, code = "FINANCE_ERROR") {
    super(message);
    this.name = "FinanceError";
    this.code = code;
  }
}

export const MIN_WITHDRAWAL_IDR = 50000;

export interface EarningsSummary {
  availableBalance: number;
  heldBalance: number;
  reservedBalance: number;
  paidBalance: number;
  lifetimeEarnings: number;
  activeWithdrawal: Withdrawal | null;
  bankDetails: {
    bankName: string | null;
    bankAccountName: string | null;
    bankAccountNumber: string | null;
  };
  ledgerHistory: (LedgerEntry & {
    assignment?: {
      job?: {
        title: string;
      };
    } | null;
  })[];
  withdrawalHistory: Withdrawal[];
}

/**
 * BR-W1: Menghitung ringkasan saldo keuangan mahasiswa
 */
export async function getStudentEarningsSummary(studentId: string): Promise<EarningsSummary> {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    select: {
      bankName: true,
      bankAccountName: true,
      bankAccountNumber: true,
    },
  });

  if (!student) {
    throw new FinanceError("Profil mahasiswa tidak ditemukan.", "STUDENT_NOT_FOUND");
  }

  // 1. Agregasi saldo berdasarkan status ledger (type: STUDENT_SHARE)
  const [
    availableAgg,
    heldAgg,
    reservedAgg,
    paidAgg,
    activeWithdrawal,
    ledgerHistory,
    withdrawalHistory,
  ] = await Promise.all([
    // Saldo Tersedia (PAYABLE dan belum ditarik)
    prisma.ledgerEntry.aggregate({
      where: {
        studentId,
        type: "STUDENT_SHARE",
        status: "PAYABLE",
        withdrawalId: null,
      },
      _sum: { amountIdr: true },
    }),
    // Saldo Tertahan (HELD - tugas ditolak/dalam sengketa)
    prisma.ledgerEntry.aggregate({
      where: {
        studentId,
        type: "STUDENT_SHARE",
        status: "HELD",
      },
      _sum: { amountIdr: true },
    }),
    // Saldo Pending (RESERVED - tugas sedang dikerjakan)
    prisma.ledgerEntry.aggregate({
      where: {
        studentId,
        type: "STUDENT_SHARE",
        status: "RESERVED",
      },
      _sum: { amountIdr: true },
    }),
    // Saldo yang telah dicairkan (PAID)
    prisma.ledgerEntry.aggregate({
      where: {
        studentId,
        type: "STUDENT_SHARE",
        status: "PAID",
      },
      _sum: { amountIdr: true },
    }),
    // Penarikan aktif yang masih REQUESTED
    prisma.withdrawal.findFirst({
      where: {
        studentId,
        status: "REQUESTED",
      },
    }),
    // Riwayat transaksi ledger
    prisma.ledgerEntry.findMany({
      where: {
        studentId,
        type: "STUDENT_SHARE",
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        assignment: {
          include: {
            job: { select: { title: true } },
          },
        },
      },
    }),
    // Riwayat penarikan dana
    prisma.withdrawal.findMany({
      where: { studentId },
      orderBy: { requestedAt: "desc" },
      take: 20,
    }),
  ]);

  const availableBalance = availableAgg._sum.amountIdr ?? 0;
  const heldBalance = heldAgg._sum.amountIdr ?? 0;
  const reservedBalance = reservedAgg._sum.amountIdr ?? 0;
  const paidBalance = paidAgg._sum.amountIdr ?? 0;
  const lifetimeEarnings = availableBalance + paidBalance;

  return {
    availableBalance,
    heldBalance,
    reservedBalance,
    paidBalance,
    lifetimeEarnings,
    activeWithdrawal,
    bankDetails: {
      bankName: student.bankName,
      bankAccountName: student.bankAccountName,
      bankAccountNumber: student.bankAccountNumber,
    },
    ledgerHistory,
    withdrawalHistory,
  };
}

/**
 * BR-W2: Memperbarui data rekening bank mahasiswa
 */
export async function updateBankDetails(
  studentUserId: string,
  input: {
    bankName: string;
    bankAccountName: string;
    bankAccountNumber: string;
  }
) {
  const bankName = input.bankName.trim();
  const bankAccountName = input.bankAccountName.trim();
  const cleanAccountNumber = input.bankAccountNumber.replace(/[^0-9]/g, "");

  if (!bankName || !bankAccountName || !cleanAccountNumber) {
    throw new FinanceError(
      "Nama bank, nama pemilik rekening, dan nomor rekening wajib diisi.",
      "INCOMPLETE_BANK_DETAILS"
    );
  }

  if (cleanAccountNumber.length < 5 || cleanAccountNumber.length > 20) {
    throw new FinanceError(
      "Nomor rekening bank tidak valid (harus 5 hingga 20 digit angka).",
      "INVALID_BANK_NUMBER"
    );
  }

  const student = await prisma.studentProfile.update({
    where: { userId: studentUserId },
    data: {
      bankName,
      bankAccountName,
      bankAccountNumber: cleanAccountNumber,
    },
  });

  return student;
}

/**
 * BR-W3: Mengajukan penarikan dana (Withdrawal)
 * - Menarik seluruh saldo PAYABLE yang tersedia
 * - Minimal Rp 50.000
 * - Hanya 1 penarikan REQUESTED dalam satu waktu
 */
export async function requestWithdrawal(studentUserId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId: studentUserId },
  });

  if (!student) {
    throw new FinanceError("Profil mahasiswa tidak ditemukan.", "STUDENT_NOT_FOUND");
  }

  // Validasi data rekening bank (BR-W2)
  if (!student.bankName || !student.bankAccountName || !student.bankAccountNumber) {
    throw new FinanceError(
      "Harap lengkapi informasi rekening bank sebelum mengajukan penarikan dana.",
      "BANK_DETAILS_MISSING"
    );
  }

  // Validasi satu penarikan REQUESTED dalam satu waktu (BR-W3)
  const existingPending = await prisma.withdrawal.findFirst({
    where: {
      studentId: student.id,
      status: "REQUESTED",
    },
  });

  if (existingPending) {
    throw new FinanceError(
      "Anda masih memiliki pengajuan penarikan dana yang sedang diproses admin.",
      "PENDING_WITHDRAWAL_EXISTS"
    );
  }

  // Ambil seluruh entri PAYABLE yang belum ditarik
  const payableEntries = await prisma.ledgerEntry.findMany({
    where: {
      studentId: student.id,
      type: "STUDENT_SHARE",
      status: "PAYABLE",
      withdrawalId: null,
    },
  });

  const totalAmount = payableEntries.reduce((sum, e) => sum + e.amountIdr, 0);

  if (totalAmount < MIN_WITHDRAWAL_IDR) {
    throw new FinanceError(
      `Saldo tersedia (${formatRupiah(totalAmount)}) kurang dari batas minimum penarikan (${formatRupiah(MIN_WITHDRAWAL_IDR)}).`,
      "BELOW_MINIMUM_WITHDRAWAL"
    );
  }

  const now = new Date();

  // Eksekusi atomik pembuatan withdrawal dan tagging ledger entries
  const withdrawal = await prisma.$transaction(async (tx) => {
    const createdWithdrawal = await tx.withdrawal.create({
      data: {
        studentId: student.id,
        amountIdr: totalAmount,
        bankName: student.bankName!,
        bankAccountName: student.bankAccountName!,
        bankAccountNumber: student.bankAccountNumber!,
        status: "REQUESTED",
        requestedAt: now,
      },
    });

    // Tag entri ledger dengan withdrawalId
    await tx.ledgerEntry.updateMany({
      where: {
        id: { in: payableEntries.map((e) => e.id) },
      },
      data: {
        withdrawalId: createdWithdrawal.id,
      },
    });

    // Notifikasi mahasiswa
    await tx.notification.create({
      data: {
        userId: student.userId,
        type: "WITHDRAWAL_REQUESTED",
        title: "Pengajuan Penarikan Dana Diterima",
        body: `Permohonan penarikan dana sebesar ${formatRupiah(totalAmount)} telah diterima dan sedang diproses oleh admin.`,
        href: "/student/earnings",
      },
    });

    return createdWithdrawal;
  });

  return withdrawal;
}

/**
 * BR-W4: Admin memproses penarikan dana (Tandai Dibayar / Tolak)
 */
export async function processWithdrawalByAdmin(
  adminUserId: string,
  withdrawalId: string,
  action: "PAY" | "REJECT",
  adminNote?: string
) {
  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
    include: {
      student: { select: { userId: true } },
    },
  });

  if (!withdrawal) {
    throw new FinanceError("Data penarikan dana tidak ditemukan.", "WITHDRAWAL_NOT_FOUND");
  }

  if (withdrawal.status !== "REQUESTED") {
    throw new FinanceError(
      `Pengajuan penarikan sudah berstatus ${withdrawal.status} dan tidak dapat diubah lagi.`,
      "INVALID_WITHDRAWAL_STATUS"
    );
  }

  const now = new Date();

  if (action === "PAY") {
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update withdrawal status menjadi PAID
      const res = await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: "PAID",
          processedBy: adminUserId,
          processedAt: now,
          adminNote: adminNote?.trim() || "Transfer telah berhasil diselesaikan.",
        },
      });

      // 2. Update entri ledger menjadi PAID
      await tx.ledgerEntry.updateMany({
        where: { withdrawalId },
        data: { status: "PAID" },
      });

      // 3. Catat audit log 🧾
      await tx.auditLog.create({
        data: {
          actorId: adminUserId,
          action: "WITHDRAWAL_PAID",
          entity: "Withdrawal",
          entityId: withdrawalId,
          meta: {
            amountIdr: withdrawal.amountIdr,
            bankName: withdrawal.bankName,
            bankAccountNumber: withdrawal.bankAccountNumber,
          },
        },
      });

      // 4. Notifikasi mahasiswa
      await tx.notification.create({
        data: {
          userId: withdrawal.student.userId,
          type: "WITHDRAWAL_PAID",
          title: "Penarikan Dana Berhasil!",
          body: `Dana penarikan sebesar ${formatRupiah(withdrawal.amountIdr)} telah berhasil ditransfer ke rekening ${withdrawal.bankName} Anda.`,
          href: "/student/earnings",
        },
      });

      return res;
    });

    return { success: true, withdrawal: updated };
  }

  if (action === "REJECT") {
    const reason = adminNote?.trim() || "";
    if (reason.length < 10) {
      throw new FinanceError(
        "Alasan penolakan penarikan dana wajib diisi minimal 10 karakter.",
        "REASON_TOO_SHORT"
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update withdrawal status REJECTED
      const res = await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: "REJECTED",
          processedBy: adminUserId,
          processedAt: now,
          adminNote: reason,
        },
      });

      // 2. Lepas withdrawalId pada entri ledger sehingga saldo kembali tersedia (PAYABLE)
      await tx.ledgerEntry.updateMany({
        where: { withdrawalId },
        data: { withdrawalId: null },
      });

      // 3. Catat audit log 🧾
      await tx.auditLog.create({
        data: {
          actorId: adminUserId,
          action: "WITHDRAWAL_REJECTED",
          entity: "Withdrawal",
          entityId: withdrawalId,
          meta: {
            amountIdr: withdrawal.amountIdr,
            reason,
          },
        },
      });

      // 4. Notifikasi mahasiswa
      await tx.notification.create({
        data: {
          userId: withdrawal.student.userId,
          type: "WITHDRAWAL_REJECTED",
          title: "Pengajuan Penarikan Dana Ditolak",
          body: `Penarikan dana sebesar ${formatRupiah(withdrawal.amountIdr)} ditolak: "${reason}". Saldo telah dikembalikan ke akun Anda.`,
          href: "/student/earnings",
        },
      });

      return res;
    });

    return { success: true, withdrawal: updated };
  }

  throw new FinanceError("Aksi pemrosesan penarikan dana tidak valid.", "INVALID_ACTION");
}

/**
 * Pengaturan visibilitas portofolio publik & bio mahasiswa
 */
export async function updateStudentPortfolioSettings(
  studentUserId: string,
  input: {
    portfolioPublic?: boolean;
    bio?: string;
  }
) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId: studentUserId },
  });

  if (!student) {
    throw new FinanceError("Profil mahasiswa tidak ditemukan.", "STUDENT_NOT_FOUND");
  }

  return await prisma.studentProfile.update({
    where: { id: student.id },
    data: {
      portfolioPublic: input.portfolioPublic !== undefined ? input.portfolioPublic : student.portfolioPublic,
      bio: input.bio !== undefined ? input.bio : student.bio,
    },
  });
}

/**
 * Updates comprehensive student profile information (Full Name, Username, Study Program, Bio, Portfolio Visibility)
 */
export async function updateStudentProfile(
  studentUserId: string,
  input: {
    name?: string;
    username?: string;
    studyProgram?: string;
    bio?: string;
    portfolioPublic?: boolean;
  }
) {
  const student = await prisma.studentProfile.findUnique({
    where: { userId: studentUserId },
  });

  if (!student) {
    throw new FinanceError("Profil mahasiswa tidak ditemukan.", "STUDENT_NOT_FOUND");
  }

  // If username is changing, validate format and uniqueness
  if (input.username && input.username.toLowerCase() !== student.username) {
    const cleanUsername = input.username.toLowerCase().trim();
    if (!/^[a-z0-9-]+$/.test(cleanUsername)) {
      throw new FinanceError(
        "Username hanya boleh terdiri dari huruf kecil, angka, dan tanda hubung (-). Tanpa spasi.",
        "INVALID_USERNAME"
      );
    }
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      throw new FinanceError("Username harus antara 3 hingga 30 karakter.", "INVALID_USERNAME_LENGTH");
    }

    const existing = await prisma.studentProfile.findUnique({
      where: { username: cleanUsername },
    });
    if (existing && existing.id !== student.id) {
      throw new FinanceError("Username tersebut sudah digunakan oleh mahasiswa lain.", "USERNAME_TAKEN");
    }
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Update user.name if provided
    if (input.name && input.name.trim().length >= 2) {
      await tx.user.update({
        where: { id: studentUserId },
        data: { name: input.name.trim() },
      });
    }

    // 2. Update studentProfile
    const updatedStudent = await tx.studentProfile.update({
      where: { id: student.id },
      data: {
        ...(input.username ? { username: input.username.toLowerCase().trim() } : {}),
        ...(input.studyProgram ? { studyProgram: input.studyProgram.trim() } : {}),
        ...(input.bio !== undefined ? { bio: input.bio.trim() } : {}),
        ...(input.portfolioPublic !== undefined ? { portfolioPublic: input.portfolioPublic } : {}),
      },
    });

    return updatedStudent;
  });
}


