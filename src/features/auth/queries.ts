import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getUserWithProfile } from "./service";

export async function getCurrentUserProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return await getUserWithProfile(session.user.id);
}

export async function getStudentProfileByUserId(userId: string) {
  return await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      campus: true,
    },
  });
}

export async function getUmkmProfileByUserId(userId: string) {
  return await prisma.umkmProfile.findUnique({
    where: { userId },
    include: {
      partnerCampus: true,
    },
  });
}
