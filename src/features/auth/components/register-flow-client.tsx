"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { GraduationCap, Briefcase, ArrowRight, AlertCircle, CheckCircle2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkEmailAvailabilityAction, checkUsernameAvailabilityAction } from "@/features/auth/actions";

type RoleOption = "student" | "umkm";

export function RegisterFlowClient({
  initialRole,
}: {
  initialRole?: RoleOption;
}) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(initialRole || null);

  // Form states
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");

  // Validation / live check states
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<
    | { state: "idle" }
    | { state: "available" }
    | { state: "registered"; name?: string | null; role?: string | null }
    | { state: "invalid"; message: string }
  >({ state: "idle" });

  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<
    | { state: "idle" }
    | { state: "available" }
    | { state: "taken" }
    | { state: "invalid"; message: string }
  >({ state: "idle" });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live email check on blur
  const handleEmailBlur = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setEmailStatus({ state: "idle" });
      return;
    }
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setEmailStatus({ state: "invalid", message: "Format email tidak valid (harus ada @ dan domain)." });
      return;
    }

    setCheckingEmail(true);
    const res = await checkEmailAvailabilityAction(cleanEmail);
    setCheckingEmail(false);

    if (!res.ok) {
      setEmailStatus({ state: "invalid", message: res.error.message });
      return;
    }

    if (res.data.registered) {
      setEmailStatus({
        state: "registered",
        name: res.data.name,
        role: res.data.role,
      });
    } else {
      setEmailStatus({ state: "available" });
    }
  };

  // Live username check on blur (for student)
  const handleUsernameBlur = async () => {
    if (selectedRole !== "student") return;
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setUsernameStatus({ state: "idle" });
      return;
    }
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      setUsernameStatus({ state: "invalid", message: "Username harus antara 3 hingga 30 karakter." });
      return;
    }
    if (!/^[a-z0-9-]+$/.test(cleanUsername)) {
      setUsernameStatus({ state: "invalid", message: "Hanya boleh huruf kecil, angka, dan tanda hubung (-)." });
      return;
    }

    setCheckingUsername(true);
    const res = await checkUsernameAvailabilityAction(cleanUsername);
    setCheckingUsername(false);

    if (!res.ok) {
      setUsernameStatus({ state: "invalid", message: res.error.message });
      return;
    }

    if (res.data.available) {
      setUsernameStatus({ state: "available" });
    } else {
      setUsernameStatus({ state: "taken" });
    }
  };

  const handleStartGoogleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if email already registered
    if (emailStatus.state === "registered") {
      router.push(`/login?email=${encodeURIComponent(email)}`);
      return;
    }

    if (emailStatus.state !== "available" && emailStatus.state !== "idle") {
      return;
    }

    if (selectedRole === "student" && usernameStatus.state === "taken") {
      return;
    }

    setIsSubmitting(true);
    const targetOnboarding = selectedRole === "student" ? "/onboarding/student" : "/onboarding/umkm";

    try {
      await signIn("google", {
        redirectTo: targetOnboarding,
      });
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* 1. Step Indicator / Role Picker */}
      {!selectedRole ? (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary-brown">
              Pilih Peran Anda di Karta
            </h1>
            <p className="text-xs sm:text-sm text-primary-brown/75 font-sans max-w-md mx-auto">
              Tentukan bagaimana Anda ingin bergabung dalam ekosistem Karta. Pilihan peran ini berlaku untuk akun Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Student Card */}
            <button
              type="button"
              onClick={() => setSelectedRole("student")}
              className="group text-left border-2 border-beige bg-white p-6 rounded-xl hover:border-earth-primary hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="p-3 w-fit rounded-lg bg-cream text-primary-brown mb-4 group-hover:bg-earth-primary group-hover:text-white transition-colors">
                  <GraduationCap className="size-6" />
                </div>
                <h2 className="font-heading text-lg font-bold text-primary-brown">
                  Mahasiswa Kampus
                </h2>
                <p className="mt-1.5 text-xs text-primary-brown/75 font-sans leading-relaxed">
                  Ambil pekerjaan mikro dari UMKM, peroleh imbalan terlindungi, dan bangun reputasi serta portofolio terverifikasi.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold uppercase tracking-wider text-earth-primary">
                <span>Daftar sebagai Mahasiswa</span>
                <ArrowRight className="size-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>

            {/* UMKM Card */}
            <button
              type="button"
              onClick={() => setSelectedRole("umkm")}
              className="group text-left border-2 border-beige bg-white p-6 rounded-xl hover:border-earth-primary hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="p-3 w-fit rounded-lg bg-cream text-primary-brown mb-4 group-hover:bg-earth-primary group-hover:text-white transition-colors">
                  <Briefcase className="size-6" />
                </div>
                <h2 className="font-heading text-lg font-bold text-primary-brown">
                  Pemilik Usaha (UMKM)
                </h2>
                <p className="mt-1.5 text-xs text-primary-brown/75 font-sans leading-relaxed">
                  Publikasikan tugas mikro bisnis Anda, dapatkan hasil cepat dari mahasiswa unggul, dan nikmati 3 kuota tugas gratis setiap bulan.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs font-bold uppercase tracking-wider text-earth-primary">
                <span>Daftar sebagai UMKM</span>
                <ArrowRight className="size-3.5 ml-1.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          </div>

          <div className="text-center pt-4 border-t border-beige">
            <p className="text-xs text-primary-brown/70 font-sans">
              Sudah memiliki akun Karta sebelumnya?{" "}
              <Link
                href="/login"
                className="font-bold text-earth-primary hover:underline underline-offset-2"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      ) : (
        /* 2. Registration Form with Live Duplicate Checking */
        <div className="border border-beige bg-white p-6 sm:p-8 rounded-xl shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-beige pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-earth-primary">
                Pendaftaran Akun Baru
              </span>
              <h2 className="font-heading text-xl font-bold text-primary-brown mt-0.5">
                {selectedRole === "student" ? "Daftar sebagai Mahasiswa" : "Daftar sebagai Pemilik UMKM"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedRole(null);
                setEmailStatus({ state: "idle" });
                setUsernameStatus({ state: "idle" });
              }}
              className="text-xs text-primary-brown/60 hover:text-primary-brown hover:underline"
            >
              Ubah Peran
            </button>
          </div>

          <form onSubmit={handleStartGoogleRegistration} className="space-y-5">
            {/* Registered Account Alert Banner */}
            {emailStatus.state === "registered" && (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-amber-950">
                      Email ini sudah terdaftar di Karta!
                    </p>
                    <p className="mt-1 text-amber-800 leading-relaxed font-sans">
                      Akun dengan email <strong className="font-mono">{email}</strong> sudah terdaftar sebagai{" "}
                      <strong>{emailStatus.role === "STUDENT" ? "Mahasiswa" : emailStatus.role === "UMKM" ? "UMKM" : "Pengguna"}</strong>
                      {emailStatus.name ? ` atas nama "${emailStatus.name}"` : ""}. Anda tidak perlu mendaftar ulang.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <Link href={`/login?email=${encodeURIComponent(email)}`}>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-primary-brown hover:bg-earth-dark text-white font-semibold text-xs h-9 px-4 gap-1.5 shadow-sm"
                    >
                      <LogIn className="size-3.5" />
                      Langsung Masuk (Login)
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="regEmail" className="text-xs font-semibold text-primary-brown">
                Alamat Email Akun Google Anda <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="regEmail"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailStatus.state !== "idle") setEmailStatus({ state: "idle" });
                  }}
                  onBlur={handleEmailBlur}
                  placeholder="nama@gmail.com atau email institusi"
                  required
                  className={`text-xs pr-10 ${
                    emailStatus.state === "registered"
                      ? "border-amber-400 bg-amber-50/50"
                      : emailStatus.state === "available"
                      ? "border-emerald-500 bg-emerald-50/20"
                      : ""
                  }`}
                />
                {checkingEmail && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-primary-brown/50">
                    Memeriksa...
                  </span>
                )}
                {emailStatus.state === "available" && (
                  <CheckCircle2 className="size-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>
              <p className="text-[11px] text-primary-brown/65">
                Pastikan email ini aktif dan terdaftar sebagai akun Google untuk verifikasi identitas.
              </p>
              {emailStatus.state === "invalid" && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3.5" />
                  {emailStatus.message}
                </p>
              )}
            </div>

            {/* Username Field (Khusus Mahasiswa) */}
            {selectedRole === "student" && (
              <div className="space-y-1.5">
                <Label htmlFor="regUsername" className="text-xs font-semibold text-primary-brown">
                  Username Portofolio Publik <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-within:ring-1 focus-within:ring-ring">
                  <span className="text-primary-brown/50 font-mono select-none">karta.id/s/</span>
                  <input
                    id="regUsername"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                      if (usernameStatus.state !== "idle") setUsernameStatus({ state: "idle" });
                    }}
                    onBlur={handleUsernameBlur}
                    placeholder="nama-kamu"
                    required
                    className="flex-1 bg-transparent px-1 py-1 font-mono text-xs outline-none text-primary-brown"
                  />
                  {checkingUsername && (
                    <span className="text-[10px] text-primary-brown/50">Cek...</span>
                  )}
                  {usernameStatus.state === "available" && (
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  )}
                </div>
                <p className="text-[11px] text-primary-brown/65">
                  Digunakan untuk tautan portofolio publik Anda. Tanpa spasi.
                </p>
                {usernameStatus.state === "taken" && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3.5" />
                    Username ini sudah digunakan mahasiswa lain. Silakan pilih username lain.
                  </p>
                )}
                {usernameStatus.state === "invalid" && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3.5" />
                    {usernameStatus.message}
                  </p>
                )}
              </div>
            )}

            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <Label htmlFor="regFullName" className="text-xs font-semibold text-primary-brown">
                {selectedRole === "student" ? "Nama Lengkap Mahasiswa" : "Nama Pemilik / Penanggung Jawab"}
              </Label>
              <Input
                id="regFullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Karin Renata Putri"
                className="text-xs"
              />
              <p className="text-[11px] text-primary-brown/65">
                Boleh menggunakan spasi dan huruf kapital.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-3">
              {emailStatus.state === "registered" ? (
                <Link href={`/login?email=${encodeURIComponent(email)}`} className="w-full">
                  <Button
                    type="button"
                    className="w-full h-11 bg-primary-brown hover:bg-earth-dark text-white font-semibold text-xs tracking-wide shadow-sm"
                  >
                    <LogIn className="size-4 mr-2" />
                    Email Sudah Terdaftar — Beralih ke Halaman Masuk
                  </Button>
                </Link>
              ) : (
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    checkingEmail ||
                    checkingUsername ||
                    usernameStatus.state === "taken" ||
                    !email.trim()
                  }
                  className="w-full h-11 bg-earth-primary hover:bg-earth-primary/90 text-white font-semibold text-xs tracking-wide shadow-sm flex items-center justify-center gap-2.5"
                >
                  <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  {isSubmitting
                    ? "Menghubungkan Akun Google..."
                    : `Verifikasi Akun Google & Lanjut ke ${
                        selectedRole === "student" ? "Mahasiswa" : "UMKM"
                      }`}
                </Button>
              )}
            </div>

            <div className="text-center pt-2 text-xs text-primary-brown/70 font-sans border-t border-beige">
              Sudah memiliki akun?{" "}
              <Link href="/login" className="font-bold text-earth-primary hover:underline">
                Masuk di sini
              </Link>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

