import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { StudentShell } from "@/components/layout/student-shell";
import { getStudentProfileByUserId } from "@/features/auth";
import {
  getStudentJobWorkspace,
  StudentWorkspaceView,
} from "@/features/jobs";

interface StudentJobWorkspacePageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentJobWorkspacePage({
  params,
}: StudentJobWorkspacePageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login?as=student");
  }

  if (session.user.role !== "STUDENT" && session.user.role !== "ADMIN") {
    redirect("/umkm");
  }

  const student = await getStudentProfileByUserId(session.user.id);

  if (!student) {
    redirect("/onboarding/student");
  }

  const workspaceData = await getStudentJobWorkspace(id, student.id);

  if (!workspaceData) {
    notFound();
  }

  return (
    <StudentShell activePath="/student/my-jobs">
      <StudentWorkspaceView assignment={workspaceData} />
    </StudentShell>
  );
}
