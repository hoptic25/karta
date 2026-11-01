import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StudentOnboardingForm } from "@/features/auth/components/student-onboarding-form";
import Link from "next/link";

export default async function StudentOnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?as=student");
  }

  // If user already has a role, redirect to their home
  if (session.user.role === "STUDENT") redirect("/student");
  if (session.user.role === "UMKM") redirect("/umkm");
  if (session.user.role === "ADMIN") redirect("/admin");

  return (
    <div className="min-h-screen bg-cream py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <span className="font-heading text-3xl font-bold tracking-tight text-primary-brown">
              KARTA
            </span>
          </Link>
          <h1 className="mt-3 font-heading text-2xl sm:text-3xl font-semibold text-primary-brown">
            Registrasi Mahasiswa Kampus
          </h1>
          <p className="mt-1 text-xs text-primary-brown/70 font-sans">
            Lengkapi data di bawah ini untuk memulai membangun portofolio terverifikasi.
          </p>
        </div>

        <StudentOnboardingForm />
      </div>
    </div>
  );
}
