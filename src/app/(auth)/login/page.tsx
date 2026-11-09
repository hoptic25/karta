"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const rolePreference = searchParams.get("as");
  const callbackUrl = searchParams.get("callbackUrl");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email atau password salah. Silakan coba lagi.");
        setIsLoading(false);
        return;
      }

      // Fetch session to check role
      const response = await fetch("/api/auth/session");
      const session = await response.json();

      if (!session?.user) {
        setError("Terjadi kesalahan. Silakan coba lagi.");
        setIsLoading(false);
        return;
      }

      // Validasi role jika ada preference
      if (rolePreference && session.user.role) {
        const expectedRole = rolePreference === "student" ? "STUDENT" : 
                            rolePreference === "umkm" ? "UMKM" : null;
        
        if (expectedRole && session.user.role !== expectedRole) {
          const currentRoleName = session.user.role === "STUDENT" ? "Mahasiswa" :
                                 session.user.role === "UMKM" ? "UMKM" :
                                 session.user.role === "ADMIN" ? "Admin" : "Unknown";
          
          await signIn("credentials", { redirect: false }); // Sign out
          setError(`Akun Anda terdaftar sebagai ${currentRoleName}. Silakan login dengan role yang sesuai.`);
          setIsLoading(false);
          return;
        }
      }

      // Redirect berdasarkan role
      if (session.user.role === "STUDENT") {
        router.push(callbackUrl || "/student");
      } else if (session.user.role === "UMKM") {
        router.push(callbackUrl || "/umkm");
      } else if (session.user.role === "ADMIN") {
        router.push(callbackUrl || "/admin");
      } else {
        // Belum onboarding
        if (rolePreference === "student") {
          router.push("/onboarding/student");
        } else if (rolePreference === "umkm") {
          router.push("/onboarding/umkm");
        } else {
          router.push("/onboarding");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

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
                ? "Gunakan email dan password Anda untuk mengakses tugas kampus."
                : rolePreference === "umkm"
                ? "Gunakan email dan password Anda untuk mengelola pekerjaan UMKM."
                : "Masuk dengan email dan password yang terdaftar."}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2">
              <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-primary-brown mb-1.5">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                disabled={isLoading}
                className="text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-primary-brown mb-1.5">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-brown/50 hover:text-primary-brown"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          {/* Registration link */}
          <div className="text-center pt-2 text-xs text-primary-brown/70 font-sans border-t border-beige">
            Belum memiliki akun Karta?{" "}
            <Link
              href={rolePreference === "student" ? "/register/student" : 
                    rolePreference === "umkm" ? "/register/umkm" : "/"}
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
