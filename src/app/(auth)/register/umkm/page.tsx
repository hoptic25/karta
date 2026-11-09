"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function UmkmRegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // UMKM specific fields
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validations
    if (!businessName.trim()) {
      setError("Nama usaha wajib diisi.");
      return;
    }

    if (!category.trim()) {
      setError("Kategori usaha wajib diisi.");
      return;
    }

    if (!province.trim()) {
      setError("Provinsi wajib diisi.");
      return;
    }

    if (!city.trim()) {
      setError("Kota wajib diisi.");
      return;
    }

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

      // Check if email exists
      const checkResponse = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const checkData = await checkResponse.json();

      if (checkData.exists) {
        setIsLoading(false);
        router.push(`/login?email=${encodeURIComponent(email)}&as=umkm`);
        return;
      }

      // Register user with UMKM profile
      const registerResponse = await fetch("/api/auth/register-umkm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          businessName: businessName.trim(),
          category: category.trim(),
          province: province.trim(),
          city: city.trim(),
          phone: phone.trim(),
          description: description.trim(),
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

      // Redirect to UMKM dashboard
      router.push("/umkm");
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-cream px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
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
              Daftar sebagai UMKM
            </h1>
            <p className="mt-2 text-xs text-primary-brown/75 font-sans leading-relaxed">
              Daftarkan bisnis Anda untuk mulai mempublikasikan tugas mikro kepada talenta kampus.
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Profil Usaha */}
            <div className="border border-beige p-5 rounded-lg bg-cream/30 space-y-4">
              <div>
                <Label className="font-heading text-base font-semibold text-primary-brown">
                  1. Profil Usaha / Bisnis
                </Label>
                <p className="text-xs text-primary-brown/70 font-sans mt-0.5">
                  Informasi ini akan ditampilkan kepada mahasiswa
                </p>
              </div>

              <div>
                <Label htmlFor="businessName">Nama Usaha / Bisnis *</Label>
                <Input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Contoh: Kopi Nusantara / Batik Lestari"
                  required
                  disabled={isLoading}
                  className="text-sm mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="category">Kategori Usaha *</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Contoh: Makanan & Minuman / Fashion / Kerajinan"
                  required
                  disabled={isLoading}
                  className="text-sm mt-1.5"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="province">Provinsi *</Label>
                  <Input
                    id="province"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="Contoh: Jawa Barat"
                    required
                    disabled={isLoading}
                    className="text-sm mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="city">Kota / Kabupaten *</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Contoh: Kota Bandung"
                    required
                    disabled={isLoading}
                    className="text-sm mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Nomor Telepon / WhatsApp (Opsional)</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567890"
                  disabled={isLoading}
                  className="text-sm mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="description">Deskripsi Singkat Usaha (Opsional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Ceritakan produk, visi, atau bidang usaha Anda..."
                  disabled={isLoading}
                  className="mt-1.5 resize-none text-xs"
                />
              </div>
            </div>

            {/* Section 2: Akun Login */}
            <div className="space-y-4">
              <Label className="font-heading text-base font-semibold text-primary-brown">
                2. Data Akun Login
              </Label>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@bisnis.com"
                  required
                  disabled={isLoading}
                  className="text-sm mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <div className="relative mt-1.5">
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
                <Label htmlFor="confirmPassword">Konfirmasi Password *</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password"
                  required
                  disabled={isLoading}
                  className="text-sm mt-1.5"
                  minLength={6}
                />
              </div>
            </div>

            {/* Benefit Info */}
            <div className="p-4 rounded-lg bg-sage-green/15 border border-sage-green/40 text-xs text-primary-brown leading-relaxed">
              <CheckCircle2 className="size-4 text-sage-green inline mr-2" />
              <strong>Benefit Langsung:</strong> Setelah registrasi, Anda langsung mendapatkan{" "}
              <strong>3 kuota pekerjaan sukarela (Volunteer Project) gratis</strong> untuk bulan ini.
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Memproses..." : "Daftar & Buka Dashboard UMKM"}
            </Button>
          </form>

          {/* Login link */}
          <div className="text-center pt-2 text-xs text-primary-brown/70 font-sans border-t border-beige">
            Sudah memiliki akun?{" "}
            <Link
              href="/login?as=umkm"
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
