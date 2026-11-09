"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Award,
  Star,
  CheckCircle2,
  ExternalLink,
  Building2,
  Globe,
  Edit3,
  AlertCircle,
  Check,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { maskBankAccount } from "@/lib/format";
import {
  updateStudentPortfolioSettingsAction,
  updateStudentProfileAction,
  updateBankDetailsAction,
} from "../actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StudentProfile, Campus } from "@/generated/prisma/client";

const POPULAR_BANKS = [
  "BCA",
  "Mandiri",
  "BNI",
  "BRI",
  "BSI (Bank Syariah Indonesia)",
  "CIMB Niaga",
  "Bank Jago",
  "Seabank",
  "Permata",
  "BTPN / Jenius",
  "Bank Danamon",
  "Lainnya",
];

interface StudentProfileViewProps {
  student: StudentProfile & {
    user: {
      name: string | null;
      email: string;
      image: string | null;
    };
    campus: Campus | null;
  };
}

export function StudentProfileView({ student }: StudentProfileViewProps) {
  const router = useRouter();

  // Profile edit modal state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [fullName, setFullName] = useState(student.user.name || "");
  const [username, setUsername] = useState(student.username);
  const [studyProgram, setStudyProgram] = useState(student.studyProgram);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Bio state
  const [bio, setBio] = useState(student.bio || "");
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [bioSuccess, setBioSuccess] = useState(false);

  // Portfolio visibility state
  const [isPublic, setIsPublic] = useState(student.portfolioPublic);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);

  // Bank state
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankName, setBankName] = useState(student.bankName || "");
  const [bankAccountName, setBankAccountName] = useState(student.bankAccountName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(student.bankAccountNumber || "");
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);

  const levelColorMap: Record<string, { bg: string; text: string; label: string }> = {
    NEWCOMER: { bg: "bg-amber-100", text: "text-amber-800", label: "Newcomer (0-49 Poin)" },
    RELIABLE: { bg: "bg-slate-100", text: "text-slate-800", label: "Reliable (50-149 Poin)" },
    TRUSTED: { bg: "bg-amber-500/20", text: "text-amber-900", label: "Trusted (150-299 Poin)" },
    EXPERT: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Expert (300+ Poin)" },
  };

  const levelStyle = levelColorMap[student.level] || levelColorMap.NEWCOMER;

  const handleTogglePublic = async (checked: boolean) => {
    setIsPublic(checked);
    setIsTogglingPublic(true);
    try {
      await updateStudentPortfolioSettingsAction({ portfolioPublic: checked });
      router.refresh();
    } catch {
      setIsPublic(!checked);
    } finally {
      setIsTogglingPublic(false);
    }
  };

  const handleSaveBio = async () => {
    setIsSavingBio(true);
    try {
      const res = await updateStudentPortfolioSettingsAction({ bio: bio.trim() });
      if (res.ok) {
        setBioSuccess(true);
        setTimeout(() => setBioSuccess(false), 2000);
        router.refresh();
      }
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankError(null);

    if (!bankName.trim() || !bankAccountName.trim() || !bankAccountNumber.trim()) {
      setBankError("Semua kolom rekening bank wajib diisi.");
      return;
    }

    setIsSavingBank(true);
    try {
      const res = await updateBankDetailsAction({
        bankName: bankName.trim(),
        bankAccountName: bankAccountName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
      });

      if (!res.ok) {
        setBankError(res.error.message);
        return;
      }

      setBankModalOpen(false);
      router.refresh();
    } catch {
      setBankError("Gagal memperbarui rekening.");
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    const cleanName = fullName.trim();
    const cleanUsername = username.toLowerCase().trim();
    const cleanStudyProgram = studyProgram.trim();

    if (!cleanName || cleanName.length < 2) {
      setProfileError("Nama lengkap minimal 2 karakter.");
      return;
    }

    if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 30) {
      setProfileError("Username harus antara 3 hingga 30 karakter.");
      return;
    }

    if (!/^[a-z0-9-]+$/.test(cleanUsername)) {
      setProfileError("Username hanya boleh terdiri dari huruf kecil, angka, dan tanda hubung (-). Tanpa spasi.");
      return;
    }

    if (!cleanStudyProgram) {
      setProfileError("Program studi wajib diisi.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await updateStudentProfileAction({
        name: cleanName,
        username: cleanUsername,
        studyProgram: cleanStudyProgram,
        bio: bio.trim(),
      });

      if (!res.ok) {
        setProfileError(res.error.message);
        return;
      }

      setProfileModalOpen(false);
      router.refresh();
    } catch {
      setProfileError("Gagal menyimpan profil.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Title */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-primary-brown">
          Profil Mahasiswa
        </h1>
        <p className="text-sm text-primary-brown/70 mt-1">
          Kelola informasi identitas, visibilitas portofolio publik, dan nomor rekening pencairan honor Anda.
        </p>
      </div>

      {/* Main Profile Info Card */}
      <Card className="border-beige bg-white shadow-xs">
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl bg-earth-primary/10 border-2 border-beige flex items-center justify-center font-heading font-bold text-3xl text-earth-primary overflow-hidden shrink-0">
                {student.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={student.user.image}
                    alt={student.user.name || "Avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{student.user.name?.charAt(0) || "M"}</span>
                )}
              </div>
              <div className="space-y-1">
                <h2 className="font-heading text-xl font-bold text-primary-brown">
                  {student.user.name}
                </h2>
                <p className="text-xs text-primary-brown/70 font-mono">
                  @{student.username} &bull; {student.user.email}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-primary-brown/80 pt-1">
                  <GraduationCap className="w-4 h-4 text-earth-primary" />
                  <span>
                    <strong>{student.campus?.name}</strong> &bull; {student.studyProgram}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFullName(student.user.name || "");
                  setUsername(student.username);
                  setStudyProgram(student.studyProgram);
                  setProfileError(null);
                  setProfileModalOpen(true);
                }}
                className="border-beige hover:bg-cream text-primary-brown text-xs font-semibold gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Profil
              </Button>
              <Badge
                variant="outline"
                className={`${levelStyle.bg} ${levelStyle.text} border-transparent font-bold text-xs uppercase px-2.5 py-1`}
              >
                <Award className="w-3.5 h-3.5 mr-1" />
                {levelStyle.label}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-primary-brown/80">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span className="font-bold">{student.ratingAvg.toFixed(1)}</span>
                <span className="text-primary-brown/60">({student.ratingCount} ulasan)</span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-beige/60 pt-4 text-center">
            <div className="p-2.5 bg-cream/40 rounded-xl">
              <div className="text-[11px] text-primary-brown/60 uppercase font-semibold">
                Poin Reputasi
              </div>
              <div className="text-lg font-bold text-primary-brown mt-0.5">
                {student.points} pts
              </div>
            </div>
            <div className="p-2.5 bg-cream/40 rounded-xl">
              <div className="text-[11px] text-primary-brown/60 uppercase font-semibold">
                Tugas Selesai
              </div>
              <div className="text-lg font-bold text-emerald-700 mt-0.5 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {student.completedJobs}
              </div>
            </div>
            <div className="p-2.5 bg-cream/40 rounded-xl">
              <div className="text-[11px] text-primary-brown/60 uppercase font-semibold">
                Rating Kepuasan
              </div>
              <div className="text-lg font-bold text-primary-brown mt-0.5">
                {student.ratingAvg.toFixed(1)} / 5.0
              </div>
            </div>
            <div className="p-2.5 bg-cream/40 rounded-xl">
              <div className="text-[11px] text-primary-brown/60 uppercase font-semibold">
                Level Saat Ini
              </div>
              <div className="text-lg font-bold text-earth-primary mt-0.5">
                {student.level}
              </div>
            </div>
          </div>

          {/* Roles & Skills tags */}
          <div className="border-t border-beige/60 pt-4 space-y-2">
            <div className="text-xs font-bold text-primary-brown/70 uppercase tracking-wider">
              Peran & Kategori Terdaftar
            </div>
            <div className="flex flex-wrap gap-1.5">
              {student.jobRoleIds.map((roleId: string) => (
                <Badge
                  key={roleId}
                  variant="outline"
                  className="bg-cream text-earth-primary border-earth-primary/30 text-xs"
                >
                  {roleId.replace(/_/g, " ")}
                </Badge>
              ))}
              {student.skills.map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="bg-white text-primary-brown/70 border-beige text-xs"
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio / About Section */}
      <Card className="border-beige bg-white shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-bold text-primary-brown flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-earth-primary" />
            Deskripsi Profil (Bio Singkat)
          </CardTitle>
          <CardDescription className="text-xs">
            Perkenalkan keahlian dan minat Anda kepada UMKM pemberi tugas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={3}
            placeholder="Tuliskan pengalaman, minat, atau ringkasan portofolio Anda..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="text-xs"
          />
          <div className="flex items-center justify-between">
            {bioSuccess ? (
              <span className="text-xs text-emerald-700 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Deskripsi berhasil disimpan!
              </span>
            ) : <span />}
            <Button
              onClick={handleSaveBio}
              disabled={isSavingBio}
              size="sm"
              className="bg-earth-primary hover:bg-earth-primary/90 text-white text-xs font-semibold"
            >
              {isSavingBio ? "Menyimpan..." : "Simpan Deskripsi"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Public Portfolio Visibility Setting */}
      <Card className="border-beige bg-white shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-bold text-primary-brown flex items-center gap-2">
            <Globe className="w-4 h-4 text-earth-primary" />
            Portofolio Publik
          </CardTitle>
          <CardDescription className="text-xs">
            Bagikan hasil karya dan ulasan tugas Anda kepada publik dan calon klien UMKM.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-cream/50 border border-beige/60">
            <Checkbox
              id="portfolioPublic"
              checked={isPublic}
              disabled={isTogglingPublic}
              onCheckedChange={(checked) => handleTogglePublic(Boolean(checked))}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <label
                htmlFor="portfolioPublic"
                className="text-xs font-bold text-primary-brown cursor-pointer"
              >
                Aktifkan Halaman Portofolio Publik
              </label>
              <p className="text-xs text-primary-brown/70 leading-relaxed">
                Jika diaktifkan, halaman portofolio Anda dapat diakses di{" "}
                <code className="text-earth-primary font-mono font-semibold">
                  /s/{student.username}
                </code>
                . Halaman ini HANYA menampilkan riwayat tugas mikro yang telah disetujui, testimoni UMKM, dan level reputasi. Tidak menampilkan nomor rekening, email, maupun nominal honor.
              </p>
            </div>
          </div>

          {isPublic && (
            <div className="flex justify-end">
              <Link
                href={`/s/${student.username}`}
                target="_blank"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "text-xs flex items-center gap-1.5 border-earth-primary/40 text-earth-primary hover:bg-earth-primary/10",
                })}
              >
                <span>Buka Portofolio Publik Saya</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Details Card */}
      <Card className="border-beige bg-white shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-primary-brown flex items-center gap-2">
              <Building2 className="w-4 h-4 text-earth-primary" />
              Rekening Pencairan Honor
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBankModalOpen(true)}
              className="text-xs"
            >
              {student.bankAccountNumber ? "Ubah Rekening" : "Tambah Rekening"}
            </Button>
          </div>
          <CardDescription className="text-xs">
            Data rekening bank untuk mencairkan saldo honor pekerjaan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {student.bankAccountNumber ? (
            <div className="bg-cream/60 rounded-xl p-4 border border-beige/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-primary-brown/60 block text-[11px] uppercase font-semibold">
                  Bank / E-Wallet
                </span>
                <span className="font-bold text-primary-brown">{student.bankName}</span>
              </div>
              <div>
                <span className="text-primary-brown/60 block text-[11px] uppercase font-semibold">
                  Nomor Rekening
                </span>
                <span className="font-mono font-bold text-primary-brown">
                  {maskBankAccount(student.bankAccountNumber)}
                </span>
              </div>
              <div>
                <span className="text-primary-brown/60 block text-[11px] uppercase font-semibold">
                  Nama Pemilik Rekening
                </span>
                <span className="font-bold text-primary-brown">{student.bankAccountName}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-beige text-center text-xs text-primary-brown/70">
              Belum ada rekening pencairan yang didaftarkan.
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIALOG: Ubah Rekening Bank */}
      <Dialog open={bankModalOpen} onOpenChange={setBankModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <form onSubmit={handleSaveBank}>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl font-bold text-primary-brown">
                Atur Rekening Pencairan
              </DialogTitle>
              <DialogDescription className="text-xs text-primary-brown/70">
                Pastikan nama rekening sesuai identitas Anda untuk verifikasi penarikan dana.
              </DialogDescription>
            </DialogHeader>

            {bankError && (
              <div className="mt-4 p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bankError}</span>
              </div>
            )}

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="profileBankName" className="text-xs font-semibold">
                  Nama Bank / E-Wallet
                </Label>
                <Select value={bankName} onValueChange={(val) => setBankName(val || "")}>
                  <SelectTrigger id="profileBankName" className="w-full">
                    <SelectValue placeholder="Pilih Bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_BANKS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {bankName === "Lainnya" && (
                  <Input
                    placeholder="Ketikkan nama bank Anda"
                    onChange={(e) => setBankName(e.target.value)}
                    className="mt-2 text-xs"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileBankAccountNumber" className="text-xs font-semibold">
                  Nomor Rekening
                </Label>
                <Input
                  id="profileBankAccountNumber"
                  type="text"
                  placeholder="Contoh: 1234567890"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value.replace(/[^0-9]/g, ""))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileBankAccountName" className="text-xs font-semibold">
                  Nama Pemilik Rekening
                </Label>
                <Input
                  id="profileBankAccountName"
                  type="text"
                  placeholder="Sesuai buku tabungan"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBankModalOpen(false)}
                disabled={isSavingBank}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSavingBank}
                className="bg-earth-primary hover:bg-earth-primary/90 text-white text-xs font-semibold"
              >
                {isSavingBank ? "Menyimpan..." : "Simpan Rekening"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Modal */}
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="max-w-md bg-white border-beige">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-primary-brown flex items-center gap-2">
              <User className="w-5 h-5 text-earth-primary" />
              Edit Profil Mahasiswa
            </DialogTitle>
            <DialogDescription className="text-xs text-primary-brown/70">
              Perbarui nama lengkap, username identitas publik, dan program studi Anda.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {profileError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="profileFullName" className="text-xs font-semibold text-primary-brown">
                  Nama Lengkap
                </Label>
                <Input
                  id="profileFullName"
                  type="text"
                  placeholder="Contoh: Karin Renata Putri"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="text-xs"
                  required
                />
                <p className="text-[11px] text-primary-brown/60">
                  Boleh ada spasi. Ditampilkan pada sapaan dashboard dan sertifikat tugas.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="profileUsername" className="text-xs font-semibold text-primary-brown">
                  Username Portofolio Publik
                </Label>
                <div className="flex items-center rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-within:ring-1 focus-within:ring-ring">
                  <span className="text-primary-brown/50 font-mono select-none">karta.id/s/</span>
                  <input
                    id="profileUsername"
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                    }
                    placeholder="karin-putri"
                    className="flex-1 bg-transparent px-1 py-1 font-mono text-xs outline-none text-primary-brown"
                    required
                  />
                </div>
                <p className="text-[11px] text-primary-brown/60">
                  Hanya huruf kecil, angka, dan tanda hubung (-). Tanpa spasi.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="profileStudyProgram" className="text-xs font-semibold text-primary-brown">
                  Program Studi
                </Label>
                <Input
                  id="profileStudyProgram"
                  type="text"
                  placeholder="Contoh: S1 Sistem Informasi"
                  value={studyProgram}
                  onChange={(e) => setStudyProgram(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProfileModalOpen(false)}
                disabled={isSavingProfile}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSavingProfile}
                className="bg-earth-primary hover:bg-earth-primary/90 text-white text-xs font-semibold"
              >
                {isSavingProfile ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
