import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UmkmShell } from "@/components/layout/umkm-shell";
import { getUmkmSubscriptionOverview } from "@/features/subscription";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  CreditCard,
} from "lucide-react";

export default async function UmkmDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?as=umkm");
  }

  const umkm = await prisma.umkmProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!umkm) {
    redirect("/onboarding/umkm");
  }

  const [overview, jobCounts] = await Promise.all([
    getUmkmSubscriptionOverview(umkm.id),
    prisma.job.groupBy({
      by: ["status"],
      where: { umkmId: umkm.id },
      _count: { status: true },
    }),
  ]);

  const counts: Record<string, number> = {};
  jobCounts.forEach((c) => {
    counts[c.status] = c._count.status;
  });

  const remainingPaidQuota = overview.activePaidSub
    ? overview.activePaidSub.quotaTotal - overview.activePaidSub.quotaUsed
    : 0;

  const remainingFreeQuota = overview.activeFreeSub
    ? overview.activeFreeSub.quotaTotal - overview.activeFreeSub.quotaUsed
    : 3;

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
          <div className="border border-beige bg-white p-5 rounded-lg space-y-2">
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

          <div className="border border-beige bg-white p-5 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs text-primary-brown/70">
              <span>Kuota Gratis Bulan Ini</span>
              <CheckCircle2 className="size-4 text-sage-green" />
            </div>
            <p className="font-heading text-3xl font-bold text-sage-green">
              {remainingFreeQuota} / 3
            </p>
            <p className="text-[11px] text-primary-brown/60">
              Volunteer Project bulanan
            </p>
          </div>

          <div className="border border-beige bg-white p-5 rounded-lg space-y-2">
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

          <div className="border border-beige bg-white p-5 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs text-primary-brown/70">
              <span>Menunggu Review Anda</span>
              <AlertCircle className="size-4 text-primary-brown" />
            </div>
            <p className="font-heading text-3xl font-bold text-primary-brown">
              {counts["SUBMITTED"] || 0}
            </p>
            <p className="text-[11px] text-primary-brown/60">
              SLA 3 hari sebelum auto-accept
            </p>
          </div>
        </div>

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

