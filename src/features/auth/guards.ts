import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { Role, User, StudentProfile, Campus, UmkmProfile } from "@/generated/prisma/client";

export class AuthError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code = "UNAUTHORIZED", statusCode = 401) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Returns current authenticated user from DB. Throws AuthError if not authenticated or suspended.
 */
export async function requireUser(): Promise<User> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthError("Silakan masuk terlebih dahulu.", "UNAUTHENTICATED", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    throw new AuthError("Pengguna tidak ditemukan.", "USER_NOT_FOUND", 404);
  }

  if (user.status === "SUSPENDED") {
    throw new AuthError("Akun Anda telah dinonaktifkan.", "ACCOUNT_SUSPENDED", 403);
  }

  return user;
}

/**
 * Requires the user to have a specific role (or ADMIN)
 */
export async function requireRole(allowedRole: Role): Promise<User> {
  const user = await requireUser();
  if (user.role !== allowedRole && user.role !== "ADMIN") {
    throw new AuthError("Akses ditolak untuk peran ini.", "FORBIDDEN_ROLE", 403);
  }
  return user;
}

/**
 * Requires the user to be a student with active profile and linked campus
 */
export async function requireStudentWithCampus(): Promise<{
  user: User;
  student: StudentProfile & { campus: Campus };
}> {
  const user = await requireRole("STUDENT");

  const student = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    include: { campus: true },
  });

  if (!student) {
    throw new AuthError("Profil mahasiswa belum lengkap.", "INCOMPLETE_PROFILE", 403);
  }

  if (!student.campus || !student.campus.isActive) {
    throw new AuthError("Kampus mitra Anda sedang nonaktif.", "INACTIVE_CAMPUS", 403);
  }

  return { user, student };
}

/**
 * Requires the user to be UMKM who owns the job, or ADMIN
 */
export async function requireOwnedJob(jobId: string): Promise<{
  user: User;
  umkm?: UmkmProfile;
}> {
  const user = await requireUser();

  if (user.role === "ADMIN") {
    return { user };
  }

  if (user.role !== "UMKM") {
    throw new AuthError("Hanya UMKM yang dapat mengelola pekerjaan ini.", "FORBIDDEN", 403);
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      umkm: true,
    },
  });

  if (!job) {
    throw new AuthError("Pekerjaan tidak ditemukan.", "JOB_NOT_FOUND", 404);
  }

  if (job.umkm.userId !== user.id) {
    throw new AuthError("Anda tidak memiliki akses ke pekerjaan ini.", "FORBIDDEN_OWNERSHIP", 403);
  }

  return { user, umkm: job.umkm };
}

/**
 * Requires the user to be STUDENT who owns the assignment, or ADMIN
 */
export async function requireOwnedAssignment(assignmentId: string): Promise<{
  user: User;
  student?: StudentProfile;
}> {
  const user = await requireUser();

  if (user.role === "ADMIN") {
    return { user };
  }

  if (user.role !== "STUDENT") {
    throw new AuthError("Hanya mahasiswa yang dapat mengakses tugas ini.", "FORBIDDEN", 403);
  }

  const assignment = await prisma.jobAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      student: true,
    },
  });

  if (!assignment) {
    throw new AuthError("Penugasan pekerjaan tidak ditemukan.", "ASSIGNMENT_NOT_FOUND", 404);
  }

  if (assignment.student.userId !== user.id) {
    throw new AuthError("Anda tidak memiliki akses ke penugasan ini.", "FORBIDDEN_OWNERSHIP", 403);
  }

  return { user, student: assignment.student };
}

