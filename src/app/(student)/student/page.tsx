import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StudentShell } from "@/components/layout/student-shell";
import { getStudentProfileByUserId } from "@/features/auth";
import { getStudentDashboardSummary, StudentDashboardView } from "@/features/jobs";

export const metadata = {
  title: "Dashboard Mahasiswa | KARTA",
  description: "Pantau pekerjaan mikro aktif, tenggat waktu, reputasi, dan saldo imbalan Anda.",
};

export default async function StudentDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?as=student");
  }

  if (session.user.role !== "STUDENT" && session.user.role !== "ADMIN") {
    redirect("/umkm");
  }

  const student = await getStudentProfileByUserId(session.user.id);

  if (!student) {
    // role STUDENT tapi profil belum ada: jangan lempar ke onboarding (loop)
    throw new Error("Profil mahasiswa tidak ditemukan.");
  }

  const summary = await getStudentDashboardSummary(student.id);

  if (!summary) {
    throw new Error("Ringkasan dashboard tidak tersedia.");
  }

  return (
    <StudentShell activePath="/student">
      <StudentDashboardView summary={summary} />
    </StudentShell>
  );
}
