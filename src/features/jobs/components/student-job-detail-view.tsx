"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { takeJobAction } from "../actions";
import { Button } from "@/components/ui/button";
import { formatRupiah, formatDateTime, formatDateOnly } from "@/lib/format";
import type {
  Job,
  AcceptanceCriterion,
  ImageAsset,
  StudentProfile,
} from "@/generated/prisma/client";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Star,
  ChevronLeft,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  X,
  Maximize2,
  UserCheck,
} from "lucide-react";

interface StudentJobDetailViewProps {
  job: Job & {
    umkm: {
      id: string;
      businessName: string;
      logoUrl: string | null;
      ratingAvg: number;
      ratingCount: number;
      isCampusPartner: boolean;
      partnerCampus?: { name: string } | null;
    };
    criteria: AcceptanceCriterion[];
    images: ImageAsset[];
  };
  student: StudentProfile;
  eligibility: {
    eligible: boolean;
    reason?: string;
  };
  claimCutoffAt: Date;
}

export function StudentJobDetailView({
  job,
  student,
  eligibility,
  claimCutoffAt,
}: StudentJobDetailViewProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal konfirmasi Volunteer / Unpaid (BR-C3)
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [hasAgreedVolunteer, setHasAgreedVolunteer] = useState(false);

  // Lightbox preview gambar referensi
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const now = new Date();
  const msRemaining = new Date(claimCutoffAt).getTime() - now.getTime();
  const hoursRemaining = Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60)));

  const handleClaim = async () => {
    // Jika job unpaid dan modal belum disetujui, buka modal (BR-C3)
    if (!job.isPaid && !hasAgreedVolunteer) {
      setShowVolunteerModal(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await takeJobAction(job.id);
    setIsSubmitting(false);

    if (!res.ok) {
      setErrorMessage(res.error.message);
      return;
    }

    // Redirect ke My Jobs / Workspace (D-4)
    router.push(`/student/my-jobs/${job.id}`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* TOMBOL KEMBALI */}
      <div>
        <Link
          href="/student/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-brown/70 hover:text-earth-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Kembali ke Eksplorasi Lowongan
        </Link>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* HEADER UTAMA */}
      <div className="rounded-2xl border border-beige bg-white p-6 md:p-8 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-beige pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-earth-cream px-2.5 py-1 text-xs font-bold text-earth-coffee border border-earth-sand/30">
              {job.role}
            </span>
            {job.packageTier && (
              <span className="rounded-md bg-cream border border-beige px-2.5 py-1 text-xs font-semibold text-primary-brown">
                Tier {job.packageTier}
              </span>
            )}
            {job.beginnerFriendly && (
              <span className="rounded-full bg-blue-50 text-blue-800 border border-blue-200 px-3 py-0.5 text-xs font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Ramah Pemula
              </span>
            )}
          </div>

          <div className="text-right">
            {job.isPaid ? (
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-primary-brown/60">
                  Kompensasi Mahasiswa
                </span>
                <div className="font-heading font-bold text-xl md:text-2xl text-earth-primary">
                  {formatRupiah(job.studentShareIdr)}
                </div>
              </div>
            ) : (
              <div className="inline-flex items-center rounded-lg bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 text-xs font-bold">
                Volunteer Project (+10 Poin)
              </div>
            )}
          </div>
        </div>

        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-primary-brown leading-tight">
            {job.title}
          </h1>

          {/* Profil UMKM */}
          <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-beige/60 text-xs font-sans text-primary-brown/80">
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8 rounded-lg border border-beige bg-cream overflow-hidden flex items-center justify-center">
                {job.umkm.logoUrl ? (
                  <Image
                    src={job.umkm.logoUrl}
                    alt={job.umkm.businessName}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                ) : (
                  <Building2 className="w-4 h-4 text-primary-brown/40" />
                )}
              </div>
              <div>
                <span className="font-bold text-primary-brown">{job.umkm.businessName}</span>
                {job.umkm.isCampusPartner && (
                  <span className="ml-1 text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-1.5 py-0.2 rounded">
                    Mitra
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span className="font-semibold text-primary-brown">
                {job.umkm.ratingAvg > 0 ? job.umkm.ratingAvg.toFixed(1) : "Belum ada rating"}
              </span>
            </div>

            {job.umkm.partnerCampus && (
              <div>Kampus Binaan: {job.umkm.partnerCampus.name}</div>
            )}

            <div className="flex items-center gap-1.5 text-primary-brown/70">
              <Clock className="w-3.5 h-3.5" />
              <span>Tenggat: {formatDateOnly(job.deadlineAt)}</span>
            </div>
          </div>
        </div>

        {/* BANNER BATAS WAKTU KLAIM */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Sisa Waktu Klaim Terakhir:{" "}
              <strong>{hoursRemaining} jam lagi</strong> (sebelum batas minimum pengerjaan).
            </span>
          </div>
          <span className="text-[11px] text-amber-800/80">
            Cutoff: {formatDateTime(claimCutoffAt)}
          </span>
        </div>
      </div>

      {/* GRID KONTEN & DETAIL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI (2 Kolom): Deskripsi, Instruksi, Gambar */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-beige bg-white p-6 shadow-sm space-y-5">
            <div>
              <h2 className="font-heading text-lg font-bold text-primary-brown border-b border-beige pb-2 mb-3">
                Deskripsi Pekerjaan
              </h2>
              <p className="text-sm text-primary-brown/80 whitespace-pre-wrap leading-relaxed font-sans">
                {job.description}
              </p>
            </div>

            <div>
              <h2 className="font-heading text-lg font-bold text-primary-brown border-b border-beige pb-2 mb-3">
                Instruksi Detail & Spesifikasi Pengerjaan
              </h2>
              <div className="text-sm text-primary-brown/80 whitespace-pre-wrap leading-relaxed font-sans bg-cream/40 p-4 rounded-xl border border-beige/60">
                {job.instructions}
              </div>
            </div>

            {/* Media pengumpulan */}
            <div className="pt-2 text-xs font-sans text-primary-brown/70">
              <span>Platform Pengumpulan: </span>
              <strong className="text-primary-brown">{job.deliverableType}</strong>
            </div>
          </div>

          {/* GALERI GAMBER REFERENSI (D-3) */}
          {job.images && job.images.length > 0 && (
            <div className="rounded-2xl border border-beige bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-beige pb-2">
                <h2 className="font-heading text-base font-bold text-primary-brown">
                  Gambar Referensi dari UMKM ({job.images.length})
                </h2>
                <span className="text-xs text-primary-brown/60 font-sans">
                  Klik gambar untuk memperbesar
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {job.images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setPreviewImageUrl(img.url)}
                    className="group relative aspect-video rounded-xl border border-beige overflow-hidden bg-cream/50 focus:outline-none focus:ring-2 focus:ring-earth-primary"
                  >
                    <Image
                      src={img.url}
                      alt="Referensi Pekerjaan"
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Maximize2 className="w-5 h-5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* KOLOM KANAN: Acceptance Criteria & Tombol Ambil Job */}
        <div className="space-y-6">
          {/* CHECKLIST KRITERIA PENERIMAAN (BR-J1) */}
          <div className="rounded-2xl border border-beige bg-white p-6 shadow-sm space-y-4">
            <div className="border-b border-beige pb-2">
              <h2 className="font-heading text-base font-bold text-primary-brown">
                Kriteria Penerimaan Hasil Kerja ({job.criteria.length})
              </h2>
              <p className="text-[11px] text-primary-brown/60 font-sans mt-0.5">
                Pastikan Anda sanggup memenuhi seluruh kriteria berikut sebelum mengambil tugas.
              </p>
            </div>

            <div className="space-y-2.5">
              {job.criteria.map((c, idx) => (
                <div
                  key={c.id}
                  className="flex items-start gap-2.5 rounded-lg border border-beige/60 bg-cream/20 p-2.5 text-xs text-primary-brown"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-earth-sage/30 text-[10px] font-bold text-earth-coffee">
                    {idx + 1}
                  </span>
                  <span className="leading-snug">{c.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* KOTAK AKSI KLAIM PEKERJAAN (D-3 & D-4) */}
          <div className="rounded-2xl border border-earth-primary/40 bg-earth-cream/30 p-6 shadow-sm space-y-4">
            <div>
              <h2 className="font-heading text-base font-bold text-primary-brown">
                Ambil Pekerjaan Ini
              </h2>
              <p className="text-xs text-primary-brown/70 font-sans mt-0.5">
                Pekerjaan dialokasikan dengan prinsip First-Come First-Served.
              </p>
            </div>

            {/* JIKA TIDAK ELIGIBLE, TAMPILKAN ALASAN JELAS (D-3) */}
            {!eligibility.eligible ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5 text-red-700">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  Belum Memenuhi Syarat
                </div>
                <p className="text-[11px] leading-relaxed">
                  {eligibility.reason || "Anda belum memenuhi syarat untuk mengambil tugas ini."}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Profil dan jadwal Anda memenuhi kualifikasi untuk menyelesaikan tugas ini.
                </span>
              </div>
            )}

            <Button
              size="lg"
              onClick={handleClaim}
              disabled={!eligibility.eligible || isSubmitting}
              className="w-full gap-2 font-bold"
            >
              <span>{isSubmitting ? "Mengalokasikan..." : "Ambil Pekerjaan Sekarang"}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            {/* INFO STATUS MAHASISWA */}
            <div className="pt-2 border-t border-earth-sand/30 flex items-center justify-between text-[11px] text-primary-brown/70 font-sans">
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-earth-primary" />
                Level: <strong className="text-primary-brown">{student.level}</strong>
              </span>
              <span>{student.points} Poin Reputasi</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL KONFIRMASI VOLUNTEER (BR-C3) */}
      {showVolunteerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-beige bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-beige pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="font-heading text-lg font-bold text-primary-brown">
                  Konfirmasi Proyek Relawan
                </h3>
              </div>
              <button
                onClick={() => setShowVolunteerModal(false)}
                className="text-primary-brown/60 hover:text-primary-brown"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-2 leading-relaxed">
              <p className="font-semibold text-sm text-amber-950">
                Pekerjaan ini tidak dibayar (Unpaid / Volunteer Project).
              </p>
              <p>
                Sebagai imbalannya, Anda akan mendapatkan <strong>+10 poin reputasi penuh</strong>{" "}
                serta portofolio nyata untuk meningkatkan level dan kredibilitas profil Anda di KARTA.
              </p>
            </div>

            <label className="flex items-start gap-3 text-xs text-primary-brown cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={hasAgreedVolunteer}
                onChange={(e) => setHasAgreedVolunteer(e.target.checked)}
                className="mt-0.5 rounded border-beige text-earth-primary focus:ring-earth-primary"
              />
              <span>
                Saya memahami bahwa tugas ini tidak memberikan imbalan tunai, dan saya bersedia
                mengerjakannya dengan profesional untuk menambah poin dan portofolio.
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-beige">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVolunteerModal(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                size="sm"
                disabled={!hasAgreedVolunteer || isSubmitting}
                onClick={async () => {
                  setShowVolunteerModal(false);
                  await handleClaim();
                }}
                className="gap-1.5"
              >
                Konfirmasi & Ambil Tugas
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX PREVIEW GAMBAR */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <Image
              src={previewImageUrl}
              alt="Gambar Referensi Penuh"
              fill
              className="object-contain"
            />
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/90 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
