"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Eye, EyeOff, CheckCircle2, HelpCircle } from "lucide-react";

type JobRole = {
  id: string;
  key: string;
  label: string;
  description: string | null;
};

export default function StudentRegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Student specific fields
  const [fullName, setFullName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [studyProgram, setStudyProgram] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  // Fetch job roles from API
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  
  useEffect(() => {
    async function fetchJobRoles() {
      try {
        const response = await fetch("/api/job-roles");
        const data = await response.json();
        if (data.roles) {
          setJobRoles(data.roles);
        }
      } catch (error) {
        console.error("Failed to fetch job roles:", error);
      } finally {
        setLoadingRoles(false);
      }
    }
    fetchJobRoles();
  }, []);
  
  const [verifiedCampus, setVerifiedCampus] = useState<{
    name: string;
    city: string;
  } | null>(null);
  const [checkingReferral, setCheckingReferral] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [showReferralHelp, setShowReferralHelp] = useState(false);
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyReferral = async () => {
    if (!referralCode || referralCode.trim().length < 3) {
      setReferralError("Masukkan kode referral minimal 3 karakter.");
      return;
    }
    setCheckingReferral(true);
    setReferralError(null);
    setVerifiedCampus(null);

    try {
      const response = await fetch("/api/auth/check-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: referralCode }),
      });

      const data = await response.json();
      setCheckingReferral(false);

      if (response.ok && data.valid) {
        setVerifiedCampus({
          name: data.campusName,
          city: data.campusCity,
        });
      } else {
        setReferralError(data.message || "Kode referral tidak valid");
      }
    } catch (err) {
      setCheckingReferral(false);
      setReferralError("Gagal memverifikasi kode referral");
    }
  };

  const handleRoleToggle = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validations
    if (!fullName.trim()) {
      setError("Nama lengkap wajib diisi.");
      return;
    }

    if (!verifiedCampus) {
      setError("Harap verifikasi kode referral kampus terlebih dahulu.");
      return;
    }

    if (!studyProgram.trim()) {
      setError("Program studi wajib diisi.");
      return;
    }

    if (!username.trim()) {
      setError("Username wajib diisi.");
      return;
    }

    if (selectedRoles.length === 0) {
      setError("Pilih minimal 1 peran pekerjaan.");
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
        router.push(`/login?email=${encodeURIComponent(email)}&as=student`);
        return;
      }

      // Register user with student profile
      const registerResponse = await fetch("/api/auth/register-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          fullName: fullName.trim(),
          referralCode: referralCode.trim(),
          studyProgram: studyProgram.trim(),
          username: username.trim().toLowerCase(),
          bio: bio.trim(),
          roles: selectedRoles,
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

      // Redirect to student dashboard
      router.push("/student");
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
              Daftar sebagai Mahasiswa
            </h1>
            <p className="mt-2 text-xs text-primary-brown/75 font-sans leading-relaxed">
              Lengkapi formulir di bawah untuk membuat akun mahasiswa dan mulai membangun portofolio terverifikasi.
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
            {/* Section 1: Verifikasi Kampus */}
            <div className="border border-beige p-5 rounded-lg bg-cream/30 space-y-4">
              <div>
                <Label className="font-heading text-base font-semibold text-primary-brown">
                  1. Verifikasi Kampus Mitra
                </Label>
                <p className="text-xs text-primary-brown/70 font-sans mt-0.5">
                  Masukkan kode referral dari kampus Anda
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: ITBJUARA"
                  className="uppercase tracking-wider font-semibold font-mono"
                  disabled={isLoading || !!verifiedCampus}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleVerifyReferral}
                  disabled={checkingReferral || !referralCode || !!verifiedCampus}
                >
                  {checkingReferral ? "Cek..." : verifiedCampus ? "✓" : "Verifikasi"}
                </Button>
              </div>

              {referralError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3.5" />
                  {referralError}
                </p>
              )}

              {verifiedCampus && (
                <div className="p-3 rounded-md bg-sage-green/15 border border-sage-green/40 flex items-center gap-2 text-xs text-primary-brown">
                  <CheckCircle2 className="size-4 text-sage-green shrink-0" />
                  <span>
                    Kode valid! Terhubung ke <strong>{verifiedCampus.name}</strong> ({verifiedCampus.city}).
                  </span>
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={() => setShowReferralHelp(!showReferralHelp)}
                  className="text-xs text-primary-brown/70 hover:text-primary-brown underline flex items-center gap-1"
                >
                  <HelpCircle className="size-3.5" />
                  Belum memiliki kode referral kampus?
                </button>

                {showReferralHelp && (
                  <div className="mt-3 p-4 rounded-md bg-white border border-beige text-xs text-primary-brown/80 space-y-1.5 leading-relaxed">
                    <p className="font-semibold text-primary-brown">Cara Memperoleh Kode:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Hubungi bagian kemahasiswaan atau BEM kampus Anda</li>
                      <li>Tanyakan kepada ketua program studi</li>
                      <li>Hubungi pengelola inkubator bisnis kampus</li>
                      <li>Gunakan kode demo <strong>ITBJUARA</strong> untuk pengujian</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Akun & Profil */}
            <div className="space-y-4">
              <Label className="font-heading text-base font-semibold text-primary-brown">
                2. Data Akun & Profil
              </Label>

              <div>
                <Label htmlFor="fullName">Nama Lengkap / Nama Panggilan *</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama yang akan ditampilkan di profil"
                  required
                  disabled={isLoading}
                  className="text-sm mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  disabled={isLoading}
                  className="text-sm mt-1.5"
                />
                {email.endsWith(".ac.id") && (
                  <p className="mt-1.5 text-xs text-earth-sage flex items-center gap-1.5">
                    <CheckCircle2 className="size-3" />
                    Email kampus terdeteksi
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="studyProgram">Program Studi / Jurusan *</Label>
                <Input
                  id="studyProgram"
                  value={studyProgram}
                  onChange={(e) => setStudyProgram(e.target.value)}
                  placeholder="Contoh: Teknik Informatika"
                  required
                  disabled={isLoading}
                  className="text-sm mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="username">Username Publik *</Label>
                <div className="mt-1.5 flex items-center gap-1">
                  <span className="text-xs text-primary-brown/60 px-2.5 py-2 bg-cream border border-beige rounded-l-md font-mono">
                    karta.id/s/
                  </span>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="nama-kamu"
                    required
                    disabled={isLoading}
                    className="rounded-l-none font-mono text-xs"
                  />
                </div>
                <p className="text-[11px] text-primary-brown/60 mt-1">
                  URL portofolio publik Anda (hanya huruf kecil, angka, dan tanda hubung)
                </p>
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

              <div>
                <Label htmlFor="bio">Bio Singkat (Opsional)</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  placeholder="Ceritakan minat dan keahlian Anda..."
                  disabled={isLoading}
                  className="mt-1.5 resize-none text-xs"
                />
              </div>
            </div>

            {/* Section 3: Minat Peran */}
            <div className="border border-beige p-5 rounded-lg bg-cream/30 space-y-4">
              <div>
                <Label className="font-heading text-base font-semibold text-primary-brown">
                  3. Minat & Peran Pekerjaan (Minimal 1) *
                </Label>
                <p className="text-xs text-primary-brown/70 font-sans mt-0.5">
                  Pilih jenis pekerjaan yang ingin Anda kerjakan
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {loadingRoles ? (
                  <div className="col-span-2 text-center text-sm text-muted-foreground py-4">
                    Memuat peran pekerjaan...
                  </div>
                ) : jobRoles.length === 0 ? (
                  <div className="col-span-2 text-center text-sm text-destructive py-4">
                    Gagal memuat peran pekerjaan. Silakan refresh halaman.
                  </div>
                ) : (
                  jobRoles.map((role) => {
                    const isChecked = selectedRoles.includes(role.key);
                    return (
                      <div
                        key={role.id}
                        onClick={() => !isLoading && handleRoleToggle(role.key)}
                        className={`p-3 rounded-md border cursor-pointer flex items-center gap-3 transition-colors ${
                          isChecked
                            ? "border-primary-brown bg-primary-brown/5 text-primary-brown"
                            : "border-beige bg-white hover:bg-cream"
                        } ${isLoading || loadingRoles ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => !isLoading && !loadingRoles && handleRoleToggle(role.key)}
                          disabled={isLoading || loadingRoles}
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold">
                            {role.label}
                          </span>
                          {role.description && (
                            <span className="text-[10px] text-muted-foreground">
                              {role.description}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Memproses..." : "Daftar & Mulai Bekerja"}
            </Button>
          </form>

          {/* Login link */}
          <div className="text-center pt-2 text-xs text-primary-brown/70 font-sans border-t border-beige">
            Sudah memiliki akun?{" "}
            <Link
              href="/login?as=student"
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
