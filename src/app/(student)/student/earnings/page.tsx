import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StudentShell } from "@/components/layout/student-shell";
import { getStudentProfileByUserId } from "@/features/auth";
import { getStudentEarningsSummary, EarningsView } from "@/features/finance";

export const metadata = {
  title: "Penghasilan & Dompet | KARTA Mahasiswa",
  description: "Pantau saldo dan mutasi honor pekerjaan mikro Anda di KARTA",
};

export default async function StudentEarningsPage() {
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

  const summary = await getStudentEarningsSummary(student.id);

  return (
    <StudentShell activePath="/student/earnings">
      <EarningsView summary={summary} />
    </StudentShell>
  );
}
