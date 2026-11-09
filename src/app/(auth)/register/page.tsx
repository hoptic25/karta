"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const rolePreference = searchParams.get("as");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validasi
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }

    setIsLoading(true);

    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Cek apakah email sudah terdaftar
      const checkResponse = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const checkData = await checkResponse.json();

      if (checkData.exists) {
        setIsLoading(false);
        const redirectUrl = `/login?email=${encodeURIComponent(email)}${rolePreference ? `&as=${rolePreference}` : ""}`;
        router.push(redirectUrl);
        return;
      }

      // Register user
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          name: name.trim(),
          password,
        }),
      });

      if (!registerResponse.ok) {
        const data = await registerResponse.json();
        setError(data.error || "Terjadi kesalahan saat mendaftar.");
        setIsLoading(false);
        return;
      }

      // Auto sign in
      const signInResult = await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Registrasi berhasil tapi gagal login otomatis. Silakan login manual.");
        setIsLoading(false);
        return;
      }

      // Redirect to onboarding
      if (rolePreference === "student") {
        router.push("/onboarding/student");
      } else if (rolePreference === "umkm") {
        router.push("/onboarding/umkm");
      } else {
        router.push("/onboarding");
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
            Platform Micro-Job Kampus &amp; UMKM
          </p>
        </div>

        {/* Card */}
        <div className="border border-beige bg-white p-8 rounded-lg space-y-6 shadow-xs">
          {/* Header Title */}
          <div className="border-b border-beige pb-4 text-center">
            <h1 className="font-heading text-2xl font-semibold text-primary-brown">
              {rolePreference === "student"
                ? "Daftar sebagai Mahasiswa"
                : rolePreference === "umkm"
                ? "Daftar sebagai UMKM"
                : "Buat Akun Baru"}
            </h1>
            <p className="mt-2 text-xs text-primary-brown/75 font-sans leading-relaxed">
              {rolePreference === "student"
                ? "Isi formulir di bawah untuk membuat akun mahasiswa."
                : rolePreference === "umkm"
                ? "Isi formulir di bawah untuk membuat akun UMKM."
                : "Isi formulir di bawah untuk membuat akun baru."}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2">
              <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-primary-brown mb-1.5">
                Nama Lengkap
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap Anda"
                required
                disabled={isLoading}
                className="text-sm"
              />
            </div>

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
              {email.endsWith(".ac.id") && (
                <p className="mt-1.5 text-xs text-earth-sage flex items-center gap-1.5">
                  <CheckCircle2 className="size-3" />
                  Email kampus terdeteksi
                </p>
              )}
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
                  placeholder="Minimal 6 karakter"
                  required
                  disabled={isLoading}
                  className="text-sm pr-10"
                  minLength={6}
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

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-primary-brown mb-1.5">
                Konfirmasi Password
              </label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang password"
                required
                disabled={isLoading}
                className="text-sm"
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Daftar"}
            </Button>
          </form>

          {/* Login link */}
          <div className="text-center pt-2 text-xs text-primary-brown/70 font-sans border-t border-beige">
            Sudah memiliki akun?{" "}
            <Link
              href={`/login${rolePreference ? `?as=${rolePreference}` : ""}`}
              className="font-bold text-earth-primary hover:underline underline-offset-2"
            >
              Masuk di sini
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

