import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StudentShell } from "@/components/layout/student-shell";
import { getStudentProfileByUserId } from "@/features/auth";
import { StudentProfileView } from "@/features/finance";

export const metadata = {
  title: "Profil Saya | KARTA Mahasiswa",
  description: "Kelola profil, portofolio publik, dan nomor rekening Anda di KARTA",
};

export default async function StudentProfilePage() {
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

  return (
    <StudentShell activePath="/student/profile">
      <StudentProfileView student={student} />
    </StudentShell>
  );
}
