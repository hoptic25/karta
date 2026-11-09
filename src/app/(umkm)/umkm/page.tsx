import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UmkmShell } from "@/components/layout/umkm-shell";
import { getUmkmProfileByUserId } from "@/features/auth";
import { getUmkmDashboardSummary } from "@/features/jobs";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import {
  Briefcase,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  CreditCard,
  ChevronRight,
} from "lucide-react";

export const metadata = {
  title: "Dashboard UMKM | KARTA",
  description: "Pantau kuota posting, review pekerjaan mahasiswa, dan status langganan bisnis Anda.",
};

export default async function UmkmDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?as=umkm");
  }

  const umkm = await getUmkmProfileByUserId(session.user.id);

  if (!umkm) {
    throw new Error("Profil UMKM tidak ditemukan.");
  }

  const {
    overview,
    counts,
    remainingPaidQuota,
    remainingFreeQuota,
    pendingReviewJobs,
  } = await getUmkmDashboardSummary(umkm.id);

  return (
    <UmkmShell activePath="/umkm">
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-beige pb-6">
          <div>
            <h1 className="font-heading text-3xl font-bold text-primary-brown">
              Selamat Datang, {umkm.businessName}
            </h1>
            <p className="mt-1 text-xs text-primary-brown/70 font-sans">
              Pantau status tugas mikro, evaluasi hasil kerja mahasiswa, dan kelola alokasi kuota Anda.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/umkm/jobs/new">
              <Button size="sm">
                <PlusCircle className="size-4 mr-1" />
                Buat Job Baru
              </Button>
            </Link>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-beige bg-white p-5 rounded-lg space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs text-primary-brown/70">
              <span>Sisa Kuota Berbayar</span>
              <CreditCard className="size-4 text-primary-brown" />
            </div>
            <p className="font-heading text-3xl font-bold text-primary-brown">
              {remainingPaidQuota}
            </p>
            <p className="text-[11px] text-primary-brown/60">
              {overview.activePaidSub
                ? `Paket: ${overview.activePaidSub.package.name}`
                : "Tidak ada paket berbayar aktif"}
            </p>
          </div>

          <div className="border border-beige bg-white p-5 rounded-lg space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs text-primary-brown/70">
              <span>Kuota Gratis Bulan Ini</span>
              <CheckCircle2 className="size-4 text-earth-sage" />
            </div>
            <p className="font-heading text-3xl font-bold text-earth-sage">
              {remainingFreeQuota} / 3
            </p>
            <p className="text-[11px] text-primary-brown/60">
              Volunteer Project bulanan
            </p>
          </div>

          <div className="border border-beige bg-white p-5 rounded-lg space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs text-primary-brown/70">
              <span>Sedang Dikerjakan</span>
              <Clock className="size-4 text-primary-brown" />
            </div>
            <p className="font-heading text-3xl font-bold text-primary-brown">
              {(counts["IN_PROGRESS"] || 0) + (counts["CLAIMED"] || 0)}
            </p>
            <p className="text-[11px] text-primary-brown/60">
              Oleh talenta kampus mitra
            </p>
          </div>

          <div className="border border-beige bg-white p-5 rounded-lg space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs text-primary-brown/70">
              <span>Menunggu Review Anda</span>
              <AlertCircle className="size-4 text-amber-600" />
            </div>
            <p className="font-heading text-3xl font-bold text-amber-700">
              {counts["SUBMITTED"] || 0}
            </p>
            <p className="text-[11px] text-primary-brown/60">
              SLA 3 hari sebelum auto-accept
            </p>
          </div>
        </div>

        {/* PRD §11.1: Pending Reviews with SLA Countdown */}
        {pendingReviewJobs.length > 0 && (
          <div className="border border-amber-200 bg-amber-50/50 p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-5 text-amber-700" />
                <h3 className="font-heading text-base font-bold text-primary-brown">
                  Hasil Pekerjaan Menunggu Review ({pendingReviewJobs.length})
                </h3>
              </div>
              <span className="text-[11px] text-amber-800 font-medium">
                Pekerjaan otomatis diterima bila melewati batas SLA 3 hari
              </span>
            </div>

            <div className="divide-y divide-amber-200/60 bg-white rounded-lg border border-amber-200/80">
              {pendingReviewJobs.map((job) => (
                <div key={job.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <Link
                      href={`/umkm/jobs/${job.id}`}
                      className="font-semibold text-xs text-primary-brown hover:text-earth-primary line-clamp-1"
                    >
                      {job.title}
                    </Link>
                    <p className="text-[11px] text-primary-brown/70">
                      Diserahkan oleh <strong>{job.studentName}</strong> ({job.campusName}) • Pengiriman #{job.submissionNumber}
                    </p>
                    {job.reviewDueAt && (
                      <p className="text-[10px] text-amber-800 font-medium flex items-center gap-1">
                        <Clock className="size-3" />
                        Batas Review: {formatDateTime(job.reviewDueAt)}
                      </p>
                    )}
                  </div>

                  <Link href={`/umkm/jobs/${job.id}`}>
                    <Button size="sm" className="shrink-0 text-xs">
                      Tinjau Hasil Kerja <ChevronRight className="size-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links & CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-beige bg-white p-6 rounded-lg space-y-3">
            <h3 className="font-heading text-lg font-semibold text-primary-brown flex items-center gap-2">
              <Briefcase className="size-5" />
              Kelola Daftar Pekerjaan
            </h3>
            <p className="text-xs text-primary-brown/80 font-sans leading-relaxed">
              Lihat status draf, pekerjaan terbuka yang siap diambil mahasiswa, dan tinjau hasil pekerjaan yang baru dikumpulkan.
            </p>
            <div className="pt-2">
              <Link href="/umkm/jobs">
                <Button variant="outline" size="sm">
                  Buka Daftar Job
                  <ArrowRight className="size-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="border border-beige bg-white p-6 rounded-lg space-y-3">
            <h3 className="font-heading text-lg font-semibold text-primary-brown flex items-center gap-2">
              <CreditCard className="size-5" />
              Kelola Paket & Kuota
            </h3>
            <p className="text-xs text-primary-brown/80 font-sans leading-relaxed">
              Tambah kuota pekerjaan mikro bisnis Anda untuk meningkatkan kecepatan pengerjaan tugas operasional.
            </p>
            <div className="pt-2">
              <Link href="/umkm/subscription">
                <Button variant="outline" size="sm">
                  Buka Halaman Langganan
                  <ArrowRight className="size-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </UmkmShell>
  );
}
