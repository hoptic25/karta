import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getJobRolesByKeys } from "@/features/job-roles";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
  referralCode: z.string().min(1),
  studyProgram: z.string().min(1),
  username: z.string().min(1),
  bio: z.string().optional(),
  roles: z.array(z.string()).min(1, "Pilih minimal 1 peran pekerjaan"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    // Normalize email
    const normalizedEmail = validated.email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUsername = await prisma.studentProfile.findUnique({
      where: { username: validated.username.toLowerCase() },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: "Username sudah digunakan" },
        { status: 400 }
      );
    }

    // Validate job role keys exist and are active
    const jobRoles = await getJobRolesByKeys(validated.roles);
    const activeRoles = jobRoles.filter((r) => r.isActive);
    
    if (activeRoles.length !== validated.roles.length) {
      return NextResponse.json(
        { error: "Salah satu peran pekerjaan tidak valid atau tidak aktif" },
        { status: 400 }
      );
    }

    // Verify referral code
    const referralCode = await prisma.referralCode.findFirst({
      where: {
        code: validated.referralCode.toUpperCase().trim(),
        isActive: true,
      },
      include: {
        campus: true,
      },
    });

    if (!referralCode || !referralCode.campus.isActive) {
      return NextResponse.json(
        { error: "Kode referral tidak valid atau kampus tidak aktif" },
        { status: 400 }
      );
    }

    // Check if max uses reached
    if (
      referralCode.maxUses !== null &&
      referralCode.usedCount >= referralCode.maxUses
    ) {
      return NextResponse.json(
        { error: "Kuota penggunaan kode referral sudah habis" },
        { status: 400 }
      );
    }

    // Check if expired
    if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Kode referral sudah kedaluwarsa" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Create user with student profile in transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create user + student profile
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          name: validated.fullName,
          password: hashedPassword,
          role: "STUDENT",
          isCampusEmail: normalizedEmail.endsWith(".ac.id"),
          student: {
            create: {
              campusId: referralCode.campus.id,
              fullName: validated.fullName,
              studyProgram: validated.studyProgram,
              username: validated.username.toLowerCase(),
              bio: validated.bio || "",
              jobRoleIds: activeRoles.map((r) => r.id),
              points: 0,
              level: "NEWCOMER",
            },
          },
        },
        include: {
          student: true,
        },
      });

      // Create referral redemption record
      await tx.referralRedemption.create({
        data: {
          codeId: referralCode.id,
          userId: newUser.id,
        },
      });

      // Increment referral code used count
      await tx.referralCode.update({
        where: { id: referralCode.id },
        data: {
          usedCount: { increment: 1 },
        },
      });

      return newUser;
    });

    return NextResponse.json(
      {
        message: "Registrasi berhasil",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register student error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Data tidak valid", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan saat registrasi" },
      { status: 500 }
    );
  }
}
