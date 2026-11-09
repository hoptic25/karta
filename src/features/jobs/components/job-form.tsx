"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveJobDraftAction, updateOpenJobAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  jobRoleEnum,
  deliverableTypeEnum,
} from "../schemas";
import type { Job, AcceptanceCriterion, ImageAsset } from "@/generated/prisma/client";
import {
  Plus,
  Trash2,
  AlertCircle,
  Save,
  Clock,
  Sparkles,
} from "lucide-react";

interface JobFormProps {
  initialJob?: (Job & {
    criteria: AcceptanceCriterion[];
    images?: ImageAsset[];
  }) | null;
  mode?: "CREATE" | "EDIT_DRAFT" | "EDIT_OPEN";
}

const ROLE_LABELS: Record<string, string> = {
  DATA_ENTRY: "Data Entry & Admin",
  CONTENT_WRITER: "Penulisan Konten (Copywriter/Artikel)",
  GRAPHIC_DESIGNER: "Desain Grafis & Banner",
  SOCIAL_MEDIA: "Spesialis Media Sosial",
  VIDEO_EDITOR: "Video Editor & Reels",
  UIUX_DESIGNER: "UI/UX & Desain Web",
  FRONTEND_DEV: "Frontend Developer",
};

const DELIVERABLE_LABELS: Record<string, string> = {
  DRIVE: "Google Drive Folder / Link",
  DOCS: "Google Docs / PDF",
  FIGMA: "Figma File / Prototype",
  GITHUB: "GitHub Repository / PR",
  CANVA: "Canva Design Link",
  NOTION: "Notion Page",
  OTHER: "Tautan Eksternal Lainnya (HTTPS)",
};

