import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const checkReferralSchema = z.object({
  code: z.string().min(1),
});

/**
 * POST /api/auth/check-referral
 * Public endpoint for verifying referral codes during registration
 * No authentication required (used before user account exists)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = checkReferralSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          valid: false,
          message: "Kode referral wajib diisi",
        },
        { status: 400 }
      );
    }

    const normalizedCode = validation.data.code.trim().toUpperCase();

    // Find referral code with campus
    const referralCode = await prisma.referralCode.findUnique({
      where: { code: normalizedCode },
      include: {
        campus: true,
      },
    });

    // Code not found
    if (!referralCode) {
      return NextResponse.json(
        {
          valid: false,
          message: "Kode referral tidak ditemukan",
        },
        { status: 400 }
      );
    }

    // Code inactive
    if (!referralCode.isActive) {
      return NextResponse.json(
        {
          valid: false,
          message: "Kode referral sudah tidak aktif",
        },
        { status: 400 }
      );
    }

    // Code expired
    if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
      return NextResponse.json(
        {
          valid: false,
          message: "Kode referral sudah kedaluwarsa",
        },
        { status: 400 }
      );
    }

    // Max uses reached
    if (
      referralCode.maxUses !== null &&
      referralCode.usedCount >= referralCode.maxUses
    ) {
      return NextResponse.json(
        {
          valid: false,
          message: "Kuota penggunaan kode referral sudah habis",
        },
        { status: 400 }
      );
    }

    // Campus inactive
    if (!referralCode.campus || !referralCode.campus.isActive) {
      return NextResponse.json(
        {
          valid: false,
          message: "Kampus mitra untuk kode ini sedang nonaktif",
        },
        { status: 400 }
      );
    }

    // Valid!
    return NextResponse.json({
      valid: true,
      campusName: referralCode.campus.name,
      campusCity: referralCode.campus.city,
    });
  } catch (error) {
    console.error("Check referral error:", error);
    return NextResponse.json(
      {
        valid: false,
        message: "Terjadi kesalahan saat memverifikasi kode",
      },
      { status: 500 }
    );
  }
}
