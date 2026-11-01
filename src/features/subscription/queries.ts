import "server-only";
import { prisma } from "@/lib/db";

export async function getActivePackages() {
  return await prisma.package.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

