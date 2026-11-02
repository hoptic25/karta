"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  cancelJobAction,
  duplicateJobAction,
  deleteJobDraftAction,
  reviewSubmissionAction,
} from "../actions";
import { PublishModal } from "./publish-modal";
import { UmkmFailureModal } from "./umkm-failure-modal";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatRupiah, formatDateTime, formatDateOnly } from "@/lib/format";
import type {
  Job,
  AcceptanceCriterion,
  ImageAsset,
  Subscription,
  Package,
  JobAssignment,
  StudentProfile,
  User,
  Campus,
  Submission,
  Review,
  DeadlineChangeRequest,
  Dispute,
  FailureReport,
} from "@/generated/prisma/client";
import {
  Send,
  Edit2,
  Trash2,
  Copy,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  Check,
  X,
  Scale,
} from "lucide-react";

type JobDetailData = Job & {
  criteria: AcceptanceCriterion[];
  images: ImageAsset[];
  subscription: (Subscription & { package: Package }) | null;
  assignments: (JobAssignment & {
    student: StudentProfile & {
      user: Pick<User, "name" | "image" | "email">;
      campus: Pick<Campus, "name" | "city">;
    };
    submissions: (Submission & {
      review: Review | null;
    })[];
  })[];
  deadlineRequests: DeadlineChangeRequest[];
  dispute: Dispute | null;
  failureReports: FailureReport[];
};

interface JobDetailViewProps {
  job: JobDetailData;
  availableSubscriptions: (Subscription & { package: Package })[];
}

