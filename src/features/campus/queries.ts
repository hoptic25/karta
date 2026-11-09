import "server-only";
import { prisma } from "@/lib/db";
import type { Campus } from "@/generated/prisma/client";

export type CampusWithRelations = Campus & {
  _count: {
    referralCodes: number;
    students: number;
    partnerUmkms: number;
  };
};

export async function getAllCampuses(): Promise<CampusWithRelations[]> {
  const campuses = await prisma.campus.findMany({
    include: {
      _count: {
        select: {
          referralCodes: true,
          students: true,
          partnerUmkms: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return campuses;
}

export async function getCampusById(
  id: string
): Promise<CampusWithRelations | null> {
  const campus = await prisma.campus.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          referralCodes: true,
          students: true,
          partnerUmkms: true,
        },
      },
    },
  });

  return campus;
}

export async function getCampusByName(
  name: string
): Promise<Campus | null> {
  const campus = await prisma.campus.findUnique({
    where: { name },
  });

  return campus;
}


export async function getActiveCampuses(): Promise<Campus[]> {
  const campuses = await prisma.campus.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return campuses;
}
