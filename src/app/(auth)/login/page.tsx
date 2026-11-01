import Link from "next/link";
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { GraduationCap, Briefcase } from "lucide-react";

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
        <div className="text-center">
          <Link href="/" className="inline-block group">
            <span className="font-heading text-3xl font-bold tracking-tight text-primary-brown">
              KARTA
            </span>
          </Link>
          <p className="mt-2 text-xs font-medium text-primary-brown/70 tracking-widest uppercase">
            Satu Pintu Masuk Pengguna
          </p>
        </div>

        {/* Card */}
        <div className="border border-beige bg-white p-8 rounded-lg space-y-6">
          {/* Header Title */}
          <div className="border-b border-beige pb-4 text-center">
            <h1 className="font-heading text-2xl font-semibold text-primary-brown">
              {rolePreference === "student"
                ? "Masuk sebagai Mahasiswa"
                : rolePreference === "umkm"
                ? "Masuk sebagai UMKM"
                : "Masuk ke Akun Karta"}
            </h1>
            <p className="mt-1 text-xs text-primary-brown/75 font-sans">
              {rolePreference === "student"
                ? "Gunakan akun Google aktif Anda untuk mengakses tugas dan portofolio."
                : rolePreference === "umkm"
                ? "Gunakan akun Google aktif Anda untuk mengelola pekerjaan dan kuota usaha."
                : "Akses bursa pekerjaan mikro, kelola kuota, dan bangun reputasi Anda."}
            </p>
          </div>

          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-cream rounded-md border border-beige/60">
            <Link
              href="/login?as=student"
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded transition-all ${
                rolePreference === "student"
                  ? "bg-primary-brown text-white"
                  : "text-primary-brown hover:bg-beige/30"
              }`}
            >
              <GraduationCap className="size-4" />
              Mahasiswa
            </Link>
            <Link
              href="/login?as=umkm"
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded transition-all ${
                rolePreference === "umkm"
                  ? "bg-primary-brown text-white"
                  : "text-primary-brown hover:bg-beige/30"
              }`}
            >
              <Briefcase className="size-4" />
              UMKM
            </Link>
          </div>

          {/* Google Sign-in */}
          <div className="pt-2">
            <GoogleSignInButton
              rolePreference={rolePreference}
              callbackUrl={callbackUrl}
            />
          </div>

          {/* Info note */}
          <div className="text-center pt-2 text-xs text-primary-brown/60 leading-relaxed font-sans border-t border-beige">
            {rolePreference === "student" ? (
              <p>
                Setelah masuk, Anda akan diminta memasukkan kode referral resmi dari kampus mitra Anda.
              </p>
            ) : rolePreference === "umkm" ? (
              <p>
                Setelah masuk, Anda dapat langsung melengkapi profil usaha dan menikmati 3 kuota gratis setiap bulan.
              </p>
            ) : (
              <p>
                Admin akan dikenali secara otomatis berdasarkan email terdaftar.
              </p>
            )}
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