export function JobForm({ initialJob, mode = "CREATE" }: JobFormProps) {
  const router = useRouter();
  const isEditingOpen = mode === "EDIT_OPEN";

  // Form states
  const [title, setTitle] = useState(initialJob?.title || "");
  const [description, setDescription] = useState(initialJob?.description || "");
  const [instructions, setInstructions] = useState(initialJob?.instructions || "");
  const [jobRoleId, setJobRoleId] = useState(initialJob?.jobRoleId || "");
  const [deliverableType, setDeliverableType] = useState(
    initialJob?.deliverableType || "DRIVE"
  );

  // Formatting date for datetime-local input
  const [deadlineAt, setDeadlineAt] = useState(() => {
    if (initialJob?.deadlineAt) {
      return new Date(initialJob.deadlineAt).toISOString().slice(0, 16);
    }
    return new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  });
  const [minLevel, setMinLevel] = useState(initialJob?.minLevel || "NEWCOMER");
  const [beginnerFriendly, setBeginnerFriendly] = useState(
    initialJob?.beginnerFriendly ?? true
  );

  // Acceptance criteria (1-7 items)
  const initialCriteria = initialJob?.criteria && initialJob.criteria.length > 0
    ? initialJob.criteria.map((c) => c.text)
    : ["Hasil pekerjaan rapi sesuai instruksi", "Diserahkan tepat waktu sesuai tautan deliverable"];
  const [criteria, setCriteria] = useState<string[]>(initialCriteria);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddCriterion = () => {
    if (criteria.length >= 7) return;
    setCriteria([...criteria, ""]);
  };

  const handleRemoveCriterion = (index: number) => {
    if (criteria.length <= 1) return;
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleCriterionChange = (index: number, val: string) => {
    const updated = [...criteria];
    updated[index] = val;
    setCriteria(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validCriteria = criteria.map((c) => c.trim()).filter((c) => c.length > 0);
    if (validCriteria.length < 1 || validCriteria.length > 7) {
      setErrorMessage("Kriteria penerimaan harus berjumlah antara 1 hingga 7 butir.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditingOpen && initialJob?.id) {
        const res = await updateOpenJobAction({
          jobId: initialJob.id,
          title,
          description,
          instructions,
          deliverableType,
          deadlineAt: new Date(deadlineAt),
          criteria: validCriteria,
        });

        setIsSubmitting(false);
        if (!res.ok) {
          setErrorMessage(res.error.message);
          return;
        }

        router.push(`/umkm/jobs/${initialJob.id}`);
        router.refresh();
      } else {
        const res = await saveJobDraftAction({
          id: initialJob?.id,
          title,
          description,
          instructions,
          jobRoleId,
          deliverableType,
          deadlineAt: new Date(deadlineAt),
          minLevel,
          beginnerFriendly,
          criteria: validCriteria,
        });

        setIsSubmitting(false);
        if (!res.ok) {
          setErrorMessage(res.error.message);
          return;
        }

        router.push(`/umkm/jobs/${res.data.jobId}`);
        router.refresh();
      }
    } catch {
      setIsSubmitting(false);
      setErrorMessage("Terjadi kesalahan saat memproses formulir.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* PANDUAN RUANG LINGKUP (BR-J9) */}
      <div className="rounded-2xl border border-earth-sand/30 bg-earth-cream/40 p-5">
        <div className="flex items-center gap-2 text-earth-coffee font-heading font-bold text-sm">
          <Sparkles className="w-4 h-4 text-earth-primary" />
          Panduan Ruang Lingkup Tugas Mikro KARTA (BR-J9)
        </div>
        <p className="mt-1 text-xs text-earth-coffee/70 leading-relaxed font-sans">
          Agar tugas lekas diselesaikan mahasiswa dengan mutu terbaik, pastikan beban tugas terukur:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-earth-sand/20 shadow-xs">
            <span className="font-bold text-earth-coffee">Tier Basic (≤ 1 Jam Kerja):</span>
            <p className="text-earth-coffee/70 mt-1">
              Data input 30–50 baris, 1 visual medsos feed sederhana, atau proofreading artikel pendek.
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-earth-sand/20 shadow-xs">
            <span className="font-bold text-earth-coffee">Tier Professional (≤ 2 Jam):</span>
            <p className="text-earth-coffee/70 mt-1">
              Desain brosur promosi 2 sisi, pembuatan video reels 30 detik dari materi yang ada, atau 3 copywriting caption.
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-earth-sand/20 shadow-xs">
            <span className="font-bold text-earth-coffee">Tier Premium (≤ 4 Jam):</span>
            <p className="text-earth-coffee/70 mt-1">
              Kompilasi katalog produk, perbaikan CSS responsif landing page, atau desain logo UMKM standar.
            </p>
          </div>
        </div>
      </div>

      {/* INFORMASI UTAMA PEKERJAAN */}
      <div className="rounded-2xl border border-beige bg-white p-6 shadow-sm space-y-5">
        <h2 className="font-heading text-lg font-bold text-primary-brown border-b border-beige pb-3">
          1. Informasi Utama Pekerjaan
        </h2>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-primary-brown mb-1.5">
            Judul Tugas <span className="text-destructive">*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Desain Banner Promo Diskon Kemerdekaan untuk Instagram Story"
            maxLength={120}
            required
            className="text-sm font-sans"
          />
          <div className="flex justify-between mt-1 text-[11px] text-primary-brown/60">
            <span>Gunakan judul yang ringkas dan menjelaskan tugas utama.</span>
            <span>{title.length}/120 karakter (min. 5)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-primary-brown mb-1.5">
              Bidang Keahlian (Role) <span className="text-destructive">*</span>
            </label>
            <select
              value={jobRoleId}
              onChange={(e) => setJobRoleId(e.target.value)}
              disabled={isEditingOpen}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:bg-cream disabled:cursor-not-allowed"
            >
              <option value="">Pilih bidang keahlian...</option>
              {/* TODO: Fetch jobRoles from API/props */}
            </select>
            {isEditingOpen && (
              <p className="text-[11px] text-primary-brown/60 mt-1">
                Bidang keahlian terkunci setelah pekerjaan dipublikasikan (BR-J4).
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-primary-brown mb-1.5">
              Platform Tujuan Pengumpulan <span className="text-destructive">*</span>
            </label>
            <select
              value={deliverableType}
              onChange={(e) => setDeliverableType(e.target.value as typeof deliverableType)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {deliverableTypeEnum.options.map((d) => (
                <option key={d} value={d}>
                  {DELIVERABLE_LABELS[d] || d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-primary-brown mb-1.5">
            Deskripsi Singkat Pekerjaan <span className="text-destructive">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Jelaskan gambaran umum usaha Anda dan apa tujuan dari tugas mikro ini..."
            required
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <div className="flex justify-between mt-1 text-[11px] text-primary-brown/60">
            <span>Berikan konteks bisnis agar mahasiswa memahami visi merek Anda.</span>
            <span>{description.length} karakter (min. 20)</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-primary-brown mb-1.5">
            Instruksi Detail & Spesifikasi Pengerjaan <span className="text-destructive">*</span>
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={5}
            placeholder="Langkah-langkah pengerjaan, format berkas yang diminta, dimensi visual, tone of voice teks, link referensi font/warna, dll..."
            required
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <div className="flex justify-between mt-1 text-[11px] text-primary-brown/60">
            <span>Petunjuk yang jelas mengurangi kebutuhan revisi di kemudian hari.</span>
            <span>{instructions.length} karakter (min. 20)</span>
          </div>
        </div>
      </div>

      {/* CHECKLIST KRITERIA PENERIMAAN (BR-J1) */}
      <div className="rounded-2xl border border-beige bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-beige pb-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-primary-brown">
              2. Kriteria Penerimaan Hasil Kerja (Acceptance Criteria)
            </h2>
            <p className="text-xs text-primary-brown/70 font-sans mt-0.5">
              Wajib antara 1 hingga 7 butir checklist (BR-J1). Mahasiswa dan UMKM akan memvalidasi ini saat peninjauan.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCriterion}
            disabled={criteria.length >= 7}
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Kriteria ({criteria.length}/7)
          </Button>
        </div>

        <div className="space-y-3">
          {criteria.map((text, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cream text-xs font-bold text-primary-brown shrink-0">
                {idx + 1}
              </span>
              <Input
                value={text}
                onChange={(e) => handleCriterionChange(idx, e.target.value)}
                placeholder={`Contoh kriteria #${idx + 1}: Resolusi gambar minimal 1080x1920 piksel (PNG)`}
                className="text-sm font-sans flex-1"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveCriterion(idx)}
                disabled={criteria.length <= 1}
                className="text-destructive hover:bg-destructive/10 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* TENGGAT WAKTU & PREFERENSI MAHASISWA */}
      <div className="rounded-2xl border border-beige bg-white p-6 shadow-sm space-y-5">
        <h2 className="font-heading text-lg font-bold text-primary-brown border-b border-beige pb-3">
          3. Tenggat Waktu & Kualifikasi Mahasiswa
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-primary-brown mb-1.5">
              Tenggat Waktu Pengumpulan (Deadline) <span className="text-destructive">*</span>
            </label>
            <Input
              type="datetime-local"
              value={deadlineAt}
              onChange={(e) => setDeadlineAt(e.target.value)}
              required
              className="text-sm font-sans"
            />
            <p className="text-[11px] text-primary-brown/60 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Tenggat minimum disesuaikan dengan aturan peran (misal 48 jam untuk Data Entry, 72 jam Desain Grafis).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-primary-brown mb-1.5">
              Tingkat Pengalaman Mahasiswa (Level)
            </label>
            <select
              value={minLevel}
              onChange={(e) => setMinLevel(e.target.value as typeof minLevel)}
              disabled={isEditingOpen}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:bg-cream disabled:cursor-not-allowed"
            >
              <option value="NEWCOMER">Semua Mahasiswa (Termasuk Pemula / Newcomer)</option>
              <option value="RELIABLE">Mahasiswa Berpengalaman (Level Reliable ke atas)</option>
              <option value="TRUSTED">Mahasiswa Mahir (Level Trusted ke atas)</option>
              <option value="EXPERT">Mahasiswa Ahli (Level Expert)</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-beige/80 bg-cream/30 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={beginnerFriendly}
              onChange={(e) => setBeginnerFriendly(e.target.checked)}
              disabled={isEditingOpen}
              className="mt-0.5 rounded border-beige text-primary-brown focus:ring-primary-brown"
            />
            <div>
              <span className="font-heading font-bold text-sm text-primary-brown">
                Ramah Pemula (Newcomer Lane - P1)
              </span>
              <p className="text-xs text-primary-brown/70 mt-0.5 leading-relaxed font-sans">
                Jika diaktifkan, tugas ini akan diprioritaskan eksklusif bagi mahasiswa pemula (Level Newcomer & Reliable) selama 30 menit pertama sejak dipublikasikan (BR-C5).
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* FOOTER AKSI */}
      <div className="flex items-center justify-between border-t border-beige pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Kembali
        </Button>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {isSubmitting
              ? "Menyimpan..."
              : isEditingOpen
              ? "Simpan Perubahan Pekerjaan"
              : "Simpan sebagai Draf"}
          </Button>
        </div>
      </div>
    </form>
  );
}
