import {
  TrendingUp,
  Building2,
  GraduationCap,
  Globe,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DetailedImpactMetrics } from "../impact";

interface AdminImpactViewProps {
  metrics: DetailedImpactMetrics;
}

export function AdminImpactView({ metrics }: AdminImpactViewProps) {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge className="bg-earth-primary text-white text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold">
            SDG 8 &bull; SDG 4 &bull; SDG 10
          </Badge>
          <span className="text-xs text-primary-brown/60">
            Pembaruan Real-Time
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold text-primary-brown mt-2">
          Impact Dashboard KARTA
        </h1>
        <p className="text-sm text-primary-brown/70 mt-1 max-w-3xl leading-relaxed">
          Pemantauan kontribusi KARTA terhadap penciptaan lapangan kerja layak bagi mahasiswa,
          pemberdayaan digitalisasi UMKM lokal, dan pemerataan ekonomi berbasis kemitraan kampus di seluruh Indonesia.
        </p>
      </div>

      {/* SDG 8: Decent Work & Economic Growth */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-beige pb-2">
          <TrendingUp className="w-5 h-5 text-earth-primary" />
          <h2 className="font-heading text-lg font-bold text-primary-brown">
            SDG 8 — Pekerjaan Layak & Pertumbuhan Ekonomi
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-beige bg-white shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-primary-brown/60">
                Total Imbalan Tersalurkan
              </CardDescription>
              <CardTitle className="font-heading text-2xl font-bold text-earth-primary">
                {formatCurrency(metrics.totalRewardsIdr)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-primary-brown/70">
                Dana langsung masuk ke rekening mahasiswa dari tugas selesai
              </p>
            </CardContent>
          </Card>

          <Card className="border-beige bg-white shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-primary-brown/60">
                Tugas Mikro Selesai
              </CardDescription>
              <CardTitle className="font-heading text-2xl font-bold text-primary-brown">
                {metrics.completedJobsCount.toLocaleString("id-ID")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-primary-brown/70">
                Pekerjaan berstatus ACCEPTED dengan verifikasi kriteria tuntas
              </p>
            </CardContent>
          </Card>

          <Card className="border-beige bg-white shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-primary-brown/60">
                UMKM Terlayani
              </CardDescription>
              <CardTitle className="font-heading text-2xl font-bold text-primary-brown">
                {metrics.servedUmkmCount.toLocaleString("id-ID")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-primary-brown/70">
                Mitra bisnis dengan setidaknya 1 tugas mikro berhasil
              </p>
            </CardContent>
          </Card>

          <Card className="border-beige bg-white shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-primary-brown/60">
                Median Waktu ke Job Pertama
              </CardDescription>
              <CardTitle className="font-heading text-2xl font-bold text-earth-sage">
                {metrics.medianTimeToFirstJobHours} Jam
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-primary-brown/70">
                Sejak registrasi mahasiswa hingga tugas perdana diterima
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SDG 4: Quality Education & Career Readiness */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-beige pb-2">
          <GraduationCap className="w-5 h-5 text-earth-primary" />
          <h2 className="font-heading text-lg font-bold text-primary-brown">
            SDG 4 — Pendidikan Berkualitas & Kesiapan Kerja
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-beige bg-white shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-primary-brown/60">
                Mahasiswa Aktif Berpenghasilan
              </CardDescription>
              <CardTitle className="font-heading text-2xl font-bold text-primary-brown">
                {metrics.activeStudentsCount.toLocaleString("id-ID")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-primary-brown/70">
                Mahasiswa yang telah menuntaskan &ge;1 penugasan nyata
              </p>
            </CardContent>
          </Card>

          <Card className="border-beige bg-white shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-primary-brown/60">
                Tingkat Keberhasilan Job Pertama
              </CardDescription>
              <CardTitle className="font-heading text-2xl font-bold text-earth-primary">
                {metrics.firstJobRatePercent}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-primary-brown/70">
                Rasio mahasiswa terdaftar yang berhasil klaim & selesaikan job
              </p>
            </CardContent>
          </Card>

          <Card className="border-beige bg-white shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-primary-brown/60">
                Kampus Mitra Terdaftar
              </CardDescription>
              <CardTitle className="font-heading text-2xl font-bold text-primary-brown">
                {metrics.activeCampusesCount.toLocaleString("id-ID")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-primary-brown/70">
                Perguruan tinggi aktif dengan kode referral terverifikasi
              </p>
            </CardContent>
          </Card>

          <Card className="border-beige bg-white shadow-xs">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-primary-brown/60">
                Volunteer Projects Selesai
              </CardDescription>
              <CardTitle className="font-heading text-2xl font-bold text-earth-sage">
                {metrics.volunteerProjectsCount.toLocaleString("id-ID")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-primary-brown/70">
                Proyek sosial kemitraan tanpa biaya untuk membangun portofolio
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SDG 10: Reduced Inequalities & Regional Distribution */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-beige pb-2">
          <Globe className="w-5 h-5 text-earth-primary" />
          <h2 className="font-heading text-lg font-bold text-primary-brown">
            SDG 10 — Pengurangan Kesenjangan & Sebaran Geografis
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sebaran Mahasiswa per Provinsi */}
          <Card className="border-beige bg-white shadow-xs">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-heading text-base font-bold text-primary-brown">
                    Sebaran Mahasiswa per Wilayah Kampus
                  </CardTitle>
                  <CardDescription className="text-xs text-primary-brown/70 mt-1">
                    Berdasarkan lokasi perguruan tinggi mitra tempat mahasiswa terdaftar
                  </CardDescription>
                </div>
                <GraduationCap className="w-5 h-5 text-earth-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {metrics.studentProvinceDistribution.length === 0 ? (
                <p className="text-xs text-primary-brown/50 py-4 text-center">
                  Belum ada data persebaran wilayah mahasiswa.
                </p>
              ) : (
                <div className="space-y-3">
                  {metrics.studentProvinceDistribution.slice(0, 8).map((item) => {
                    const maxCount = metrics.studentProvinceDistribution[0]?.count || 1;
                    const percent = Math.round((item.count / maxCount) * 100);

                    return (
                      <div key={item.province} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-primary-brown">
                            {item.province}
                          </span>
                          <span className="font-medium text-primary-brown/70">
                            {item.count} Mahasiswa
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-cream overflow-hidden">
                          <div
                            className="h-full rounded-full bg-earth-primary transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sebaran UMKM per Provinsi */}
          <Card className="border-beige bg-white shadow-xs">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-heading text-base font-bold text-primary-brown">
                    Sebaran UMKM per Provinsi
                  </CardTitle>
                  <CardDescription className="text-xs text-primary-brown/70 mt-1">
                    Berdasarkan domisili usaha mikro yang mempublikasikan tugas
                  </CardDescription>
                </div>
                <Building2 className="w-5 h-5 text-earth-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {metrics.umkmProvinceDistribution.length === 0 ? (
                <p className="text-xs text-primary-brown/50 py-4 text-center">
                  Belum ada data persebaran wilayah UMKM.
                </p>
              ) : (
                <div className="space-y-3">
                  {metrics.umkmProvinceDistribution.slice(0, 8).map((item) => {
                    const maxCount = metrics.umkmProvinceDistribution[0]?.count || 1;
                    const percent = Math.round((item.count / maxCount) * 100);

                    return (
                      <div key={item.province} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-primary-brown">
                            {item.province}
                          </span>
                          <span className="font-medium text-primary-brown/70">
                            {item.count} UMKM
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-cream overflow-hidden">
                          <div
                            className="h-full rounded-full bg-earth-sage transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

