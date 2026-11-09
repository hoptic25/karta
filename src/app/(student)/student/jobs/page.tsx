import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { StudentShell } from "@/components/layout/student-shell";
import {
  getStudentDiscoveryJobs,
  DiscoveryClientView,
} from "@/features/jobs";

interface StudentJobsPageProps {
  searchParams: Promise<{
    roleKey?: string | "ALL";
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

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  if (session.user.role !== "STUDENT") {
    redirect("/umkm");
  }

  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;

  const discoveryData = await getStudentDiscoveryJobs(session.user.id, {
    roleKey: params.roleKey,
    type: params.type,
    search: params.search,
    sort: params.sort,
    page,
    limit: 20,
  });

  if (!discoveryData) {
    redirect("/onboarding/student");
  }

  // Get the JobRole objects for display
  const studentRoles = await prisma.jobRole.findMany({
    where: { id: { in: discoveryData.student.jobRoleIds } },
  });

  return (
    <StudentShell activePath="/student/jobs">
      <Suspense fallback={<div className="p-8 text-center text-primary-brown/60">Memuat...</div>}>
        <DiscoveryClientView
          initialJobs={discoveryData.jobs}
          studentRoles={studentRoles}
          pagination={discoveryData.pagination}
          activeAssignmentsCount={discoveryData.activeAssignmentsCount}
          activeUnpaidCount={discoveryData.activeUnpaidCount}
        />
      </Suspense>
    </StudentShell>
  );
}

