"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatRupiah, formatDateTime, formatDateOnly } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type {
  JobAssignment,
  Job,
  AcceptanceCriterion,
  Submission,
  Review,
  JobStatus,
} from "@/generated/prisma/client";
import {
  Clock,
  Building2,
  ChevronRight,
  Search,
  Briefcase,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export type MyJobAssignmentItem = JobAssignment & {
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
  };
  submissions: (Submission & {
    review: Review | null;
  })[];
};

interface StudentMyJobsViewProps {
  assignments: MyJobAssignmentItem[];
  currentTab: string;
  searchQuery: string;
}

const TABS: { id: string; label: string; countBadge?: (items: MyJobAssignmentItem[]) => number }[] = [
  { id: "ALL", label: "Semua Tugas" },
  {
    id: "ACTIVE",
    label: "Sedang Dikerjakan",
    countBadge: (items) =>
      items.filter((a) => a.job.status === "CLAIMED" || a.job.status === "IN_PROGRESS").length,
  },
  {
    id: "REVIEW",
    label: "Menunggu Review",
    countBadge: (items) => items.filter((a) => a.job.status === "SUBMITTED").length,
  },
  {
    id: "REVISION",
    label: "Perlu Revisi",
    countBadge: (items) => items.filter((a) => a.job.status === "REVISION_REQUESTED").length,
  },
  {
    id: "COMPLETED",
    label: "Selesai Diterima",
    countBadge: (items) => items.filter((a) => a.job.status === "ACCEPTED").length,
  },
  {
    id: "OTHER",
    label: "Lainnya",
  },
];

