"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  studentOnboardingSchema,
  type StudentOnboardingInput,
  jobRolesEnum,
} from "../schemas";
import {
  completeStudentOnboardingAction,
  checkReferralCodeAction,
} from "../actions";
import { JOB_ROLE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";

export function StudentOnboardingForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [checkingReferral, setCheckingReferral] = useState(false);
  const [verifiedCampus, setVerifiedCampus] = useState<{
    name: string;
    city: string;
  } | null>(null);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [showReferralHelp, setShowReferralHelp] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StudentOnboardingInput>({
    resolver: zodResolver(studentOnboardingSchema),
    defaultValues: {
      referralCode: "",
      studyProgram: "",
      username: "",
      roles: [],
      bio: "",
      skills: [],
      avatarUrl: "",
    },
  });

  const selectedRoles = watch("roles") || [];
  const currentReferral = watch("referralCode");

  const handleVerifyReferral = async () => {
    if (!currentReferral || currentReferral.trim().length < 3) {
      setReferralError("Masukkan kode referral minimal 3 karakter.");
      return;
    }
    setCheckingReferral(true);
    setReferralError(null);
    setVerifiedCampus(null);

    const res = await checkReferralCodeAction(currentReferral);
    setCheckingReferral(false);

    if (res.ok) {
      setVerifiedCampus({
        name: res.data.campusName,
        city: res.data.campusCity,
      });
    } else {
      setReferralError(res.error.message);
    }
  };

  const handleRoleToggle = (role: (typeof jobRolesEnum)[number]) => {
    if (selectedRoles.includes(role)) {
      setValue(
        "roles",
        selectedRoles.filter((r) => r !== role),
        { shouldValidate: true }
      );
    } else {
      setValue("roles", [...selectedRoles, role], { shouldValidate: true });
    }
  };

  const onSubmit = async (data: StudentOnboardingInput) => {
    setServerError(null);
    const res = await completeStudentOnboardingAction(data);
    if (!res.ok) {
      setServerError(res.error.message);
      return;
    }
    router.push("/student");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {serverError && (
        <div className="p-4 rounded-md border border-destructive/40 bg-destructive/10 text-destructive text-sm flex items-start gap-2">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {/* 1. KODE REFERRAL SECTION (BR-A2, BR-A3) */}
      <div className="border border-beige p-6 rounded-lg bg-white space-y-4">
        <div>
          <Label className="font-heading text-lg font-semibold text-primary-brown">
            1. Verifikasi Kampus Mitra
          </Label>
          <p className="text-xs text-primary-brown/70 font-sans mt-0.5">
            Akses bursa mahasiswa terbuka bagi kampus yang telah bermitra resmi dengan Karta.
          </p>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              {...register("referralCode")}
              placeholder="Contoh: ITBJUARA"
              className="uppercase tracking-wider font-semibold font-mono"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleVerifyReferral}
            disabled={checkingReferral || !currentReferral}
          >
            {checkingReferral ? "Cek..." : "Verifikasi"}
          </Button>
        </div>

        {errors.referralCode && (
          <p className="text-xs text-destructive">{errors.referralCode.message}</p>
        )}

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

        {/* Guidance if user doesn't have code (BR-A6) */}
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
            <div className="mt-3 p-4 rounded-md bg-cream border border-beige text-xs text-primary-brown/80 space-y-1.5 leading-relaxed">
              <p className="font-semibold text-primary-brown">
                Panduan Memperoleh Kode Referral:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Hubungi bagian kemahasiswaan atau BEM universitas Anda.</li>
                <li>Tanyakan kepada ketua program studi atau dosen pembimbing akademik.</li>
                <li>Hubungi pengelola inkubator bisnis atau pusat karier kampus Anda.</li>
                <li>Gunakan kode demo <strong>ITBJUARA</strong> untuk pengujian prototipe.</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* 2. DATA AKADEMIK & PROFIL */}
      <div className="border border-beige p-6 rounded-lg bg-white space-y-6">
        <div>
          <Label className="font-heading text-lg font-semibold text-primary-brown">
            2. Data Profil Mahasiswa
          </Label>
          <p className="text-xs text-primary-brown/70 font-sans mt-0.5">
            Lengkapi informasi dasar untuk ditampilkan pada portofolio Anda.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="studyProgram">Program Studi / Jurusan</Label>
            <Input
              id="studyProgram"
              {...register("studyProgram")}
              placeholder="Contoh: Teknik Informatika / Manajemen Bisnis"
              className="mt-1.5"
            />
            {errors.studyProgram && (
              <p className="text-xs text-destructive mt-1">
                {errors.studyProgram.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="username">Username Karta (Publik)</Label>
            <div className="mt-1.5 flex items-center gap-1">
              <span className="text-xs text-primary-brown/60 px-2.5 py-2 bg-cream border border-beige rounded-l-md font-mono">
                karta.id/s/
              </span>
              <Input
                id="username"
                {...register("username")}
                placeholder="nama-kamu"
                className="rounded-l-none font-mono text-xs"
              />
            </div>
            {errors.username && (
              <p className="text-xs text-destructive mt-1">
                {errors.username.message}
              </p>
            )}
            <p className="text-[11px] text-primary-brown/60 mt-1">
              Gunakan huruf kecil, angka, dan tanda hubung (-). Ini akan menjadi URL portofolio publik Anda.
            </p>
          </div>

          <div>
            <Label htmlFor="bio">Deskripsi Singkat / Bio (Opsional)</Label>
            <Textarea
              id="bio"
              {...register("bio")}
              rows={3}
              placeholder="Ceritakan minat dan keahlian utama Anda..."
              className="mt-1.5 resize-none text-xs"
            />
            {errors.bio && (
              <p className="text-xs text-destructive mt-1">
                {errors.bio.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. PEMILIHAN PERAN / ROLES (BR-A7) */}
      <div className="border border-beige p-6 rounded-lg bg-white space-y-4">
        <div>
          <Label className="font-heading text-lg font-semibold text-primary-brown">
            3. Minat & Peran Pekerjaan (Minimal 1)
          </Label>
          <p className="text-xs text-primary-brown/70 font-sans mt-0.5">
            Anda hanya dapat mengklaim pekerjaan mikro yang sesuai dengan peran yang dipilih di sini.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {jobRolesEnum.map((role) => {
            const isChecked = selectedRoles.includes(role);
            return (
              <div
                key={role}
                onClick={() => handleRoleToggle(role)}
                className={`p-3 rounded-md border cursor-pointer flex items-center gap-3 transition-colors ${
                  isChecked
                    ? "border-primary-brown bg-primary-brown/5 text-primary-brown"
                    : "border-beige bg-cream/30 hover:bg-cream"
                }`}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => handleRoleToggle(role)}
                />
                <span className="text-xs font-semibold">
                  {JOB_ROLE_LABELS[role] || role}
                </span>
              </div>
            );
          })}
        </div>

        {errors.roles && (
          <p className="text-xs text-destructive">{errors.roles.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 text-sm font-semibold tracking-wider"
      >
        {isSubmitting ? "Menyimpan Profil..." : "Selesaikan & Buka Bursa Pekerjaan"}
      </Button>
    </form>
  );
}
