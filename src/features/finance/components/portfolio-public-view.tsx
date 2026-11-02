import Link from "next/link";
import {
  GraduationCap,
  Award,
  Star,
  CheckCircle2,
  Calendar,
  Building2,
  ShieldCheck,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { formatDateOnly } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { getPublicStudentPortfolio } from "../queries";

interface PortfolioPublicViewProps {
  data: NonNullable<Awaited<ReturnType<typeof getPublicStudentPortfolio>>>;
}

export function PortfolioPublicView({ data }: PortfolioPublicViewProps) {
  // Jika portofolio disembunyikan oleh mahasiswa (portfolioPublic: false)
  if (data.isHidden) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-beige bg-white text-center p-8 shadow-xs">
          <div className="h-16 w-16 bg-cream rounded-full flex items-center justify-center mx-auto text-primary-brown/60 mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="font-heading text-xl font-bold text-primary-brown">
            Portofolio Privat
          </h2>
          <p className="text-xs text-primary-brown/70 mt-2 leading-relaxed">
            Mahasiswa pemilik profil @{data.student.username} memilih untuk tidak menampilkan portofolio tugasnya kepada publik.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className={buttonVariants({
                variant: "outline",
                className: "text-xs",
              })}
            >
              Kembali ke Beranda
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const { student, completedJobs } = data;

  const levelColorMap: Record<string, { bg: string; text: string; label: string }> = {
    NEWCOMER: { bg: "bg-amber-100", text: "text-amber-800", label: "Newcomer" },
    RELIABLE: { bg: "bg-slate-100", text: "text-slate-800", label: "Reliable" },
    TRUSTED: { bg: "bg-amber-500/20", text: "text-amber-900", label: "Trusted" },
    EXPERT: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Expert" },
  };

  const levelStyle = levelColorMap[student.level] || levelColorMap.NEWCOMER;

  return (
    <div className="min-h-screen bg-cream text-primary-brown py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Breadcrumb / Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-heading text-xl font-bold text-primary-brown">
              KARTA
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-earth-sage text-white px-1.5 py-0.5 rounded">
              Portofolio Mahasiswa
            </span>
          </Link>
          <Link
            href="/register?as=umkm"
            className={buttonVariants({
              variant: "outline",
              className: "text-xs border-primary-brown/30",
            })}
          >
            Buka Lowongan UMKM
          </Link>
        </div>

        {/* PROFILE HEADER CARD */}
        <Card className="border-beige bg-white shadow-xs overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-earth-primary/20 via-earth-sand/30 to-earth-sage/20 border-b border-beige" />
          <CardContent className="pt-0 pb-6 px-6 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 mb-6">
              <div className="flex items-end gap-4">
                <div className="h-24 w-24 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-3xl font-heading font-bold text-earth-primary overflow-hidden shrink-0">
                  {student.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={student.avatarUrl}
                      alt={student.name || "Mahasiswa"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{student.name?.charAt(0) || "M"}</span>
                  )}
                </div>
                <div>
                  <h1 className="font-heading text-2xl font-bold text-primary-brown">
                    {student.name}
                  </h1>
                  <p className="text-xs text-primary-brown/70 font-mono">
                    @{student.username}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={`${levelStyle.bg} ${levelStyle.text} border-transparent font-bold text-xs uppercase px-2.5 py-1`}
                >
                  <Award className="w-3.5 h-3.5 mr-1" />
                  Level: {levelStyle.label}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-800 border-amber-300 font-bold text-xs px-2.5 py-1"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mr-1" />
                  {student.ratingAvg.toFixed(1)} ({student.ratingCount} Ulasan)
                </Badge>
              </div>
            </div>

            {/* Campus & Bio info */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-primary-brown/80">
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-earth-primary" />
                  <span>
                    <strong>{student.campus?.name}</strong> &bull; {student.studyProgram}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary-brown/60" />
                  <span>Bergabung sejak {formatDateOnly(student.joinedAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{student.completedJobsCount} Pekerjaan Selesai</span>
                </div>
              </div>

              {student.bio && (
                <p className="text-xs text-primary-brown/80 leading-relaxed border-t border-beige/60 pt-3">
                  {student.bio}
                </p>
              )}

              {/* Roles & Skills tags */}
              <div className="space-y-2 border-t border-beige/60 pt-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-primary-brown/60">
                  Peran & Keahlian Terverifikasi
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {student.roles.map((role) => (
                    <Badge
                      key={role}
                      variant="outline"
                      className="bg-cream text-earth-primary border-earth-primary/30 text-[11px]"
                    >
                      {role.replace(/_/g, " ")}
                    </Badge>
                  ))}
                  {student.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="outline"
                      className="bg-white text-primary-brown/70 border-beige text-[11px]"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* COMPLETED JOBS / SHOWCASE SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold text-primary-brown flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-earth-primary" />
                Portofolio Tugas Mikro yang Diselesaikan
              </h2>
              <p className="text-xs text-primary-brown/70 mt-0.5">
                Pekerjaan riil yang telah diverifikasi dan diterima langsung oleh UMKM mitra.
              </p>
            </div>
            <span className="text-xs font-semibold text-primary-brown/60">
              {completedJobs.length} Proyek
            </span>
          </div>

          {completedJobs.length === 0 ? (
            <Card className="border-beige bg-white p-8 text-center text-primary-brown/60 text-xs shadow-xs">
              Mahasiswa ini belum menyelesaikan tugas mikro yang dipublikasikan.
            </Card>
          ) : (
            <div className="space-y-4">
              {completedJobs.map(({ job, endedAt, assignmentId }) => (
                <Card
                  key={assignmentId}
                  className="border-beige bg-white shadow-xs hover:border-earth-primary/40 transition-colors"
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="bg-cream text-earth-primary border-earth-primary/30 text-[10px] uppercase font-bold"
                          >
                            {job.role.replace(/_/g, " ")}
                          </Badge>
                          {!job.isPaid && (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-300 text-[10px]"
                            >
                              Relawan / Volunteer
                            </Badge>
                          )}
                          <span className="text-[11px] text-primary-brown/50">
                            Diselesaikan {formatDateOnly(endedAt)}
                          </span>
                        </div>
                        <h3 className="font-heading text-lg font-bold text-primary-brown">
                          {job.title}
                        </h3>
                      </div>

                      {job.rating && (
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl shrink-0 self-start">
                          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                          <span className="font-bold text-xs text-amber-900">
                            {job.rating.score}.0 / 5.0
                          </span>
                        </div>
                      )}
                    </div>

                    {/* UMKM Client Info */}
                    <div className="flex items-center gap-2 text-xs text-primary-brown/70 bg-cream/40 p-2.5 rounded-lg border border-beige/60">
                      <Building2 className="w-4 h-4 text-primary-brown/60 shrink-0" />
                      <span>
                        Pemberi Tugas: <strong>{job.umkm.businessName}</strong>
                      </span>
                      {job.umkm.isCampusPartner && (
                        <span className="flex items-center gap-1 text-[11px] text-earth-primary font-semibold ml-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-earth-primary" />
                          Mitra Kampus
                        </span>
                      )}
                    </div>

                    {/* UMKM Testimonial / Review */}
                    {job.rating?.comment && (
                      <div className="text-xs bg-white p-3.5 rounded-xl border border-beige text-primary-brown/85 italic leading-relaxed">
                        &quot;{job.rating.comment}&quot;
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER CTA */}
        <div className="rounded-2xl bg-earth-primary text-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="font-heading text-xl font-bold">
              Butuh Talenta Mahasiswa seperti @{student.username}?
            </h3>
            <p className="text-xs text-white/80 max-w-lg leading-relaxed">
              KARTA menghubungkan UMKM Anda dengan mahasiswa berbakat untuk tugas mikro desain grafis, digital marketing, penulisan konten, dan pembukuan.
            </p>
          </div>
          <Link
            href="/register?as=umkm"
            className={buttonVariants({
              className: "bg-white text-earth-primary hover:bg-cream text-xs font-bold px-6 py-2.5 shrink-0 uppercase tracking-wider",
            })}
          >
            Mulai Pasang Lowongan
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

