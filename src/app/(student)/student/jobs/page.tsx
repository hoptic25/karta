import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StudentShell } from "@/components/layout/student-shell";
import {
  getStudentDiscoveryJobs,
  DiscoveryClientView,
} from "@/features/jobs";
import type { JobRole } from "@/generated/prisma/client";

interface StudentJobsPageProps {
  searchParams: Promise<{
    role?: JobRole | "ALL";
    type?: "ALL" | "PAID" | "UNPAID";
    search?: string;
    sort?: "RECOMMENDED" | "LATEST" | "DEADLINE" | "REWARD";
    page?: string;
  }>;
}

export default async function StudentJobsPage({ searchParams }: StudentJobsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?as=student");
  }

  if (session.user.role !== "STUDENT" && session.user.role !== "ADMIN") {
    redirect("/umkm");
  }

  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const discoveryData = await getStudentDiscoveryJobs(session.user.id, {
    role: params.role,
    type: params.type,
    search: params.search,
    sort: params.sort,
    page,
    limit: 20,
  });

  if (!discoveryData) {
    redirect("/onboarding/student");
  }

  return (
    <StudentShell activePath="/student/jobs">
      <DiscoveryClientView
        initialJobs={discoveryData.jobs}
        studentRoles={discoveryData.student.roles}
        pagination={discoveryData.pagination}
        activeAssignmentsCount={discoveryData.activeAssignmentsCount}
        activeUnpaidCount={discoveryData.activeUnpaidCount}
      />
    </StudentShell>
  );
}

