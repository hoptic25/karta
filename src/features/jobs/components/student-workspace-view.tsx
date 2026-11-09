"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  startWorkAction,
  withdrawJobAction,
  submitWorkAction,
} from "../actions";
import { formatRupiah, formatDateTime, formatDateOnly } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  Job,
  AcceptanceCriterion,
  ImageAsset,
  JobAssignment,
  Submission,
  Review,
  LedgerEntry,
  Dispute,
  FailureReport,
} from "@/generated/prisma/client";
import { StudentDisputeModal } from "./student-dispute-modal";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  ChevronLeft,
  ExternalLink,
  ShieldAlert,
  Send,
  Play,
  LogOut,
  X,
  Maximize2,
  Sparkles,
  RotateCcw,
  Scale,
} from "lucide-react";

export type WorkspaceData = JobAssignment & {
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
    dispute?: Dispute | null;
    failureReports?: FailureReport[];
  };
  submissions: (Submission & {
    review: Review | null;
  })[];
  ledgerEntries: LedgerEntry[];
};

interface StudentWorkspaceViewProps {
  assignment: WorkspaceData;
}

export function StudentWorkspaceView({ assignment }: StudentWorkspaceViewProps) {
  const router = useRouter();
  const job = assignment.job;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State Pengumpulan
  const [deliverableUrl, setDeliverableUrl] = useState("");
  const [submissionNote, setSubmissionNote] = useState("");
  const [checkedCriteria, setCheckedCriteria] = useState<Record<string, boolean>>({});

  // Modal Mundur
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");

  // Modal Sengketa
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

  // Lightbox preview gambar referensi
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const toggleCriterion = (criterionId: string) => {
    setCheckedCriteria((prev) => ({
      ...prev,
      [criterionId]: !prev[criterionId],
    }));
  };

  const allCriteriaChecked =
    job.criteria.length > 0 &&
    job.criteria.every((c) => checkedCriteria[c.id] === true);

  // Aksi Mulai Kerjakan (BR-E1)
  const handleStartWork = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await startWorkAction(job.id);
    setIsSubmitting(false);

    if (!res.ok) {
      setErrorMessage(res.error.message);
      return;
    }

    setSuccessMessage("Waktu pengerjaan telah dimulai! Silakan selesaikan tugas sebelum tenggat waktu.");
    router.refresh();
  };

  // Aksi Mundur dari Pekerjaan (BR-E6)
  const handleWithdraw = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await withdrawJobAction(job.id, withdrawReason);
    setIsSubmitting(false);

    if (!res.ok) {
      setErrorMessage(res.error.message);
      return;
    }

    setShowWithdrawModal(false);
    router.push("/student/my-jobs");
  };

  // Aksi Submit Pengumpulan (BR-E2)
  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allCriteriaChecked) {
      setErrorMessage("Harap centang seluruh checklist kriteria penerimaan sebelum mengumpulkan.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const selfCheckList = job.criteria.map((c) => ({
      criterionId: c.id,
      checked: !!checkedCriteria[c.id],
    }));

    const res = await submitWorkAction({
      jobId: job.id,
      url: deliverableUrl,
      note: submissionNote,
      selfCheck: selfCheckList,
    });

    setIsSubmitting(false);

    if (!res.ok) {
      setErrorMessage(res.error.message);
      return;
    }

    setSuccessMessage(
      `Pengumpulan #${res.data.submissionNumber} berhasil! Hasil kerja Anda kini menunggu peninjauan oleh UMKM.`
    );
    setDeliverableUrl("");
    setSubmissionNote("");
    setCheckedCriteria({});
    router.refresh();
  };

  const latestSubmission = assignment.submissions[assignment.submissions.length - 1];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* TOMBOL KEMBALI */}
      <div>
        <Link
          href="/student/my-jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-brown/70 hover:text-earth-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Kembali ke Daftar Tugas Saya
        </Link>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* HEADER UTAMA WORKSPACE */}
      <div className="rounded-2xl border border-beige bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-beige/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-earth-cream px-2.5 py-1 text-xs font-bold text-earth-coffee border border-earth-sand/30">
              {job.jobRoleId}
            </span>
            <span className="rounded-md border border-beige bg-cream px-2.5 py-1 text-xs font-semibold text-primary-brown">
              Format: {job.deliverableType}
            </span>
          </div>

          <div className="text-right">
            <span className="text-sm font-bold text-primary-brown">
              {job.isPaid ? (
                formatRupiah(job.studentShareIdr)
              ) : (
                <span className="text-amber-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Volunteer (Poin Penuh)
                </span>
              )}
            </span>
          </div>
        </div>

        <div>
          <h1 className="font-heading text-2xl font-bold text-primary-brown">
            {job.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs font-sans text-primary-brown/70">
            <div className="flex items-center gap-2">
              <div className="relative h-5 w-5 rounded overflow-hidden flex items-center justify-center bg-cream">
                {job.umkm.logoUrl ? (
                  <Image
                    src={job.umkm.logoUrl}
                    alt={job.umkm.businessName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <Building2 className="w-3.5 h-3.5 text-primary-brown/40" />
                )}
              </div>
              <span className="font-bold text-primary-brown">{job.umkm.businessName}</span>
              {job.umkm.isCampusPartner && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1 rounded">
                  Mitra Kampus
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Tenggat: <strong>{formatDateTime(job.deadlineAt)}</strong></span>
            </div>
          </div>
        </div>

        {/* STATUS BANNER INTERAKTIF */}
        {job.status === "CLAIMED" && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Play className="w-4 h-4 text-blue-700" />
                Pekerjaan Siap Dikerjakan (Belum Dimulai)
              </div>
              <p className="text-[11px] text-blue-800/80">
                Tekan tombol &quot;Mulai Kerjakan&quot; untuk mencatat waktu mulai kerja dan membuka form pengumpulan.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowWithdrawModal(true)}
                disabled={isSubmitting}
                className="text-destructive border-red-200 hover:bg-red-50 text-xs"
              >
                Mundur
              </Button>
              <Button
                size="sm"
                onClick={handleStartWork}
                disabled={isSubmitting}
                className="gap-1.5 text-xs font-bold"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Mulai Kerjakan
              </Button>
            </div>
          </div>
        )}

        {job.status === "SUBMITTED" && (
          <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-4 text-xs text-purple-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-700" />
              Hasil Kerja Sedang Ditinjau oleh UMKM
            </div>
            <p className="text-[11px] text-purple-800/80">
              Pengumpulan Anda telah tersimpan. UMKM memiliki SLA peninjauan 3 hari
              {job.reviewDueAt ? ` (s/d ${formatDateTime(job.reviewDueAt)})` : ""}. Jika lewat batas SLA, sistem akan menerima tugas secara otomatis.
            </p>
          </div>
        )}

        {job.status === "REVISION_REQUESTED" && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-xs text-orange-950 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-orange-800">
              <RotateCcw className="w-4 h-4" />
              Permintaan Revisi #{job.revisionCount} dari UMKM
            </div>
            {latestSubmission?.review?.reason && (
              <div className="rounded-lg bg-white/80 p-3 border border-orange-200/60 text-xs text-orange-900">
                <strong>Catatan dari UMKM:</strong> &ldquo;{latestSubmission.review.reason}&rdquo;
              </div>
            )}
            <p className="text-[11px] text-orange-800">
              Harap perbaiki hasil kerja Anda sesuai catatan kriteria di bawah dan kumpulkan kembali sebelum batas revisi
              {job.revisionDueAt ? ` (${formatDateTime(job.revisionDueAt)})` : ""}.
            </p>
          </div>
        )}

        {job.status === "ACCEPTED" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
              Selamat! Tugas Ini Telah Diterima dan Selesai
            </div>
            <p className="text-[11px] text-emerald-800">
              Hasil kerja Anda telah disetujui. Poin reputasi telah ditambahkan ke akun Anda dan dana imbalan telah dialokasikan ke saldo dompet.
            </p>
          </div>
        )}

        {job.status === "REJECTED" && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-950 space-y-3">
            <div className="font-bold flex items-center gap-1.5 text-red-800">
              <ShieldAlert className="w-4 h-4" />
              Tugas Ditolak oleh UMKM
            </div>
            {latestSubmission?.review?.reason && (
              <div className="rounded-lg bg-white/80 p-3 border border-red-200/60 text-xs text-red-900">
                <strong>Alasan Penolakan:</strong> &ldquo;{latestSubmission.review.reason}&rdquo;
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-red-800">
                Jika Anda merasa hasil kerja telah memenuhi instruksi, Anda memiliki waktu 3 hari
                {job.disputeUntil ? ` (s/d ${formatDateTime(job.disputeUntil)})` : ""} untuk mengajukan sengketa ke Admin.
              </p>
              {!job.dispute && (!job.disputeUntil || new Date() <= new Date(job.disputeUntil)) && (
                <Button
                  size="sm"
                  onClick={() => setIsDisputeModalOpen(true)}
                  className="bg-red-700 hover:bg-red-800 text-white font-semibold text-xs shrink-0"
                >
                  <Scale className="w-3.5 h-3.5 mr-1.5" />
                  Ajukan Sengketa
                </Button>
              )}
            </div>
          </div>
        )}

        {job.status === "DISPUTED" && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-xs text-purple-950 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-purple-800">
              <Scale className="w-4 h-4" />
              Sengketa Sedang Ditinjau Admin KARTA
            </div>
            <p className="text-[11px] text-purple-800">
              Sanggahan Anda telah tercatat. Tim admin KARTA akan meninjau kesesuaian karya terhadap kriteria penugasan secara objektif.
            </p>
            {job.dispute?.reason && (
              <div className="bg-white/80 p-2.5 rounded-lg border border-purple-200 text-purple-900 italic text-[11px]">
                &quot;{job.dispute.reason}&quot;
              </div>
            )}
          </div>
        )}
      </div>

      {/* GRID FORM PENGUMPULAN & INSTRUKSI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI (2 Kolom): Form Submit & Histori Pengumpulan */}
        <div className="lg:col-span-2 space-y-6">
          {/* FORM PENGUMPULAN (Aktif saat IN_PROGRESS atau REVISION_REQUESTED) */}
          {(job.status === "IN_PROGRESS" || job.status === "REVISION_REQUESTED") && (
            <div className="rounded-2xl border border-beige bg-white p-6 shadow-sm space-y-5">
              <div className="border-b border-beige pb-2">
                <h2 className="font-heading text-lg font-bold text-primary-brown">
                  {job.status === "REVISION_REQUESTED"
                    ? `Kumpulkan Perbaikan (Pengumpulan #${assignment.submissions.length + 1})`
                    : "Form Pengumpulan Hasil Kerja"}
                </h2>
                <p className="text-xs text-primary-brown/70 font-sans mt-0.5">
                  Pastikan tautan berkas dapat diakses secara publik atau view-only sesuai format {job.deliverableType}.
                </p>
              </div>

              <form onSubmit={handleSubmitWork} className="space-y-4">
                {/* INPUT TAUTAN */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-primary-brown">
                    Tautan Hasil Kerja (URL Whitelist BR-J7) *
                  </label>
                  <Input
                    type="url"
                    required
                    value={deliverableUrl}
                    onChange={(e) => setDeliverableUrl(e.target.value)}
                    placeholder="https://drive.google.com/... atau https://figma.com/..."
                    className="text-xs font-sans"
                  />
                  <p className="text-[11px] text-primary-brown/60">
                    Didukung: Google Drive, Google Docs/Sheets, Figma, GitHub, Canva, Notion.
                  </p>
                </div>

                {/* INPUT CATATAN */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-primary-brown">
                    Catatan Penyerahan untuk UMKM (Opsional)
                  </label>
                  <Textarea
                    rows={3}
                    value={submissionNote}
                    onChange={(e) => setSubmissionNote(e.target.value)}
                    placeholder="Jelaskan secara singkat berkas yang dikumpulkan atau petunjuk pembukaan file..."
                    className="text-xs font-sans"
                  />
                </div>

                {/* SELF-CHECK CHECKLIST (BR-E2) */}
                <div className="rounded-xl border border-beige bg-cream/30 p-4 space-y-3">
                  <div className="border-b border-beige/60 pb-2">
                    <h3 className="text-xs font-bold text-primary-brown flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-earth-primary" />
                      Self-Check Kriteria Penerimaan Wajib (BR-E2)
                    </h3>
                    <p className="text-[11px] text-primary-brown/70 mt-0.5">
                      Centang seluruh kriteria di bawah untuk memastikan hasil kerja Anda telah sesuai sebelum tombol submit aktif.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {job.criteria.map((c) => (
                      <label
                        key={c.id}
                        className="flex items-start gap-2.5 cursor-pointer text-xs text-primary-brown hover:bg-cream/60 p-1.5 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={!!checkedCriteria[c.id]}
                          onChange={() => toggleCriterion(c.id)}
                          className="mt-0.5 h-4 w-4 rounded border-beige text-earth-primary focus:ring-earth-primary"
                        />
                        <span className="leading-snug">{c.text}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowWithdrawModal(true)}
                    className="text-destructive hover:bg-destructive/10 text-xs gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Mundur dari Tugas
                  </Button>

                  <Button
                    type="submit"
                    disabled={!allCriteriaChecked || isSubmitting || !deliverableUrl.trim()}
                    className="gap-2 font-bold text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? "Mengirimkan..." : "Kumpulkan Hasil Kerja"}</span>
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* HISTORI PENGUMPULAN */}
          {assignment.submissions.length > 0 && (
            <div className="rounded-2xl border border-beige bg-white p-6 shadow-sm space-y-4">
              <h2 className="font-heading text-base font-bold text-primary-brown border-b border-beige pb-2">
                Histori Pengumpulan ({assignment.submissions.length})
              </h2>

              <div className="space-y-3">
                {assignment.submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-xl border border-beige/80 bg-cream/30 p-4 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary-brown">
                        Pengumpulan #{sub.number}
                        {sub.isLate && (
                          <span className="ml-2 text-[10px] text-red-600 font-semibold bg-red-100 px-1.5 py-0.5 rounded">
                            Terlambat
                          </span>
                        )}
                      </span>
                      <span className="text-primary-brown/60">
                        {formatDateTime(sub.submittedAt)}
                      </span>
                    </div>

                    <div>
                      <a
                        href={sub.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-earth-primary hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Tautan Berkas: {sub.url}
                      </a>
                    </div>

                    {sub.note && (
                      <p className="text-primary-brown/80 italic bg-white/60 p-2 rounded border border-beige/40">
                        &ldquo;{sub.note}&rdquo;
                      </p>
                    )}

                    {sub.review && (
                      <div className="pt-2 border-t border-beige/40 text-[11px]">
                        <span className="font-semibold text-primary-brown">
                          Keputusan UMKM: <strong>{sub.review.decision}</strong>
                        </span>
                        {sub.review.reason && (
                          <p className="mt-1 text-primary-brown/80">
                            Catatan: {sub.review.reason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DETAIL INSTRUKSI PENGERJAAN */}
          <div className="rounded-2xl border border-beige bg-white p-6 shadow-sm space-y-4">
            <h2 className="font-heading text-base font-bold text-primary-brown border-b border-beige pb-2">
              Instruksi Detail dari UMKM
            </h2>
            <div className="text-xs text-primary-brown/80 whitespace-pre-wrap leading-relaxed font-sans bg-cream/30 p-4 rounded-xl border border-beige/60">
              {job.instructions}
            </div>

            {/* GAMBAR REFERENSI */}
            {job.images && job.images.length > 0 && (
              <div className="pt-3 border-t border-beige/60 space-y-2">
                <h3 className="text-xs font-bold text-primary-brown">
                  Gambar Referensi ({job.images.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {job.images.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => setPreviewImageUrl(img.url)}
                      className="group relative aspect-video rounded-lg overflow-hidden border border-beige cursor-pointer bg-cream"
                    >
                      <Image
                        src={img.url}
                        alt="Referensi"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN: CHECKLIST KRITERIA & INFORMASI PENUGASAN */}
        <div className="space-y-6">
          {/* KRITERIA PENERIMAAN RESMI */}
          <div className="rounded-2xl border border-beige bg-white p-5 shadow-sm space-y-3">
            <div className="border-b border-beige pb-2">
              <h3 className="font-heading text-sm font-bold text-primary-brown">
                Kriteria Penerimaan Tugas ({job.criteria.length})
              </h3>
              <p className="text-[11px] text-primary-brown/60 font-sans mt-0.5">
                Kriteria resmi yang akan dinilai oleh UMKM saat review.
              </p>
            </div>

            <div className="space-y-2">
              {job.criteria.map((c, idx) => (
                <div
                  key={c.id}
                  className="flex items-start gap-2 rounded-lg border border-beige/60 bg-cream/20 p-2.5 text-xs text-primary-brown"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-earth-sage/30 text-[10px] font-bold text-earth-coffee">
                    {idx + 1}
                  </span>
                  <span className="leading-snug text-[11px]">{c.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* INFORMASI TENGGAT & REPUTASI */}
          <div className="rounded-2xl border border-beige bg-white p-5 shadow-sm space-y-3 text-xs font-sans">
            <h3 className="font-heading text-sm font-bold text-primary-brown border-b border-beige pb-2">
              Info Penugasan
            </h3>
            <div className="space-y-2 text-primary-brown/80 text-[11px]">
              <div className="flex justify-between">
                <span>Tanggal Klaim:</span>
                <span className="font-semibold text-primary-brown">
                  {formatDateOnly(assignment.claimedAt)}
                </span>
              </div>
              {assignment.startedAt && (
                <div className="flex justify-between">
                  <span>Mulai Kerjakan:</span>
                  <span className="font-semibold text-primary-brown">
                    {formatDateOnly(assignment.startedAt)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Revisi Diminta:</span>
                <span className="font-semibold text-primary-brown">
                  {job.revisionCount} / 2
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-beige/60">
                <span>Potensi Poin Reputasi:</span>
                <span className="font-bold text-earth-primary">+10 Poin (+3 tanpa revisi)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL MUNDUR DARI PEKERJAAN */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-beige bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-beige pb-3">
              <h3 className="font-heading text-base font-bold text-primary-brown flex items-center gap-2">
                <LogOut className="w-4 h-4 text-red-600" />
                Konfirmasi Pengunduran Diri
              </h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-primary-brown/60 hover:text-primary-brown"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-primary-brown/80 space-y-2 font-sans">
              <p>
                {job.status === "CLAIMED"
                  ? "Anda belum menekan Mulai Kerjakan. Pengunduran diri saat ini tidak akan memotong poin reputasi Anda, dan tugas akan dikembalikan ke bursa."
                  : "Anda mengundurkan diri saat tugas sedang berjalan. Hal ini akan dicatat dalam riwayat penugasan Anda."}
              </p>
              <div className="space-y-1 pt-1">
                <label className="font-bold text-primary-brown text-[11px]">
                  Alasan Pengunduran Diri (Opsional)
                </label>
                <Input
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  placeholder="Misal: Bentrok dengan jadwal ujian praktikum..."
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-beige">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowWithdrawModal(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleWithdraw}
                disabled={isSubmitting}
                className="text-xs font-bold"
              >
                {isSubmitting ? "Memproses..." : "Ya, Mundur dari Tugas"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX PREVIEW GAMBAR REFERENSI */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm cursor-zoom-out animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <Image
              src={previewImageUrl}
              alt="Perbesar Referensi"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
      {/* MODAL SENGKETA */}
      <StudentDisputeModal
        jobId={job.id}
        jobTitle={job.title}
        open={isDisputeModalOpen}
        onOpenChange={setIsDisputeModalOpen}
      />
    </div>
  );
}
