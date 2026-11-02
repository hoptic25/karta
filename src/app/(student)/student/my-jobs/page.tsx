import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StudentShell } from "@/components/layout/student-shell";
import { prisma } from "@/lib/db";
import {
  getStudentMyJobs,
  StudentMyJobsView,
  type MyJobTab,
  type MyJobAssignmentItem,
} from "@/features/jobs";

interface MyJobsPageProps {
  searchParams: Promise<{
    tab?: MyJobTab;
    search?: string;
  }>;
}

export default async function StudentMyJobsPage({ searchParams }: MyJobsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?as=student");
  }

  if (session.user.role !== "STUDENT" && session.user.role !== "ADMIN") {
    redirect("/umkm");
  }

  const student = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!student) {
    redirect("/onboarding/student");
  }

  const params = await searchParams;
  const currentTab = params.tab || "ALL";
  const searchQuery = params.search || "";

  const assignments = await getStudentMyJobs(student.id, {
    tab: currentTab,
    search: searchQuery,
  });

  return (
    <StudentShell activePath="/student/my-jobs">
      <StudentMyJobsView
        assignments={assignments as MyJobAssignmentItem[]}
        currentTab={currentTab}
        searchQuery={searchQuery}
      />
    </StudentShell>
  );
}