export function JobDetailView({
  job,
  availableSubscriptions,
}: JobDetailViewProps) {
  const router = useRouter();
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Review Evaluation State (BR-E3 & BR-E4)
  const [criteriaEvaluation, setCriteriaEvaluation] = useState<
    Record<string, { met: boolean; comment: string }>
  >(() => {
    const init: Record<string, { met: boolean; comment: string }> = {};
    job.criteria.forEach((c) => {
      init[c.id] = { met: true, comment: "" };
    });
    return init;
  });
  const [reviewModalMode, setReviewModalMode] = useState<"NONE" | "REVISION" | "REJECT">("NONE");
  const [reviewReasonInput, setReviewReasonInput] = useState("");

  const activeAssignment = job.assignments.find((a) => a.status === "ACTIVE");

  const handleAcceptWork = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menerima hasil kerja ini? Kompensasi mahasiswa akan dialokasikan dan status tugas diselesaikan.")) return;

    setIsProcessing(true);
    setActionError(null);

    const criteriaResults = job.criteria.map((c) => ({
      criterionId: c.id,
      met: criteriaEvaluation[c.id]?.met ?? true,
      comment: criteriaEvaluation[c.id]?.comment || undefined,
    }));

    const res = await reviewSubmissionAction({
      jobId: job.id,
      decision: "ACCEPT",
      criteriaResults,
    });

    setIsProcessing(false);
    if (!res.ok) {
      setActionError(res.error.message);
      return;
    }

    router.refresh();
  };

  const handleConfirmDecision = async () => {
    if (reviewModalMode === "NONE") return;

    if (reviewModalMode === "REJECT" && reviewReasonInput.trim().length < 20) {
      setActionError("Alasan penolakan wajib diisi minimal 20 karakter.");
      return;
    }

    setIsProcessing(true);
    setActionError(null);

    const criteriaResults = job.criteria.map((c) => ({
      criterionId: c.id,
      met: criteriaEvaluation[c.id]?.met ?? true,
      comment: criteriaEvaluation[c.id]?.comment || undefined,
    }));

    const res = await reviewSubmissionAction({
      jobId: job.id,
      decision: reviewModalMode === "REVISION" ? "REQUEST_REVISION" : "REJECT",
      reason: reviewReasonInput,
      criteriaResults,
    });

    setIsProcessing(false);
    if (!res.ok) {
      setActionError(res.error.message);
      return;
    }

    setReviewModalMode("NONE");
    setReviewReasonInput("");
    router.refresh();
  };

  const handleCancelJob = async () => {
    const confirmText =
      job.status === "OPEN"
        ? "Apakah Anda yakin ingin membatalkan pekerjaan ini? Kuota paket langganan Anda akan dipulihkan secara otomatis."
        : "Apakah Anda yakin ingin membatalkan sebelum mahasiswa mulai? Kuota paket langganan Anda akan dipulihkan.";

    if (!window.confirm(confirmText)) return;

    setIsProcessing(true);
    setActionError(null);

    const res = await cancelJobAction({
      jobId: job.id,
      reason: "Dibatalkan oleh UMKM dari dasbor.",
    });

    setIsProcessing(false);
    if (!res.ok) {
      setActionError(res.error.message);
      return;
    }

    router.refresh();
  };

  const handleDuplicate = async () => {
    setIsProcessing(true);
    setActionError(null);

    const res = await duplicateJobAction(job.id);
    setIsProcessing(false);

    if (!res.ok) {
      setActionError(res.error.message);
      return;
    }

    router.push(`/umkm/jobs/${res.data.jobId}`);
  };

  const handleDeleteDraft = async () => {
    if (!window.confirm("Hapus draf pekerjaan ini secara permanen?")) return;

    setIsProcessing(true);
    setActionError(null);

    const res = await deleteJobDraftAction(job.id);
    setIsProcessing(false);

    if (!res.ok) {
      setActionError(res.error.message);
      return;
    }

    router.push("/umkm/jobs");
  };

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>{actionError}</div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="rounded-2xl border border-beige bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-beige pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cream border border-beige px-3 py-1 text-xs font-bold text-primary-brown">
              {job.status}
            </span>
            <span className="rounded-md bg-earth-cream px-2.5 py-1 text-xs font-semibold text-earth-coffee border border-earth-sand/30">
              {job.role}
            </span>
            {job.isPaid ? (
              <span className="text-xs font-bold text-earth-primary bg-earth-sage/10 px-2.5 py-1 rounded-md border border-earth-sage/30">
                Imbalan Mahasiswa: {formatRupiah(job.studentShareIdr)} (Tier {job.packageTier})
              </span>
            ) : (
              <span className="rounded-md bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 text-xs font-bold">
                Volunteer Project (Unpaid)
              </span>
            )}
            {job.beginnerFriendly && (
              <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-1 rounded-full">
                Newcomer Friendly
              </span>
            )}
          </div>

          {/* ACTION BUTTONS BERDASARKAN STATUS */}
          <div className="flex flex-wrap items-center gap-2">
            {job.status === "DRAFT" && (
              <>
                <Link
                  href={`/umkm/jobs/${job.id}/edit`}
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "gap-1.5",
                  })}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Draf
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDeleteDraft}
                  disabled={isProcessing}
                  className="text-destructive hover:bg-destructive/10 gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsPublishModalOpen(true)}
                  disabled={isProcessing}
                  className="gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Publikasikan Sekarang
                </Button>
              </>
            )}

            {job.status === "OPEN" && (
              <>
                <Link
                  href={`/umkm/jobs/${job.id}/edit`}
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "gap-1.5",
                  })}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Ubah Konten / Deadline
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDuplicate}
                  disabled={isProcessing}
                  className="gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Duplikat
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelJob}
                  disabled={isProcessing}
                  className="text-destructive hover:bg-destructive/10 gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Batalkan Pekerjaan
                </Button>
              </>
            )}

            {job.status === "CLAIMED" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDuplicate}
                  disabled={isProcessing}
                  className="gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Duplikat
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelJob}
                  disabled={isProcessing}
                  className="text-destructive hover:bg-destructive/10 gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Batalkan Sebelum Mulai
                </Button>
              </>
            )}

            {["IN_PROGRESS", "REVISION_REQUESTED"].includes(job.status) && activeAssignment && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsFailureModalOpen(true)}
                disabled={isProcessing}
                className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Laporkan Kendala
              </Button>
            )}

            {["ACCEPTED", "CANCELLED", "EXPIRED", "REJECTED"].includes(job.status) && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDuplicate}
                disabled={isProcessing}
                className="gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Duplikat sebagai Tugas Baru
              </Button>
            )}
          </div>
        </div>

        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-primary-brown">
            {job.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-primary-brown/70 font-sans mt-2">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Tenggat Pengerjaan: {formatDateTime(job.deadlineAt)}</span>
            </div>
            {job.publishedAt && (
              <div>Dipublikasikan pada: {formatDateOnly(job.publishedAt)}</div>
            )}
            <div>Tipe Pengumpulan: <strong>{job.deliverableType}</strong></div>
          </div>
        </div>

        {job.status === "DISPUTED" && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-xs text-purple-950 space-y-2 mt-4">
            <div className="font-bold flex items-center gap-1.5 text-purple-800">
              <Scale className="w-4 h-4" />
              Tugas Dalam Peninjauan Sengketa oleh Admin KARTA
            </div>
            <p className="text-[11px] text-purple-800">
              Mahasiswa mengajukan sanggahan atas penolakan hasil kerja. Tim admin KARTA sedang meninjau kriteria brief dan bukti pengerjaan secara objektif.
            </p>
          </div>
        )}
      </div>

      {/* MAHASISWA PENGERJA (JIKA SUDAH DIKLAIM / IN PROGRESS / SUBMITTED) */}
      {activeAssignment && (
        <div className="rounded-2xl border border-earth-primary/30 bg-earth-cream/30 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-earth-primary text-white font-heading font-bold text-lg">
                {activeAssignment.student.user.name?.charAt(0) || "M"}
              </div>
              <div>
                <div className="text-xs font-semibold text-primary-brown/60 uppercase tracking-wider">
                  Mahasiswa Pengerja Aktif
                </div>
                <div className="font-heading font-bold text-base text-primary-brown">
                  {activeAssignment.student.user.name}
                </div>
                <div className="text-xs text-primary-brown/70 font-sans">
                  {activeAssignment.student.campus.name} ({activeAssignment.student.studyProgram}) · Level:{" "}
                  <strong>{activeAssignment.student.level}</strong>
                </div>
              </div>
            </div>

            <div className="text-right text-xs text-primary-brown/70">
              <div>Diklaim pada: {formatDateTime(activeAssignment.claimedAt)}</div>
              {activeAssignment.startedAt && (
                <div className="text-earth-primary font-semibold">
                  Mulai dikerjakan: {formatDateTime(activeAssignment.startedAt)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GRID DETAIL KONTEN & KRITERIA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI: DESKRIPSI & INSTRUKSI */}
        <div className="lg:col-span-2 space-y-6">
          {/* PANEL REVIEW EVALUASI UMKM (BR-E3 & BR-E4) */}
          {job.status === "SUBMITTED" && activeAssignment && activeAssignment.submissions.length > 0 && (
            <div className="rounded-2xl border-2 border-earth-primary/40 bg-earth-cream/20 p-6 shadow-sm space-y-5">
              <div className="border-b border-earth-sand/30 pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-bold text-primary-brown flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-earth-primary" />
                    Penilaian & Review Hasil Kerja Mahasiswa
                  </h3>
                  {job.reviewDueAt && (
                    <span className="text-xs text-earth-coffee font-semibold bg-earth-sand/30 px-2.5 py-1 rounded-md">
                      Batas SLA: {formatDateTime(job.reviewDueAt)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-primary-brown/70 font-sans mt-1">
                  Evaluasi kriteria penerimaan di bawah dan tentukan apakah tugas diterima, diminta revisi, atau ditolak.
                </p>
              </div>

              {/* TAUTAN BERKAS PENGUMPULAN TERBARU */}
              {(() => {
                const latestSub = activeAssignment.submissions[activeAssignment.submissions.length - 1];
                return (
                  <div className="rounded-xl border border-beige bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-primary-brown">
                        Pengumpulan #{latestSub.number}
                        {latestSub.isLate && (
                          <span className="ml-2 text-[10px] text-red-600 font-semibold bg-red-100 px-1.5 py-0.5 rounded">
                            Terlambat
                          </span>
                        )}
                      </span>
                      <span className="text-primary-brown/60">
                        Dikumpulkan pada: {formatDateTime(latestSub.submittedAt)}
                      </span>
                    </div>

                    <div className="pt-1">
                      <a
                        href={latestSub.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-earth-cream px-3 py-2 text-xs font-bold text-earth-primary hover:bg-earth-sand/30 transition-colors border border-earth-sand/40"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Buka & Periksa Berkas Hasil Kerja: {latestSub.url}
                      </a>
                    </div>

                    {latestSub.note && (
                      <p className="text-xs text-primary-brown/80 italic bg-cream/40 p-2.5 rounded border border-beige/60">
                        Catatan Mahasiswa: &ldquo;{latestSub.note}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* CHECKLIST EVALUASI KRITERIA PENERIMAAN */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-primary-brown uppercase tracking-wider">
                  Evaluasi Kriteria Penerimaan ({job.criteria.length})
                </h4>

                <div className="space-y-2.5">
                  {job.criteria.map((c) => {
                    const currentMet = criteriaEvaluation[c.id]?.met ?? true;
                    return (
                      <div
                        key={c.id}
                        className="rounded-xl border border-beige bg-white p-3 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-primary-brown font-medium leading-snug">
                            {c.text}
                          </span>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setCriteriaEvaluation((prev) => ({
                                  ...prev,
                                  [c.id]: { ...prev[c.id], met: true },
                                }))
                              }
                              className={`rounded-md px-2 py-1 text-[11px] font-bold transition-all flex items-center gap-1 ${
                                currentMet
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "bg-cream text-primary-brown/60 hover:bg-emerald-50"
                              }`}
                            >
                              <Check className="w-3 h-3" />
                              Memenuhi
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setCriteriaEvaluation((prev) => ({
                                  ...prev,
                                  [c.id]: { ...prev[c.id], met: false },
                                }))
                              }
                              className={`rounded-md px-2 py-1 text-[11px] font-bold transition-all flex items-center gap-1 ${
                                !currentMet
                                  ? "bg-amber-600 text-white shadow-xs"
                                  : "bg-cream text-primary-brown/60 hover:bg-amber-50"
                              }`}
                            >
                              <X className="w-3 h-3" />
                              Belum Sesuai
                            </button>
                          </div>
                        </div>

                        {!currentMet && (
                          <Input
                            placeholder="Catatan perbaikan untuk kriteria ini (opsional)..."
                            value={criteriaEvaluation[c.id]?.comment || ""}
                            onChange={(e) =>
                              setCriteriaEvaluation((prev) => ({
                                ...prev,
                                [c.id]: { ...prev[c.id], comment: e.target.value },
                              }))
                            }
                            className="text-xs h-8 font-sans"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TOMBOL AKSI KEPUTUSAN REVIEW */}
              <div className="pt-3 border-t border-earth-sand/30 flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setReviewModalMode("REJECT");
                    setReviewReasonInput("");
                  }}
                  disabled={isProcessing}
                  className="text-destructive border-red-200 hover:bg-red-50 text-xs gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Tolak Hasil Kerja
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={job.revisionCount >= 2 || isProcessing}
                    onClick={() => {
                      setReviewModalMode("REVISION");
                      setReviewReasonInput("");
                    }}
                    className="text-amber-800 border-amber-300 hover:bg-amber-50 text-xs gap-1.5 font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      {job.revisionCount >= 2
                        ? "Batas Revisi Habis (2/2)"
                        : `Minta Revisi (${job.revisionCount + 1}/2)`}
                    </span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAcceptWork}
                    disabled={isProcessing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isProcessing ? "Menyimpan..." : "Terima Hasil Kerja (Accept)"}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-beige bg-white p-6 shadow-sm space-y-5">
            <div>
              <h3 className="font-heading text-lg font-bold text-primary-brown border-b border-beige pb-2 mb-3">
                Deskripsi Pekerjaan
              </h3>
              <p className="text-sm text-primary-brown/80 whitespace-pre-wrap leading-relaxed font-sans">
                {job.description}
              </p>
            </div>

            <div>
              <h3 className="font-heading text-lg font-bold text-primary-brown border-b border-beige pb-2 mb-3">
                Instruksi Detail & Spesifikasi Pengerjaan
              </h3>
              <p className="text-sm text-primary-brown/80 whitespace-pre-wrap leading-relaxed font-sans bg-cream/40 p-4 rounded-xl border border-beige/60">
                {job.instructions}
              </p>
            </div>
          </div>

          {/* HISTORI SUBMISSION (JIKA ADA) */}
          {activeAssignment && activeAssignment.submissions.length > 0 && (
            <div className="rounded-2xl border border-beige bg-white p-6 shadow-sm space-y-4">
              <h3 className="font-heading text-lg font-bold text-primary-brown border-b border-beige pb-2">
                Histori Pengumpulan Hasil Kerja
              </h3>
              <div className="space-y-3">
                {activeAssignment.submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-xl border border-beige/80 bg-cream/30 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-primary-brown">
                        Pengumpulan #{sub.number} {sub.isLate && <span className="text-xs text-red-600">(Terlambat)</span>}
                      </span>
                      <span className="text-xs text-primary-brown/60">
                        {formatDateTime(sub.submittedAt)}
                      </span>
                    </div>
                    <div className="text-xs">
                      <a
                        href={sub.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-earth-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Buka Berkas Hasil Kerja: {sub.url}
                      </a>
                    </div>
                    {sub.note && (
                      <p className="text-xs text-primary-brown/80 italic">
                        Catatan Mahasiswa: &ldquo;{sub.note}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* KOLOM KANAN: ACCEPTANCE CHECKLIST & INFORMASI FINANSIAL */}
        <div className="space-y-6">
          {/* CHECKLIST KRITERIA */}
          <div className="rounded-2xl border border-beige bg-white p-6 shadow-sm space-y-4">
            <div className="border-b border-beige pb-2">
              <h3 className="font-heading text-base font-bold text-primary-brown">
                Checklist Kriteria Penerimaan ({job.criteria.length})
              </h3>
              <p className="text-[11px] text-primary-brown/60 font-sans mt-0.5">
                Kriteria wajib yang harus dipenuhi mahasiswa untuk diterima (BR-J1).
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

          {/* SNAPSHOT FINANSIAL */}
          <div className="rounded-2xl border border-beige bg-white p-6 shadow-sm space-y-3">
            <h3 className="font-heading text-base font-bold text-primary-brown border-b border-beige pb-2">
              Rincian Alokasi Paket (BR-J2)
            </h3>
            <div className="space-y-2 text-xs font-sans">
              <div className="flex justify-between">
                <span className="text-primary-brown/70">Alokasi Total UMKM:</span>
                <span className="font-semibold text-primary-brown">
                  {formatRupiah(job.allocationIdr)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-brown/70">Imbalan Mahasiswa (60%):</span>
                <span className="font-bold text-earth-primary">
                  {formatRupiah(job.studentShareIdr)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-primary-brown/70">Fee Layanan Platform (40%):</span>
                <span className="font-semibold text-primary-brown/80">
                  {formatRupiah(job.platformShareIdr)}
                </span>
              </div>
              {job.subscription && (
                <div className="pt-2 border-t border-beige/60 text-[11px] text-primary-brown/60">
                  Dibiayai oleh: <strong>{job.subscription.package.name}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PUBLIKASI */}
      <PublishModal
        jobId={job.id}
        jobTitle={job.title}
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        availableSubscriptions={availableSubscriptions}
      />

      {/* MODAL KEPUTUSAN REVIEW (REVISI ATAU TOLAK) */}
      {reviewModalMode !== "NONE" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-beige bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-beige pb-3">
              <h3 className="font-heading text-base font-bold text-primary-brown flex items-center gap-2">
                {reviewModalMode === "REVISION" ? (
                  <>
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    Minta Revisi kepada Mahasiswa
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    Tolak Hasil Kerja Mahasiswa
                  </>
                )}
              </h3>
              <button
                onClick={() => setReviewModalMode("NONE")}
                className="text-primary-brown/60 hover:text-primary-brown"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-primary-brown/80 space-y-3 font-sans">
              <p>
                {reviewModalMode === "REVISION"
                  ? `Berikan instruksi revisi yang jelas agar mahasiswa dapat memperbaiki hasil kerja (Revisi #${job.revisionCount + 1} dari 2). Mahasiswa diberikan SLA 3 hari untuk submit ulang.`
                  : "Penolakan hasil kerja wajib disertai alasan objektif minimal 20 karakter. Mahasiswa memiliki hak mengajukan sengketa dalam waktu 3 hari."}
              </p>

              <div className="space-y-1">
                <label className="font-bold text-primary-brown text-[11px]">
                  {reviewModalMode === "REVISION" ? "Catatan Revisi *" : "Alasan Penolakan (min. 20 karakter) *"}
                </label>
                <Textarea
                  rows={4}
                  value={reviewReasonInput}
                  onChange={(e) => setReviewReasonInput(e.target.value)}
                  placeholder={
                    reviewModalMode === "REVISION"
                      ? "Contoh: Mohon perbaiki penulisan kolom harga pada baris 10-25 sesuai template..."
                      : "Contoh: Hasil pengerjaan tidak memenuhi kriteria penerimaan wajib nomor 1 dan 2..."
                  }
                  className="text-xs font-sans"
                />
                {reviewModalMode === "REJECT" && (
                  <span className="text-[10px] text-primary-brown/60">
                    {reviewReasonInput.trim().length}/20 karakter minimum
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-beige">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReviewModalMode("NONE")}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant={reviewModalMode === "REJECT" ? "destructive" : "default"}
                size="sm"
                onClick={handleConfirmDecision}
                disabled={
                  isProcessing ||
                  (reviewModalMode === "REJECT" && reviewReasonInput.trim().length < 20) ||
                  (reviewModalMode === "REVISION" && !reviewReasonInput.trim())
                }
                className="text-xs font-bold"
              >
                {isProcessing
                  ? "Menyimpan..."
                  : reviewModalMode === "REVISION"
                  ? "Kirim Permintaan Revisi"
                  : "Konfirmasi Tolak Tugas"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL LAPOR KENDALA */}
      <UmkmFailureModal
        jobId={job.id}
        jobTitle={job.title}
        studentName={activeAssignment?.student.user.name || "Mahasiswa"}
        open={isFailureModalOpen}
        onOpenChange={setIsFailureModalOpen}
      />
    </div>
  );
}
