import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StudentShell } from "@/components/layout/student-shell";
import { prisma } from "@/lib/db";
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

  const student = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      campus: true,
    },
  });

  if (!student) {
    redirect("/onboarding/student");
  }

  return (
    <StudentShell activePath="/student/profile">
      <StudentProfileView student={student} />
    </StudentShell>
  );
}

