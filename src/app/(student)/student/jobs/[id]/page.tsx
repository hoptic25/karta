import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { StudentShell } from "@/components/layout/student-shell";
import {
  getJobDetailForStudent,
  StudentJobDetailView,
} from "@/features/jobs";

interface StudentJobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentJobDetailPage({
  params,
}: StudentJobDetailPageProps) {
  const { id } = await params;
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

  const detailData = await getJobDetailForStudent(id, session.user.id);

  if (!detailData) {
    notFound();
  }

  return (
    <StudentShell activePath="/student/jobs">
      <StudentJobDetailView
        job={detailData.job}
        student={detailData.student}
        eligibility={detailData.eligibility}
        claimCutoffAt={detailData.claimCutoffAt}
      />
    </StudentShell>
  );
}

