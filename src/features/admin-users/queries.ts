import "server-only";
import { prisma } from "@/lib/db";
import type { User, StudentProfile, UmkmProfile } from "@/generated/prisma/client";

export type UserWithProfiles = User & {
  student: StudentProfile | null;
  umkm: UmkmProfile | null;
};

export async function getAllUsers(): Promise<UserWithProfiles[]> {
  const users = await prisma.user.findMany({
    include: {
      student: true,
      umkm: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return users;
}

export async function getUserById(id: string): Promise<UserWithProfiles | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      student: true,
      umkm: true,
    },
  });

  return user;
}
