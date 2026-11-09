"use client";

import { useState } from "react";
import Link from "next/link";
import { formatRupiah, formatDateOnly } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Job, AcceptanceCriterion, Subscription, Package, JobAssignment, StudentProfile, User, Campus, JobRole } from "@/generated/prisma/client";
import {
  Plus,
  Search,
  Briefcase,
  Clock,
  CheckCircle2,
  ChevronRight,
  User as UserIcon,
} from "lucide-react";

type JobWithRelations = Job & {
  jobRole: JobRole | null;
  criteria: AcceptanceCriterion[];
  subscription: (Subscription & { package: Package }) | null;
  assignments: (JobAssignment & {
    student: StudentProfile & {
      user: Pick<User, "name" | "image" | "email">;
      campus: Pick<Campus, "name">;
    };
  })[];
  _count: {
    assignments: number;
    images: number;
  };
};

interface JobListViewProps {
  jobs: JobWithRelations[];
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  DRAFT: {
    label: "Draf",
    bg: "bg-zinc-100",
    text: "text-zinc-700",
    border: "border-zinc-300",
  },
  OPEN: {
    label: "Membuka Pelamar",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-300",
  },
  CLAIMED: {
    label: "Diklaim Mahasiswa",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-300",
  },
  IN_PROGRESS: {
    label: "Sedang Dikerjakan",
    bg: "bg-indigo-50",
    text: "text-indigo-800",
    border: "border-indigo-300",
  },
  SUBMITTED: {
    label: "Menunggu Review",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300",
  },
  REVISION_REQUESTED: {
    label: "Revisi Diminta",
    bg: "bg-orange-50",
    text: "text-orange-800",
    border: "border-orange-300",
  },
  ACCEPTED: {
    label: "Selesai (Diterima)",
    bg: "bg-emerald-100",
    text: "text-emerald-900",
    border: "border-emerald-400",
  },
  REJECTED: {
    label: "Ditolak",
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-300",
  },
  DISPUTED: {
    label: "Dalam Sengketa",
    bg: "bg-purple-50",
    text: "text-purple-800",
    border: "border-purple-300",
  },
  CANCELLED: {
    label: "Dibatalkan",
    bg: "bg-zinc-100",
    text: "text-zinc-600",
    border: "border-zinc-300",
  },
  EXPIRED: {
    label: "Kedaluwarsa",
    bg: "bg-zinc-100",
    text: "text-zinc-600",
    border: "border-zinc-300",
  },
};

const ROLE_SHORT_LABELS: Record<string, string> = {
  DATA_ENTRY: "Data Entry",
  CONTENT_WRITER: "Content Writer",
  GRAPHIC_DESIGNER: "Graphic Designer",
  SOCIAL_MEDIA: "Social Media",
  VIDEO_EDITOR: "Video Editor",
  UIUX_DESIGNER: "UI/UX Designer",
  FRONTEND_DEV: "Frontend Dev",
};

