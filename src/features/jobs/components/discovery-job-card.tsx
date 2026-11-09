"use client";

import Link from "next/link";
import Image from "next/image";
import { formatRupiah, formatDateOnly } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import type { PackageTier } from "@/generated/prisma/client";
import {
  Clock,
  CheckCircle2,
  Star,
  Building2,
  ChevronRight,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export type DiscoveryJob = {
  id: string;
  title: string;
  description: string;
  jobRole: { id: string; key: string; label: string } | null;
  packageTier: PackageTier | null;
  isPaid: boolean;
  studentShareIdr: number;
  deadlineAt: Date;
  beginnerFriendly: boolean;
  umkm: {
    id: string;
    businessName: string;
    logoUrl: string | null;
    ratingAvg: number;
    ratingCount: number;
    isCampusPartner: boolean;
    partnerCampus?: { name: string } | null;
  };
  criteria: { id: string; text: string }[];
  claimCutoffAt: Date;
  eligibility: {
    eligible: boolean;
    reason?: string;
  };
};

export interface DiscoveryJobCardProps {
  job: DiscoveryJob;
}

const ROLE_LABELS: Record<string, string> = {
  DATA_ENTRY: "Data Entry",
  CONTENT_WRITER: "Penulisan Konten",
  GRAPHIC_DESIGNER: "Desain Grafis",
  SOCIAL_MEDIA: "Media Sosial",
  VIDEO_EDITOR: "Video Editor",
  UIUX_DESIGNER: "UI/UX Designer",
  FRONTEND_DEV: "Frontend Dev",
};

export function DiscoveryJobCard({ job }: DiscoveryJobCardProps) {
  // Hitung sisa waktu klaim dalam jam
  const now = new Date();
  const msRemaining = new Date(job.claimCutoffAt).getTime() - now.getTime();
  const hoursRemaining = Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60)));
  const daysRemaining = Math.floor(hoursRemaining / 24);

  return (
    <div className="group rounded-2xl border border-beige bg-white p-5 shadow-xs hover:border-earth-primary/50 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
      {/* ATAS: UMKM & BADGES */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          {/* Logo & Nama UMKM */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-10 w-10 rounded-xl border border-beige/80 bg-cream/50 overflow-hidden shrink-0 flex items-center justify-center">
              {job.umkm.logoUrl ? (
                <Image
                  src={job.umkm.logoUrl}
                  alt={job.umkm.businessName}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <Building2 className="w-5 h-5 text-primary-brown/40" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-bold text-xs text-primary-brown truncate">
                  {job.umkm.businessName}
                </span>
                {job.umkm.isCampusPartner && (
                  <span
                    title="UMKM Binaan / Mitra Kampus"
                    className="inline-flex items-center text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-1.5 py-0.2 rounded"
                  >
                    Mitra
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-[11px] text-primary-brown/70">
                <Star className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0" />
                <span className="font-semibold text-primary-brown">
                  {job.umkm.ratingAvg > 0 ? job.umkm.ratingAvg.toFixed(1) : "Baru"}
                </span>
                {job.umkm.ratingCount > 0 && (
                  <span>({job.umkm.ratingCount})</span>
                )}
                {job.umkm.partnerCampus && (
                  <span className="truncate">· {job.umkm.partnerCampus.name}</span>
                )}
              </div>
            </div>
          </div>

          {/* Tier & Role Badge */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="rounded-md bg-earth-cream px-2 py-0.5 text-[10px] font-bold text-earth-coffee border border-earth-sand/30">
              {ROLE_LABELS[job.jobRole?.key || ""] || job.jobRole?.label || "Unknown"}
            </span>
            {job.packageTier && job.packageTier !== "FREE" && (
              <span className="text-[9px] font-mono uppercase tracking-wider text-primary-brown/60">
                Tier {job.packageTier}
              </span>
            )}
          </div>
        </div>

        {/* Judul Tugas */}
        <div>
          <Link
            href={`/student/jobs/${job.id}`}
            className="block font-heading font-bold text-base text-primary-brown group-hover:text-earth-primary transition-colors line-clamp-2 leading-snug"
          >
            {job.title}
          </Link>
          <p className="mt-1 text-xs text-primary-brown/70 line-clamp-2 font-sans">
            {job.description}
          </p>
        </div>
      </div>

      {/* TENGAH: INFO KRITERIA & DEADLINE */}
      <div className="pt-2 border-t border-beige/60 space-y-2 text-xs font-sans text-primary-brown/80">
        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1 text-primary-brown/70">
            <CheckCircle2 className="w-3.5 h-3.5 text-earth-sage shrink-0" />
            {job.criteria.length} Kriteria Penerimaan
          </span>

          <span className="flex items-center gap-1 text-primary-brown/70">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            Tenggat: {formatDateOnly(job.deadlineAt)}
          </span>
        </div>

        {/* Sisa batas klaim (BR-J5) */}
        <div className="text-[11px] text-amber-800 bg-amber-50/80 rounded-lg px-2.5 py-1 border border-amber-200/60 flex items-center justify-between">
          <span>Batas Pengambilan:</span>
          <span className="font-semibold">
            {daysRemaining > 0
              ? `${daysRemaining} hari ${hoursRemaining % 24} jam lagi`
              : `${hoursRemaining} jam lagi`}
          </span>
        </div>

        {/* Newcomer Lane pill */}
        {job.beginnerFriendly && (
          <div className="text-[10px] text-blue-800 bg-blue-50 rounded-md px-2 py-0.5 border border-blue-200/60 flex items-center gap-1 font-semibold">
            <Sparkles className="w-3 h-3 text-blue-600 shrink-0" />
            <span>Ramah Pemula (Newcomer Friendly)</span>
          </div>
        )}
      </div>

      {/* BAWAH: IMBALAN & CTA */}
      <div className="pt-3 border-t border-beige/60 flex items-center justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-primary-brown/60">
            Imbalan Tugas
          </div>
          {job.isPaid ? (
            <div className="font-heading font-bold text-sm text-earth-primary">
              {formatRupiah(job.studentShareIdr)}
            </div>
          ) : (
            <div className="inline-flex items-center rounded-md bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[10px] font-bold">
              Volunteer (+10 Poin)
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!job.eligibility.eligible && (
            <span
              title={job.eligibility.reason}
              className="hidden sm:inline-flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-100 px-2 py-1 rounded border border-zinc-200"
            >
              <AlertCircle className="w-3 h-3 text-zinc-400" />
              Syarat Belum Terpenuhi
            </span>
          )}

          <Link
            href={`/student/jobs/${job.id}`}
            className={buttonVariants({
              variant: job.eligibility.eligible ? "default" : "outline",
              size: "sm",
              className: "gap-1",
            })}
          >
            Lihat Detail
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
