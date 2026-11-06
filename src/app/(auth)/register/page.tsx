import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
import { RegisterFlowClient } from "@/features/auth/components/register-flow-client";

export const metadata = {
  title: "Pendaftaran Akun Baru | Karta",
  description: "Pilih peran Anda dan daftarkan akun Karta untuk mulai mengakses tugas kampus atau mempublikasikan pekerjaan UMKM.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  const session = await auth();
  const { as } = await searchParams;

  // If already logged in with a completed role, go to respective dashboard
  if (session?.user?.role) {
    if (session.user.role === "STUDENT") redirect("/student");
    if (session.user.role === "UMKM") redirect("/umkm");
    if (session.user.role === "ADMIN") redirect("/admin");
  } else if (session?.user) {
    // Already authenticated with Google but hasn't finished profile
    if (as === "student") redirect("/onboarding/student");
    if (as === "umkm") redirect("/onboarding/umkm");
    redirect("/onboarding");
  }

  const initialRole = as === "student" ? "student" : as === "umkm" ? "umkm" : undefined;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-cream px-4 py-12">
      <div className="w-full max-w-xl space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <BrandLogo size="lg" />
          <p className="mt-3 text-xs font-medium text-primary-brown/70 tracking-widest uppercase">
            Platform Micro-Job Kampus &amp; UMKM
          </p>
        </div>

        {/* Interactive Registration Component */}
        <RegisterFlowClient initialRole={initialRole} />
      </div>
    </div>
  );
}

