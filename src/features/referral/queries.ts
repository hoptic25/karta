import "server-only";
import { prisma } from "@/lib/db";
import type { ReferralCode, Campus } from "@/generated/prisma/client";

export type ReferralCodeWithRelations = ReferralCode & {
  campus: Campus;
  _count: {
    redemptions: number;
  };
};

export async function getAllReferralCodes(): Promise<ReferralCodeWithRelations[]> {
  const codes = await prisma.referralCode.findMany({
    include: {
      campus: true,
      _count: {
        select: {
          redemptions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return codes;
}

export async function getReferralCodeById(
  id: string
): Promise<ReferralCodeWithRelations | null> {
  const code = await prisma.referralCode.findUnique({
    where: { id },
    include: {
      campus: true,
      _count: {
        select: {
          redemptions: true,
        },
      },
    },
  });

  return code;
}

export async function getReferralCodeByCode(
  code: string
): Promise<ReferralCode | null> {
  const referralCode = await prisma.referralCode.findUnique({
    where: { code },
  });

  return referralCode;
}
