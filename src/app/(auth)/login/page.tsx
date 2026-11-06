import Link from "next/link";
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Sparkles, ShieldCheck } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  const { as, callbackUrl } = await searchParams;

  // If already logged in with role, redirect to appropriate dashboard
  if (session?.user?.role) {
    if (session.user.role === "STUDENT") redirect("/student");
    if (session.user.role === "UMKM") redirect("/umkm");
    if (session.user.role === "ADMIN") redirect("/admin");
  } else if (session?.user) {
    // Logged in but no role -> onboarding
    if (as === "student") redirect("/onboarding/student");
    if (as === "umkm") redirect("/onboarding/umkm");
    redirect("/onboarding");
  }

  const rolePreference = as === "student" ? "student" : as === "umkm" ? "umkm" : undefined;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-cream px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <BrandLogo size="lg" />
          <p className="mt-3 text-xs font-medium text-primary-brown/70 tracking-widest uppercase">
            Portal Akses Akun
          </p>
        </div>

        {/* Card */}
        <div className="border border-beige bg-white p-8 rounded-lg space-y-6 shadow-xs">
          {/* Header Title */}
          <div className="border-b border-beige pb-4 text-center">
            <h1 className="font-heading text-2xl font-semibold text-primary-brown">
              {rolePreference === "student"
                ? "Masuk sebagai Mahasiswa"
                : rolePreference === "umkm"
                ? "Masuk sebagai UMKM"
                : "Masuk ke Akun Karta"}
            </h1>
            <p className="mt-2 text-xs text-primary-brown/75 font-sans leading-relaxed">
              {rolePreference === "student"
                ? "Gunakan akun Google aktif Anda untuk melanjutkan pendaftaran atau mengakses tugas kampus."
                : rolePreference === "umkm"
                ? "Gunakan akun Google aktif Anda untuk mempublikasikan tugas atau mengelola kuota usaha."
                : "Satu pintu masuk akun Google untuk Mahasiswa, Pemilik UMKM, dan Pengelola."}
            </p>
          </div>

          {/* Google Sign-in */}
          <div>
            <GoogleSignInButton
              rolePreference={rolePreference}
              callbackUrl={callbackUrl}
            />
          </div>

          {/* Info note */}
          <div className="pt-2 text-xs text-primary-brown/75 leading-relaxed font-sans border-t border-beige space-y-2">
            <p className="font-semibold text-primary-brown text-[11px] uppercase tracking-wider">
              Bagaimana cara kerja akun Karta?
            </p>
            <div className="space-y-2 text-[11px] text-primary-brown/80">
              <div className="flex items-start gap-2">
                <Sparkles className="size-3.5 text-earth-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Pengguna Baru:</strong> Setelah login Google, Anda akan otomatis dipandu untuk memilih peran (Mahasiswa atau Pemilik UMKM).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="size-3.5 text-earth-sage shrink-0 mt-0.5" />
                <span>
                  <strong>Pengguna Terdaftar:</strong> Sistem langsung mengenali akun Anda dan membukakan dashboard sesuai peran yang tersimpan.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer back link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-primary-brown/70 hover:text-primary-brown underline underline-offset-4"
          >
            ← Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    </div>
  );
}

