import "server-only";
import { prisma } from "@/lib/db";

export async function getActiveCampuses() {
  return await prisma.campus.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

