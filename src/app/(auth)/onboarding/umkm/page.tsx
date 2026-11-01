import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UmkmOnboardingForm } from "@/features/auth/components/umkm-onboarding-form";
import Link from "next/link";

export default async function UmkmOnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?as=umkm");
  }

  if (session.user.role === "STUDENT") redirect("/student");
  if (session.user.role === "UMKM") redirect("/umkm");
  if (session.user.role === "ADMIN") redirect("/admin");

  return (
    <div className="min-h-screen bg-cream py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <span className="font-heading text-3xl font-bold tracking-tight text-primary-brown">
              KARTA
            </span>
          </Link>
          <h1 className="mt-3 font-heading text-2xl sm:text-3xl font-semibold text-primary-brown">
            Registrasi Profil UMKM
          </h1>
          <p className="mt-1 text-xs text-primary-brown/70 font-sans">
            Daftarkan bisnis Anda untuk mulai mempublikasikan tugas mikro kepada talenta kampus.
          </p>
        </div>

        <UmkmOnboardingForm />
      </div>
    </div>
  );
}

