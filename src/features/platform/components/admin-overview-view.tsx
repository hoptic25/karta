import Link from "next/link";
import {
  CreditCard,
  Briefcase,
  AlertTriangle,
  Wallet,
  TrendingUp,
  ShieldAlert,
  Building2,
  GraduationCap,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AdminDashboardSummary } from "../admin-overview";
import type { JobStatus } from "@/generated/prisma/client";

interface AdminOverviewViewProps {
  summary: AdminDashboardSummary;
}

const statusLabels: Record<JobStatus, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-700" },
  OPEN: { label: "Buka (Mencari Pelamar)", color: "bg-blue-100 text-blue-800" },
  CLAIMED: { label: "Diklaim (Belum Mulai)", color: "bg-amber-100 text-amber-800" },
  IN_PROGRESS: { label: "Sedang Dikerjakan", color: "bg-purple-100 text-purple-800" },
  SUBMITTED: { label: "Menunggu Review UMKM", color: "bg-indigo-100 text-indigo-800" },
  REVISION_REQUESTED: { label: "Revisi Diminta", color: "bg-orange-100 text-orange-800" },
  ACCEPTED: { label: "Selesai (Diterima)", color: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "Ditolak UMKM", color: "bg-rose-100 text-rose-800" },
  DISPUTED: { label: "Dalam Sengketa", color: "bg-red-100 text-red-800" },
  EXPIRED: { label: "Kedaluwarsa", color: "bg-stone-100 text-stone-700" },
  CANCELLED: { label: "Dibatalkan", color: "bg-zinc-100 text-zinc-700" },
};

