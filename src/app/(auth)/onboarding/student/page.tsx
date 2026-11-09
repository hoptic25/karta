import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StudentOnboardingForm } from "@/features/auth/components/student-onboarding-form";
import { BrandLogo } from "@/components/layout/brand-logo";

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
        <div className="flex flex-col items-center text-center">
          <BrandLogo size="lg" />
          <h1 className="mt-4 font-heading text-2xl sm:text-3xl font-semibold text-primary-brown">
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