export function JobListView({ jobs }: JobListViewProps) {
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredJobs = jobs.filter((job) => {
    // Tab filter
    if (activeTab === "DRAFT" && job.status !== "DRAFT") return false;
    if (activeTab === "OPEN" && job.status !== "OPEN") return false;
    if (
      activeTab === "ACTIVE" &&
      !["CLAIMED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED"].includes(job.status)
    )
      return false;
    if (activeTab === "COMPLETED" && job.status !== "ACCEPTED") return false;
    if (
      activeTab === "CLOSED" &&
      !["CANCELLED", "EXPIRED", "REJECTED"].includes(job.status)
    )
      return false;

    // Search filter
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return (
        job.title.toLowerCase().includes(q) ||
        job.description.toLowerCase().includes(q) ||
        (job.jobRole?.key.toLowerCase().includes(q) ?? false)
      );
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* HEADER & CALL TO ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary-brown">
            Daftar Pekerjaan Mikro
          </h1>
          <p className="mt-1 text-xs text-primary-brown/70 font-sans">
            Kelola draf tugas, pantau pengerjaan oleh mahasiswa kampus, dan verifikasi hasil kerja.
          </p>
        </div>

        <Link href="/umkm/jobs/new" className={buttonVariants({ className: "gap-2" })}>
          <Plus className="w-4 h-4" />
          Buat Pekerjaan Baru
        </Link>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* TABS */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-beige bg-white p-1 text-xs">
          {[
            { id: "ALL", label: `Semua (${jobs.length})` },
            { id: "DRAFT", label: `Draf (${jobs.filter((j) => j.status === "DRAFT").length})` },
            { id: "OPEN", label: `Buka Pelamar (${jobs.filter((j) => j.status === "OPEN").length})` },
            {
              id: "ACTIVE",
              label: `Sedang Berjalan (${jobs.filter((j) =>
                ["CLAIMED", "IN_PROGRESS", "SUBMITTED", "REVISION_REQUESTED"].includes(j.status)
              ).length})`,
            },
            {
              id: "COMPLETED",
              label: `Selesai (${jobs.filter((j) => j.status === "ACCEPTED").length})`,
            },
            {
              id: "CLOSED",
              label: `Tutup/Lainnya (${jobs.filter((j) =>
                ["CANCELLED", "EXPIRED", "REJECTED"].includes(j.status)
              ).length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-earth-primary text-white font-semibold"
                  : "text-primary-brown/70 hover:bg-cream hover:text-primary-brown"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SEARCH INPUT */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-primary-brown/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul pekerjaan..."
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* JOBS LIST */}
      {filteredJobs.length === 0 ? (
        <div className="rounded-2xl border border-beige bg-white p-12 text-center shadow-xs space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream text-primary-brown/50">
            <Briefcase className="h-7 w-7" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-primary-brown">
              Belum Ada Pekerjaan di Kategori Ini
            </h3>
            <p className="text-xs text-primary-brown/70 max-w-md mx-auto mt-1 font-sans">
              Mulai buat tugas mikro pertama Anda untuk menghubungkan kebutuhan usaha Anda dengan talenta mahasiswa universitas di sekitar Anda.
            </p>
          </div>
          <Link
            href="/umkm/jobs/new"
            className={buttonVariants({ size: "sm", className: "gap-2" })}
          >
            <Plus className="w-4 h-4" />
            Buat Pekerjaan Sekarang
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredJobs.map((job) => {
            const statusCfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.DRAFT;
            const activeAssignee = job.assignments[0];

            return (
              <div
                key={job.id}
                className="group rounded-2xl border border-beige bg-white p-5 shadow-xs hover:border-earth-primary/50 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                    >
                      {statusCfg.label}
                    </span>

                    <span className="rounded-md bg-earth-cream px-2 py-0.5 text-[11px] font-semibold text-earth-coffee border border-earth-sand/30">
                      {ROLE_SHORT_LABELS[job.jobRole?.key || ""] || job.jobRole?.key || "Unknown"}
                    </span>

                    {job.isPaid ? (
                      <span className="text-xs font-bold text-earth-primary">
                        Kompensasi: {formatRupiah(job.studentShareIdr)}
                      </span>
                    ) : (
                      <span className="rounded-md bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[11px] font-bold">
                        Volunteer / Poin
                      </span>
                    )}

                    {job.beginnerFriendly && (
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                        Ramah Pemula
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/umkm/jobs/${job.id}`}
                    className="block font-heading font-bold text-base text-primary-brown group-hover:text-earth-primary transition-colors line-clamp-1"
                  >
                    {job.title}
                  </Link>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-primary-brown/70 font-sans">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Tenggat: {formatDateOnly(job.deadlineAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-earth-sage" />
                      <span>{job.criteria.length} kriteria penerimaan</span>
                    </div>

                    {activeAssignee && (
                      <div className="flex items-center gap-1.5 font-medium text-earth-coffee">
                        <UserIcon className="w-3.5 h-3.5 text-earth-primary" />
                        <span>
                          Dikerjakan: {activeAssignee.student.user.name} ({activeAssignee.student.campus.name})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-beige/60">
                  <Link
                    href={`/umkm/jobs/${job.id}`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className: "gap-1.5",
                    })}
                  >
                    Kelola Tugas
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
