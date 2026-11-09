import { NextResponse } from "next/server";
import { getActiveJobRoles } from "@/features/job-roles";

/**
 * GET /api/job-roles
 * Public endpoint: Get all active job roles for forms
 */
export async function GET() {
  try {
    const roles = await getActiveJobRoles();
    
    return NextResponse.json({
      roles: roles.map((r) => ({
        id: r.id,
        key: r.key,
        label: r.label,
        description: r.description,
      })),
    });
  } catch (error) {
    console.error("Error fetching job roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch job roles" },
      { status: 500 }
    );
  }
}
