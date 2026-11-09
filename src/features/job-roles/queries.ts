import "server-only";
import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";
import type { JobRole } from "@/generated/prisma/client";

/**
 * Get all active job roles (cached)
 * Used in forms and public-facing pages
 */
export const getActiveJobRoles = unstable_cache(
  async (): Promise<JobRole[]> => {
    return prisma.jobRole.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  },
  ["active-job-roles"],
  {
    tags: ["job-roles"],
    revalidate: 3600, // 1 hour
  }
);

/**
 * Get all job roles (admin only)
 */
export async function getAllJobRoles(): Promise<JobRole[]> {
  return prisma.jobRole.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * Get job role by ID
 */
export async function getJobRoleById(id: string): Promise<JobRole | null> {
  return prisma.jobRole.findUnique({
    where: { id },
  });
}

/**
 * Get job role by key
 */
export async function getJobRoleByKey(key: string): Promise<JobRole | null> {
  return prisma.jobRole.findUnique({
    where: { key: key.toUpperCase() },
  });
}

/**
 * Validate job role keys
 * Returns true if all keys exist and are active
 */
export async function validateJobRoleKeys(keys: string[]): Promise<boolean> {
  const roles = await prisma.jobRole.findMany({
    where: {
      key: { in: keys.map((k) => k.toUpperCase()) },
      isActive: true,
    },
  });

  return roles.length === keys.length;
}

/**
 * Get job roles by keys (for data migration)
 */
export async function getJobRolesByKeys(keys: string[]): Promise<JobRole[]> {
  return prisma.jobRole.findMany({
    where: {
      key: { in: keys.map((k) => k.toUpperCase()) },
    },
    orderBy: { sortOrder: "asc" },
  });
}