function getStatusBadge(status: JobStatus) {
  switch (status) {
    case "CLAIMED":
      return {
        label: "Belum Dimulai",
        className: "bg-blue-50 text-blue-800 border-blue-200",
      };
    case "IN_PROGRESS":
      return {
        label: "Dalam Pengerjaan",
        className: "bg-amber-50 text-amber-800 border-amber-200",
      };
    case "SUBMITTED":
      return {
        label: "Menunggu Review",
        className: "bg-purple-50 text-purple-800 border-purple-200",
      };
    case "REVISION_REQUESTED":
      return {
        label: "Perlu Revisi",
        className: "bg-orange-50 text-orange-800 border-orange-200",
      };
    case "ACCEPTED":
      return {
        label: "Selesai Diterima",
        className: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    case "REJECTED":
      return {
        label: "Ditolak",
        className: "bg-red-50 text-red-800 border-red-200",
      };
    case "DISPUTED":
      return {
        label: "Dalam Sengketa",
        className: "bg-rose-50 text-rose-800 border-rose-200",
      };
    case "CANCELLED":
      return {
        label: "Dibatalkan",
        className: "bg-gray-100 text-gray-700 border-gray-200",
      };
    case "EXPIRED":
      return {
        label: "Kedaluwarsa",
        className: "bg-gray-100 text-gray-600 border-gray-200",
      };
    default:
      return {
        label: status,
        className: "bg-cream text-primary-brown border-beige",
      };
  }
}

export function StudentMyJobsView({
  assignments,
  currentTab,
  searchQuery,
}: StudentMyJobsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(searchQuery);

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "ALL" || val === "") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    startTransition(() => {
      router.push(`/student/my-jobs?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput });
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary-brown">
            Tugas & Workspace Saya
          </h1>
          <p className="mt-1 text-xs text-primary-brown/70 font-sans">
            Kelola pengerjaan tugas mikro, kumpulkan berkas, dan pantau hasil evaluasi UMKM.
          </p>
        </div>
      </div>

      {/* FILTER & TABS */}
      <div className="rounded-2xl border border-beige bg-white p-4 shadow-sm space-y-4">
        {/* PENCARIAN TUGAS */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-primary-brown/40" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari berdasarkan judul tugas..."
              className="pl-9 text-xs font-sans"
            />
          </div>
          <Button type="submit" size="sm" disabled={isPending} className="gap-1.5 shrink-0">
            <Search className="w-3.5 h-3.5" />
            Cari
          </Button>
        </form>

        {/* TAB LIST */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-beige/60 pt-3">
          {TABS.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => updateFilters({ tab: tab.id })}
                className={`rounded-lg px-3 py-1.5 text-xs font-sans font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-earth-primary text-white shadow-xs"
                    : "bg-transparent text-primary-brown/70 hover:bg-cream hover:text-primary-brown"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DAFTAR PENUGASAN TUGAS */}
      {assignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-beige bg-white p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream border border-beige/60 text-primary-brown/60">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-primary-brown">
              Tidak Ada Tugas pada Kategori Ini
            </h3>
            <p className="mt-1 text-xs text-primary-brown/60 font-sans max-w-sm mx-auto">
              {searchQuery
                ? `Tidak ditemukan tugas dengan kata kunci "${searchQuery}". Coba ubah pencarian Anda.`
                : "Anda belum memiliki tugas pada kategori ini. Jelajahi lowongan yang tersedia dan klaim tugas yang sesuai dengan minat Anda."}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/student/jobs"
              className={buttonVariants({ size: "sm", className: "gap-1.5" })}
            >
              <span>Eksplorasi Lowongan</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((assignment) => {
            const job = assignment.job;
            const badge = getStatusBadge(job.status);
            const latestSub = assignment.submissions[0];

            return (
              <div
                key={assignment.id}
                className="rounded-2xl border border-beige bg-white p-5 shadow-sm hover:border-earth-sand transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* HEADER CARD: STATUS & COMPENSATION */}
                  <div className="flex items-center justify-between gap-2 border-b border-beige/60 pb-3">
                    <span
                      className={`rounded-md border px-2.5 py-0.5 text-[11px] font-bold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-xs font-bold text-primary-brown font-sans">
                      {job.isPaid ? (
                        formatRupiah(job.studentShareIdr)
                      ) : (
                        <span className="text-amber-700 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          Volunteer (Poin Penuh)
                        </span>
                      )}
                    </span>
                  </div>

                  {/* JUDUL & PROFIL UMKM */}
                  <div>
                    <h3 className="font-heading text-base font-bold text-primary-brown line-clamp-1">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-primary-brown/70 font-sans">
                      <div className="relative h-4 w-4 rounded overflow-hidden flex items-center justify-center bg-cream shrink-0">
                        {job.umkm.logoUrl ? (
                          <Image
                            src={job.umkm.logoUrl}
                            alt={job.umkm.businessName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Building2 className="w-3 h-3 text-primary-brown/40" />
                        )}
                      </div>
                      <span className="font-semibold text-primary-brown truncate">
                        {job.umkm.businessName}
                      </span>
                      {job.umkm.isCampusPartner && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1 rounded shrink-0">
                          Mitra
                        </span>
                      )}
                    </div>
                  </div>

                  {/* INFO DEADLINE & PENGUMPULAN */}
                  <div className="rounded-xl bg-cream/40 p-3 text-xs text-primary-brown/80 space-y-1 font-sans border border-beige/40">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-primary-brown/60">
                        <Clock className="w-3.5 h-3.5" />
                        Tenggat Tugas:
                      </span>
                      <strong className="text-primary-brown">
                        {formatDateTime(job.deadlineAt)}
                      </strong>
                    </div>

                    {job.status === "CLAIMED" && (
                      <div className="text-[11px] text-amber-800 pt-1 border-t border-beige/40">
                        ⚠️ Segera tekan &quot;Mulai Kerjakan&quot; di Workspace.
                      </div>
                    )}

                    {job.status === "SUBMITTED" && job.reviewDueAt && (
                      <div className="text-[11px] text-purple-800 pt-1 border-t border-beige/40">
                        SLA Peninjauan UMKM: s/d {formatDateOnly(job.reviewDueAt)}
                      </div>
                    )}

                    {job.status === "REVISION_REQUESTED" && latestSub?.review && (
                      <div className="text-[11px] text-orange-900 pt-1 border-t border-beige/40">
                        Catatan Revisi: &ldquo;{latestSub.review.reason}&rdquo;
                      </div>
                    )}
                  </div>
                </div>

                {/* FOOTER ACTION */}
                <div className="pt-2 border-t border-beige/60 flex items-center justify-between">
                  <div className="text-[11px] text-primary-brown/60 font-sans">
                    Diklaim: {formatDateOnly(assignment.claimedAt)}
                  </div>
                  <Link
                    href={`/student/my-jobs/${job.id}`}
                    className={buttonVariants({
                      size: "sm",
                      className: "gap-1 font-semibold text-xs",
                    })}
                  >
                    <span>Buka Workspace</span>
                    <ChevronRight className="w-3.5 h-3.5" />
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