export function AdminOverviewView({ summary }: AdminOverviewViewProps) {
  const totalQueueItems =
    summary.queues.pendingSubscriptions +
    summary.queues.requestedWithdrawals +
    summary.queues.openDisputes +
    summary.queues.openFailureReports;

  return (
    <div className="space-y-8">
      {/* Top Welcome & Queue Alert */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary-brown">
            Ringkasan Operasional Marketplace
          </h1>
          <p className="text-sm text-primary-brown/70 mt-1">
            Pantau kesehatan marketplace, antrean verifikasi, dan distribusi tugas mikro KARTA.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge
            className={`px-3 py-1 text-xs font-bold ${
              totalQueueItems > 0
                ? "bg-amber-600 text-white animate-pulse"
                : "bg-earth-sage text-white"
            }`}
          >
            {totalQueueItems > 0
              ? `${totalQueueItems} Aksi Butuh Tindakan`
              : "Semua Antrean Bersih"}
          </Badge>
        </div>
      </div>

      {/* ACTION QUEUES / ANTREAN TINDAKAN */}
      <div className="space-y-3">
        <h2 className="font-heading text-base font-bold text-primary-brown flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-earth-primary" />
          <span>Antrean Tindakan Admin (Prioritas Operasional)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Subscriptions Queue */}
          <Link href="/admin/subscriptions">
            <Card className="border-beige bg-white hover:border-earth-primary/50 transition-all hover:shadow-sm cursor-pointer h-full">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary-brown/60 font-semibold uppercase tracking-wider">
                    Verifikasi Paket
                  </p>
                  <p className="font-heading text-2xl font-bold text-primary-brown mt-1">
                    {summary.queues.pendingSubscriptions}
                  </p>
                  <p className="text-[11px] text-primary-brown/50 mt-0.5">
                    Bukti transfer langganan UMKM
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    summary.queues.pendingSubscriptions > 0
                      ? "bg-amber-100 text-amber-700"
                      : "bg-cream text-primary-brown/40"
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Withdrawals Queue */}
          <Link href="/admin/withdrawals">
            <Card className="border-beige bg-white hover:border-earth-primary/50 transition-all hover:shadow-sm cursor-pointer h-full">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary-brown/60 font-semibold uppercase tracking-wider">
                    Penarikan Saldo
                  </p>
                  <p className="font-heading text-2xl font-bold text-primary-brown mt-1">
                    {summary.queues.requestedWithdrawals}
                  </p>
                  <p className="text-[11px] text-primary-brown/50 mt-0.5">
                    Permintaan pencairan mahasiswa
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    summary.queues.requestedWithdrawals > 0
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-cream text-primary-brown/40"
                  }`}
                >
                  <Wallet className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Disputes Queue */}
          <Link href="/admin/disputes">
            <Card className="border-beige bg-white hover:border-earth-primary/50 transition-all hover:shadow-sm cursor-pointer h-full">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary-brown/60 font-semibold uppercase tracking-wider">
                    Sengketa Terbuka
                  </p>
                  <p className="font-heading text-2xl font-bold text-primary-brown mt-1">
                    {summary.queues.openDisputes}
                  </p>
                  <p className="text-[11px] text-primary-brown/50 mt-0.5">
                    Sanggahan penolakan tugas
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    summary.queues.openDisputes > 0
                      ? "bg-rose-100 text-rose-700"
                      : "bg-cream text-primary-brown/40"
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Failure Reports Queue */}
          <Link href="/admin/disputes">
            <Card className="border-beige bg-white hover:border-earth-primary/50 transition-all hover:shadow-sm cursor-pointer h-full">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary-brown/60 font-semibold uppercase tracking-wider">
                    Laporan Kendala
                  </p>
                  <p className="font-heading text-2xl font-bold text-primary-brown mt-1">
                    {summary.queues.openFailureReports}
                  </p>
                  <p className="text-[11px] text-primary-brown/50 mt-0.5">
                    Kendala pengerjaan dari UMKM
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    summary.queues.openFailureReports > 0
                      ? "bg-purple-100 text-purple-700"
                      : "bg-cream text-primary-brown/40"
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* USER & FINANCIAL STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-beige bg-white shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-primary-brown/60">
              Total Mahasiswa
            </CardDescription>
            <CardTitle className="font-heading text-2xl font-bold text-primary-brown flex items-center justify-between">
              <span>{summary.users.students.toLocaleString("id-ID")}</span>
              <GraduationCap className="w-5 h-5 text-earth-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-primary-brown/60">
              Terverifikasi dari perguruan tinggi mitra
            </p>
          </CardContent>
        </Card>

        <Card className="border-beige bg-white shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-primary-brown/60">
              Total UMKM
            </CardDescription>
            <CardTitle className="font-heading text-2xl font-bold text-primary-brown flex items-center justify-between">
              <span>{summary.users.umkm.toLocaleString("id-ID")}</span>
              <Building2 className="w-5 h-5 text-earth-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-primary-brown/60">
              Bisnis lokal terdaftar di marketplace
            </p>
          </CardContent>
        </Card>

        <Card className="border-beige bg-white shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-primary-brown/60">
              Saldo Siap Cair (Payable)
            </CardDescription>
            <CardTitle className="font-heading text-2xl font-bold text-earth-primary flex items-center justify-between">
              <span>{formatCurrency(summary.financial.totalPayableIdr)}</span>
              <Wallet className="w-5 h-5 text-earth-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-primary-brown/60">
              Hak mahasiswa yang belum ditarik
            </p>
          </CardContent>
        </Card>

        <Card className="border-beige bg-white shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-primary-brown/60">
              Platform Fee Diakui
            </CardDescription>
            <CardTitle className="font-heading text-2xl font-bold text-primary-brown flex items-center justify-between">
              <span>{formatCurrency(summary.financial.totalPlatformFeeIdr)}</span>
              <TrendingUp className="w-5 h-5 text-earth-sage" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-primary-brown/60">
              Pendapatan operasional platform
            </p>
          </CardContent>
        </Card>
      </div>

      {/* JOBS PER STATUS DISTRIBUTION */}
      <Card className="border-beige bg-white shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-heading text-lg font-bold text-primary-brown">
                Distribusi Pekerjaan per Status ({summary.totalJobs.toLocaleString("id-ID")} Total)
              </CardTitle>
              <CardDescription className="text-xs text-primary-brown/70 mt-1">
                Visualisasi siklus hidup penugasan mikro dari tahap publikasi hingga penyelesaian
              </CardDescription>
            </div>
            <Briefcase className="w-5 h-5 text-earth-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {(Object.keys(statusLabels) as JobStatus[]).map((st) => {
              const count = summary.jobsByStatus[st] || 0;
              const info = statusLabels[st];

              return (
                <div
                  key={st}
                  className="p-3 rounded-xl border border-beige/60 bg-cream/30 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${info.color}`}
                    >
                      {st}
                    </span>
                    <span className="font-heading text-base font-bold text-primary-brown">
                      {count}
                    </span>
                  </div>
                  <p className="text-[11px] text-primary-brown/70 font-medium">
                    {info.label}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

