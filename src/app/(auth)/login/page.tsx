import Link from "next/link";
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ShieldCheck } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string; callbackUrl?: string; email?: string }>;
}) {
  const session = await auth();
  const { as, callbackUrl, email } = await searchParams;

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
          {/* Notification if redirected from registration */}
          {email && (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <ShieldCheck className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">Email Terdaftar Ditemukan</p>
                <p className="mt-0.5 text-amber-800 leading-relaxed font-sans">
                  Email <strong className="font-mono">{email}</strong> sudah memiliki akun Karta. Silakan klik tombol di bawah untuk langsung masuk.
                </p>
              </div>
            </div>
          )}

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

          {/* Registration link */}
          <div className="text-center pt-2 text-xs text-primary-brown/70 font-sans border-t border-beige">
            Belum memiliki akun Karta?{" "}
            <Link
              href="/register"
              className="font-bold text-earth-primary hover:underline underline-offset-2"
            >
              Daftar akun baru di sini
            </Link>
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

