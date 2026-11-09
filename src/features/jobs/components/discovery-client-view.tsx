"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DiscoveryJobCard, type DiscoveryJob } from "./discovery-job-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { JobRole } from "@/generated/prisma/client";
import {
  Search,
  ArrowUpDown,
  Compass,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface DiscoveryClientViewProps {
  initialJobs: DiscoveryJob[];
  studentRoles: JobRole[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  activeAssignmentsCount: number;
  activeUnpaidCount: number;
}

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "Semua Keahlian" },
  { value: "data_entry", label: "Data Entry" },
  { value: "content_writer", label: "Penulisan Konten" },
  { value: "graphic_designer", label: "Desain Grafis" },
  { value: "social_media", label: "Media Sosial" },
  { value: "video_editor", label: "Video Editor" },
  { value: "uiux_designer", label: "UI/UX Designer" },
  { value: "frontend_dev", label: "Frontend Dev" },
];

export function DiscoveryClientView({
  initialJobs,
  studentRoles,
  pagination,
  activeAssignmentsCount,
  activeUnpaidCount,
}: DiscoveryClientViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentRole = (searchParams.get("role") as JobRole | "ALL") || "ALL";
  const currentType = (searchParams.get("type") as "ALL" | "PAID" | "UNPAID") || "ALL";
  const currentSort = (searchParams.get("sort") as "RECOMMENDED" | "LATEST" | "DEADLINE" | "REWARD") || "RECOMMENDED";
  const currentSearch = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(currentSearch);

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "ALL" || val === "") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    // Reset ke halaman 1 saat filter berubah
    if (!updates.page) {
      params.delete("page");
    }

    startTransition(() => {
      router.push(`/student/jobs?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput });
  };

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage.toString() });
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary-brown">
            Eksplorasi Lowongan Mikro
          </h1>
          <p className="mt-1 text-xs text-primary-brown/70 font-sans">
            Temukan tugas mikro dari UMKM lokal sesuai keahlian dan jadwal kuliah Anda.
          </p>
        </div>

        {/* Ringkasan status pekerjaan aktif */}
        <div className="flex items-center gap-2 bg-white rounded-xl border border-beige p-2.5 px-4 text-xs font-sans shadow-xs">
          <div className="flex items-center gap-1.5 text-primary-brown">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Pekerjaan Aktif Anda:</span>
            <strong className="text-earth-primary">{activeAssignmentsCount}</strong>
          </div>
          {activeUnpaidCount > 0 && (
            <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
              1 Relawan Aktif
            </span>
          )}
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS (D-1) */}
      <div className="rounded-2xl border border-beige bg-white p-4 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          {/* SEARCH INPUT */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-primary-brown/40" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari tugas (mis: Desain feeds, riset data, transkrip)..."
              className="pl-9 text-xs font-sans"
            />
          </div>

          <Button type="submit" size="sm" disabled={isPending} className="shrink-0 gap-1.5">
            <Search className="w-3.5 h-3.5" />
            Cari
          </Button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-beige/60 text-xs">
          {/* FILTER ROLE & TIPE */}
          <div className="flex flex-wrap items-center gap-2">
            {/* ROLE SELECTOR */}
            <select
              value={typeof currentRole === "string" ? currentRole : currentRole.id}
              onChange={(e) => updateFilters({ role: e.target.value })}
              className="rounded-lg border border-input bg-transparent px-3 py-1.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-sans"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* TIPE IMBALAN SELECTOR */}
            <select
              value={currentType}
              onChange={(e) => updateFilters({ type: e.target.value })}
              className="rounded-lg border border-input bg-transparent px-3 py-1.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-sans"
            >
              <option value="ALL">Semua Jenis Imbalan</option>
              <option value="PAID">Berbayar (IDR)</option>
              <option value="UNPAID">Volunteer / Pengalaman (Poin Penuh)</option>
            </select>
          </div>

          {/* SORTING SELECTOR (D-1 & D-2) */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-primary-brown/60 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Urutkan:
            </span>
            <select
              value={currentSort}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="rounded-lg border border-input bg-transparent px-3 py-1.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-sans font-semibold text-primary-brown"
            >
              <option value="RECOMMENDED">Rekomendasi Pintar (D-2)</option>
              <option value="LATEST">Terbaru Diterbitkan</option>
              <option value="DEADLINE">Deadline Paling Dekat</option>
              <option value="REWARD">Imbalan Tertinggi</option>
            </select>
          </div>
        </div>
      </div>

      {/* JOBS GRID */}
      {initialJobs.length === 0 ? (
        <div className="rounded-2xl border border-beige bg-white p-12 text-center shadow-xs space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream text-primary-brown/50">
            <Compass className="h-7 w-7" />
          </div>
          <h3 className="font-heading font-bold text-lg text-primary-brown">
            Tidak Ada Pekerjaan yang Sesuai
          </h3>
          <p className="text-xs text-primary-brown/70 max-w-md mx-auto font-sans leading-relaxed">
            Coba ubah kata kunci pencarian atau sesuaikan filter keahlian untuk melihat peluang tugas mikro lainnya.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchInput("");
              updateFilters({ role: "ALL", type: "ALL", search: "", sort: "RECOMMENDED" });
            }}
          >
            Reset Semua Filter
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {initialJobs.map((job) => (
            <DiscoveryJobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* PAGINATION CONTROLS (D-1: 20 per page) */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-beige pt-5 text-xs">
          <span className="text-primary-brown/60">
            Menampilkan halaman <strong>{pagination.page}</strong> dari{" "}
            <strong>{pagination.totalPages}</strong> (Total {pagination.total} lowongan)
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || isPending}
              className="gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isPending}
              className="gap-1"
            >
              Selanjutnya
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

