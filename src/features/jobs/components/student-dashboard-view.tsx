import Link from "next/link";
import {
  Briefcase,
  Wallet,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  Award,
  ChevronRight,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StudentDashboardSummary } from "../queries";

interface StudentDashboardViewProps {
  summary: StudentDashboardSummary;
}

export function StudentDashboardView({ summary }: StudentDashboardViewProps) {
  const { student, activeAssignments, nearestDeadlineAssignment, payableBalanceIdr, recommendedJobs } = summary;

  return (
    <div className="space-y-8">
      {/* Header Sambutan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-beige pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary-brown">
              Halo, {student.name?.split(" ")[0] || student.username}! 👋
            </h1>
            <Badge className="bg-earth-primary text-white text-[10px] uppercase font-bold tracking-wider">
              {student.level}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-primary-brown/70 font-sans">
            {student.studyProgram} • {student.campusName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/student/jobs">
            <Button size="sm">
              <Sparkles className="size-4 mr-1.5" />
              Eksplorasi Tugas Mikro
            </Button>
          </Link>
        </div>
      </div>

      {/* Kartu Ringkasan Utama (4 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Saldo Siap Tarik */}
        <div className="border border-beige bg-white p-5 rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-primary-brown/70">
            <span>Saldo Siap Tarik</span>
            <Wallet className="size-4 text-earth-primary" />
          </div>
          <p className="font-heading text-2xl sm:text-3xl font-bold text-primary-brown">
            {formatCurrency(payableBalanceIdr)}
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-primary-brown/60">Min. penarikan Rp 50.000</span>
            <Link
              href="/student/earnings"
              className="text-[11px] font-semibold text-earth-primary hover:underline flex items-center"
            >
              Tarik Saldo <ChevronRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* 2. Tugas Sedang Aktif */}
        <div className="border border-beige bg-white p-5 rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-primary-brown/70">
            <span>Tugas Aktif</span>
            <Briefcase className="size-4 text-primary-brown" />
          </div>
          <p className="font-heading text-2xl sm:text-3xl font-bold text-primary-brown">
            {activeAssignments.length}
          </p>
          <p className="text-[11px] text-primary-brown/60">
            {activeAssignments.length === 0
              ? "Tidak ada tugas aktif"
              : `${activeAssignments.length} sedang dalam proses`}
          </p>
        </div>

        {/* 3. Reputasi & Level */}
        <div className="border border-beige bg-white p-5 rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-primary-brown/70">
            <span>Poin Reputasi</span>
            <Award className="size-4 text-amber-600" />
          </div>
          <p className="font-heading text-2xl sm:text-3xl font-bold text-amber-700">
            {student.points} <span className="text-xs font-sans font-normal text-primary-brown/60">poin</span>
          </p>
          {student.nextLevel.targetPoints ? (
            <div className="space-y-1">
              <div className="w-full bg-beige/60 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${student.nextLevel.progressPct}%` }}
                />
              </div>
              <p className="text-[10px] text-primary-brown/60">
                {student.nextLevel.pointsRemaining} poin lagi ke level {student.nextLevel.name}
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-amber-800 font-semibold">Tingkat Tertinggi (Expert)</p>
          )}
        </div>

        {/* 4. Rekam Jejak */}
        <div className="border border-beige bg-white p-5 rounded-xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-primary-brown/70">
            <span>Tugas Selesai</span>
            <CheckCircle2 className="size-4 text-earth-sage" />
          </div>
          <p className="font-heading text-2xl sm:text-3xl font-bold text-primary-brown">
            {student.completedJobs}
          </p>
          <p className="text-[11px] text-primary-brown/60">
            Rating: ★ {student.ratingAvg > 0 ? student.ratingAvg.toFixed(1) : "-"}
          </p>
        </div>
      </div>

      {/* Bagian Tengah: Deadline Terdekat / Tugas Berjalan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri (2 Span): Tugas Aktif & Deadline Terdekat */}
        <div className="lg:col-span-2 space-y-6">
          {nearestDeadlineAssignment && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold">
                    <Clock className="size-4 text-amber-700" />
                    <span>Tenggat Waktu Terdekat</span>
                  </div>
                  <Badge variant="outline" className="text-amber-800 border-amber-300 bg-amber-100/60 text-[10px]">
                    Status: {nearestDeadlineAssignment.status}
                  </Badge>
                </div>
                <CardTitle className="text-base text-primary-brown mt-1">
                  {nearestDeadlineAssignment.title}
                </CardTitle>
                <CardDescription className="text-xs">
                  {nearestDeadlineAssignment.businessName} • Tenggat:{" "}
                  <strong>{formatDateTime(nearestDeadlineAssignment.deadlineAt)}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-earth-primary">
                    {nearestDeadlineAssignment.isPaid
                      ? formatCurrency(nearestDeadlineAssignment.studentShareIdr)
                      : "Volunteer Project"}
                  </span>
                  <Link href={`/student/my-jobs/${nearestDeadlineAssignment.jobId}`}>
                    <Button size="sm">
                      Buka Workspace
                      <ArrowRight className="size-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daftar Tugas Aktif */}
          <Card className="border-beige bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-primary-brown">Pekerjaan Saya yang Berjalan</CardTitle>
                  <CardDescription className="text-xs">
                    Pantau progres dan kelola pengerjaan sebelum batas waktu berakhir
                  </CardDescription>
                </div>
                <Link href="/student/my-jobs">
                  <Button variant="ghost" size="sm" className="text-xs text-earth-primary">
                    Lihat Semua
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {activeAssignments.length === 0 ? (
                <div className="text-center py-8 text-primary-brown/60 space-y-3">
                  <Briefcase className="size-8 mx-auto text-primary-brown/30" />
                  <p className="text-xs">Belum ada tugas mikro yang sedang dikerjakan.</p>
                  <Link href="/student/jobs">
                    <Button variant="outline" size="sm">
                      Cari Lowongan Tersedia
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-beige/50">
                  {activeAssignments.map((a) => (
                    <div key={a.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <Link
                          href={`/student/my-jobs/${a.jobId}`}
                          className="font-semibold text-xs text-primary-brown hover:text-earth-primary line-clamp-1"
                        >
                          {a.title}
                        </Link>
                        <p className="text-[11px] text-primary-brown/70">
                          {a.businessName} • Deadline: {formatDateTime(a.deadlineAt)}
                        </p>
                      </div>
                      <Link href={`/student/my-jobs/${a.jobId}`}>
                        <Button variant="outline" size="sm" className="text-xs shrink-0">
                          Workspace
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan (1 Span): Rekomendasi 3 Lowongan */}
        <div className="space-y-6">
          <Card className="border-beige bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-primary-brown flex items-center gap-1.5">
                  <Sparkles className="size-4 text-earth-primary" />
                  Rekomendasi Tugas
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Sesuai minat keahlian di profil Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendedJobs.length === 0 ? (
                <div className="text-center py-6 text-primary-brown/60 text-xs">
                  Tidak ada rekomendasi tugas baru saat ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="border border-beige/60 p-3 rounded-lg hover:border-earth-primary/50 transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-primary-brown line-clamp-1">
                          {job.title}
                        </h4>
                        {job.beginnerFriendly && (
                          <Badge className="bg-blue-50 text-blue-800 border-blue-200 text-[9px] shrink-0">
                            Ramah Pemula
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-primary-brown/70">
                        <span>{job.businessName}</span>
                        <span className="font-semibold text-earth-primary">
                          {job.isPaid ? formatCurrency(job.studentShareIdr) : "Volunteer"}
                        </span>
                      </div>
                      <div className="pt-1 flex justify-end">
                        <Link href={`/student/jobs/${job.id}`}>
                          <Button size="sm" variant="outline" className="text-[11px] h-7 px-2">
                            Lihat Detail <ChevronRight className="size-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

