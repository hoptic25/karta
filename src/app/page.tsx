import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { LandingPricing } from "@/components/layout/landing-pricing";
import { Button } from "@/components/ui/button";
import { getActivePackages } from "@/features/subscription";
import { getCachedLandingMetrics } from "@/features/platform";
import { getActiveCampuses } from "@/features/campus";
import { formatCurrency } from "@/lib/format";
import {
  Briefcase,
  GraduationCap,
  CheckCircle2,
  ShieldCheck,
  Scale,
  Award,
  ArrowRight,
  HelpCircle,
  Building2,
  TrendingUp,
  Wallet,
  CircleDot,
} from "lucide-react";

export default async function LandingPage() {
  const [packages, metrics, campuses] = await Promise.all([
    getActivePackages(),
    getCachedLandingMetrics(),
    getActiveCampuses(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-cream text-primary-brown selection:bg-peach selection:text-primary-brown">
      <PublicNavbar />

      <main className="flex-1">
        {/* ━━━ 1. HERO SECTION ━━━ */}
        <section className="relative overflow-hidden border-b border-beige">
          <div className="mx-auto max-w-5xl px-4 pt-20 pb-20 sm:pt-28 sm:pb-28 lg:pt-32 lg:pb-32 sm:px-6 lg:px-8 text-center">
            {/* Main headline - clean editorial styling */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-primary-brown leading-[1.14] max-w-4xl mx-auto">
              Marketplace Tugas Mikro untuk Pertumbuhan UMKM dan Talenta Kampus
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base sm:text-lg text-primary-brown/80 font-sans leading-relaxed">
              Hubungkan bisnis UMKM dengan mahasiswa terpilih dari kampus mitra.
              Selesaikan tugas berkualitas tanpa perang harga, bangun portofolio terverifikasi,
              dan ciptakan dampak ekonomi nyata.
            </p>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login?as=umkm" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-sm px-8 h-12 shadow-sm">
                  <Briefcase className="size-4 mr-2" />
                  Mulai sebagai UMKM
                  <ArrowRight className="size-4 ml-2" />
                </Button>
              </Link>
              <Link href="/login?as=student" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto text-sm px-8 h-12 border border-beige">
                  <GraduationCap className="size-4 mr-2" />
                  Daftar sebagai Mahasiswa
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ━━━ 2. SOCIAL PROOF STRIP ━━━ */}
        <section className="border-b border-beige bg-white/70 py-8">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              <div className="space-y-1">
                <p className="font-heading text-2xl sm:text-3xl font-bold text-primary-brown">
                  {formatCurrency(metrics.totalEarningsIdr)}
                </p>
                <p className="text-[11px] font-semibold text-primary-brown/60 uppercase tracking-wider">
                  Dana Tersalurkan
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-heading text-2xl sm:text-3xl font-bold text-primary-brown">
                  {metrics.totalUmkm}+
                </p>
                <p className="text-[11px] font-semibold text-primary-brown/60 uppercase tracking-wider">
                  UMKM Terdaftar
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-heading text-2xl sm:text-3xl font-bold text-primary-brown">
                  {metrics.completedJobs}+
                </p>
                <p className="text-[11px] font-semibold text-primary-brown/60 uppercase tracking-wider">
                  Tugas Selesai
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-heading text-2xl sm:text-3xl font-bold text-primary-brown">
                  {metrics.totalCampuses}
                </p>
                <p className="text-[11px] font-semibold text-primary-brown/60 uppercase tracking-wider">
                  Kampus Mitra
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ━━━ 3. PROBLEM & SOLUTION ━━━ */}
        <section className="py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <p className="text-xs font-bold tracking-widest uppercase text-earth-primary/70 mb-3">
                Kolaborasi Dua Sisi
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary-brown leading-tight">
                Menjembatani Kebutuhan UMKM &amp; Peluang Nyata Mahasiswa
              </h2>
              <p className="mt-4 text-sm sm:text-base text-primary-brown/75 font-sans leading-relaxed max-w-2xl mx-auto">
                Tantangan operasional pelaku usaha mikro bertemu dengan potensi besar talenta perguruan tinggi dalam ekosistem yang terstandarisasi.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* UMKM Card */}
              <div className="rounded-2xl border border-beige bg-white p-8 lg:p-10 shadow-xs">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-primary-brown text-white shadow-xs">
                    <Briefcase className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-primary-brown">
                      Bagi Pemilik UMKM
                    </h3>
                    <p className="text-xs text-primary-brown/60 font-sans">Delegasi tugas mikro tanpa repot</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-cream/70 border border-beige/60">
                    <div className="flex items-center gap-2 mb-2">
                      <CircleDot className="size-4 text-earth-terracotta" />
                      <span className="text-xs font-bold text-primary-brown uppercase tracking-wide">Tantangan</span>
                    </div>
                    <p className="text-sm text-primary-brown/80 leading-relaxed font-sans">
                      Membutuhkan bantuan desain promosi, input data, penulisan konten, atau video singkat tanpa biaya rekrutmen karyawan penuh waktu yang memberatkan.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-sage-green/10 border border-sage-green/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="size-4 text-earth-sage" />
                      <span className="text-xs font-bold text-earth-sage uppercase tracking-wide">Solusi KARTA</span>
                    </div>
                    <p className="text-sm text-primary-brown/80 leading-relaxed font-sans">
                      Berlangganan kuota pekerjaan bulanan dengan harga terjangkau mulai dari Rp 75.000. Dapatkan hasil kerja terstandarisasi dengan Acceptance Checklist yang terukur.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mahasiswa Card */}
              <div className="rounded-2xl border border-beige bg-white p-8 lg:p-10 shadow-xs">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-earth-sage text-white shadow-xs">
                    <GraduationCap className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-primary-brown">
                      Bagi Mahasiswa Kampus
                    </h3>
                    <p className="text-xs text-primary-brown/60 font-sans">Bangun portofolio nyata sambil kuliah</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-cream/70 border border-beige/60">
                    <div className="flex items-center gap-2 mb-2">
                      <CircleDot className="size-4 text-earth-terracotta" />
                      <span className="text-xs font-bold text-primary-brown uppercase tracking-wide">Tantangan</span>
                    </div>
                    <p className="text-sm text-primary-brown/80 leading-relaxed font-sans">
                      Sulit menembus marketplace freelancer terbuka karena perang banting harga, persaingan global yang tidak imbang, dan tidak adanya rekam jejak awal.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-sage-green/10 border border-sage-green/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="size-4 text-earth-sage" />
                      <span className="text-xs font-bold text-earth-sage uppercase tracking-wide">Solusi KARTA</span>
                    </div>
                    <p className="text-sm text-primary-brown/80 leading-relaxed font-sans">
                      Akses eksklusif berbasis kode referral kampus mitra. Nikmati sistem first-come-first-served, penghasilan tetap terproteksi, serta portofolio publik terverifikasi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ━━━ 4. CARA KERJA (HOW IT WORKS) ━━━ */}
        <section id="cara-kerja" className="py-20 lg:py-24 bg-white border-y border-beige">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <p className="text-xs font-bold tracking-widest uppercase text-earth-primary/70 mb-3">
                Alur Kerja
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary-brown leading-tight">
                Tiga Langkah Transparan dan Terarah
              </h2>
              <p className="mt-4 text-sm sm:text-base text-primary-brown/75 font-sans leading-relaxed max-w-2xl mx-auto">
                Proses terstruktur untuk memastikan kolaborasi bisnis berjalan lancar dan adil bagi semua pihak.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
              {/* UMKM Flow */}
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 rounded-lg bg-primary-brown text-white">
                    <Briefcase className="size-5" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-primary-brown">
                    Alur Kolaborasi UMKM
                  </h3>
                </div>

                <div className="relative space-y-0">
                  <div className="absolute left-[19px] top-10 bottom-10 w-px bg-beige" />

                  {[
                    {
                      step: "1",
                      title: "Pilih Paket Kuota Bulanan",
                      desc: "Pilih paket langganan sesuai volume pekerjaan bisnis Anda. Mitra kampus mendapatkan tarif khusus bersubsidi.",
                    },
                    {
                      step: "2",
                      title: "Terbitkan Brief & Acceptance Checklist",
                      desc: "Jelaskan tugas mikro dan tentukan 1-7 kriteria penerimaan spesifik. Tanpa proses tawar-menawar yang memakan waktu.",
                    },
                    {
                      step: "3",
                      title: "Tinjau Hasil & Berikan Penilaian",
                      desc: "Periksa tautan hasil kerja berdasarkan checklist. Terima hasil, minta revisi (maks 2x), atau konfirmasi penyelesaian.",
                    },
                  ].map((item) => (
                    <div key={item.step} className="relative flex gap-5 pb-8 last:pb-0">
                      <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-brown text-white text-sm font-bold shadow-xs">
                        {item.step}
                      </span>
                      <div className="pt-1.5">
                        <h4 className="font-sans text-sm font-bold text-primary-brown mb-1.5">
                          {item.title}
                        </h4>
                        <p className="text-sm text-primary-brown/75 leading-relaxed font-sans">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mahasiswa Flow */}
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 rounded-lg bg-earth-sage text-white">
                    <GraduationCap className="size-5" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-primary-brown">
                    Alur Mahasiswa Kampus
                  </h3>
                </div>

                <div className="relative space-y-0">
                  <div className="absolute left-[19px] top-10 bottom-10 w-px bg-sage-green/20" />

                  {[
                    {
                      step: "1",
                      title: "Masuk dengan Kode Referral Kampus",
                      desc: "Verifikasi keaktifan Anda sebagai mahasiswa dari kampus mitra untuk membuka akses penuh ke bursa pekerjaan.",
                    },
                    {
                      step: "2",
                      title: "Klaim Pekerjaan Terbuka",
                      desc: "Sistem first-come-first-served yang adil sesuai tingkat keahlian dan minat peran Anda, tanpa perlu adu proposal.",
                    },
                    {
                      step: "3",
                      title: "Kumpulkan Tugas & Dapatkan Imbalan",
                      desc: "Kirimkan tautan pengerjaan tepat waktu, terima imbalan terproteksi ke saldo dompet, dan tingkatkan reputasi KARTA Score.",
                    },
                  ].map((item) => (
                    <div key={item.step} className="relative flex gap-5 pb-8 last:pb-0">
                      <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full bg-earth-sage text-white text-sm font-bold shadow-xs">
                        {item.step}
                      </span>
                      <div className="pt-1.5">
                        <h4 className="font-sans text-sm font-bold text-primary-brown mb-1.5">
                          {item.title}
                        </h4>
                        <p className="text-sm text-primary-brown/75 leading-relaxed font-sans">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ━━━ 5. PAKET & HARGA (PRICING) ━━━ */}
        <LandingPricing packages={packages} />

        {/* ━━━ 6. PEMBEDA KARTA (DIFFERENTIATORS D1–D6) ━━━ */}
        <section id="pembeda" className="py-20 lg:py-24 bg-white border-y border-beige">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <p className="text-xs font-bold tracking-widest uppercase text-earth-primary/70 mb-3">
                Keunggulan Platform
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary-brown leading-tight">
                6 Nilai Pembeda KARTA
              </h2>
              <p className="mt-4 text-sm sm:text-base text-primary-brown/75 font-sans leading-relaxed max-w-2xl mx-auto">
                Dirancang khusus untuk mematahkan kelemahan platform freelance terbuka.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Building2,
                  title: "Jaringan Tertutup Kampus",
                  desc: "Hanya mahasiswa aktif dengan kode referral resmi dari universitas mitra yang dapat bergabung. Menjamin keaslian identitas dan komitmen akademik.",
                  accent: "bg-primary-brown",
                },
                {
                  icon: Scale,
                  title: "Harga Tetap Tanpa Bidding",
                  desc: "Tidak ada perang harga antar mahasiswa maupun spekulasi tarif dari UMKM. Nilai imbalan sudah ditetapkan pasti sesuai tier paket langganan.",
                  accent: "bg-earth-sage",
                },
                {
                  icon: CheckCircle2,
                  title: "Acceptance Checklist",
                  desc: "Setiap pekerjaan dilengkapi 1-7 kriteria terukur yang disepakati di awal. Evaluasi dan penolakan harus merujuk pada checklist, bukan selera subjektif.",
                  accent: "bg-earth-terracotta",
                },
                {
                  icon: Award,
                  title: "KARTA Score & Portofolio",
                  desc: "Halaman publik profil mahasiswa memuat rekam jejak pekerjaan nyata yang telah diterima UMKM, poin keahlian, dan tingkat reputasi resmi.",
                  accent: "bg-earth-sage",
                },
                {
                  icon: ShieldCheck,
                  title: "Perlindungan Kerja Adil",
                  desc: "Batas revisi maksimal 2 kali, SLA review 3 hari dengan auto-accept, dan jendela pengajuan sengketa yang diputuskan adil oleh operator platform.",
                  accent: "bg-primary-brown",
                },
                {
                  icon: TrendingUp,
                  title: "Impact Dashboard",
                  desc: "Metrik terukur kontribusi terhadap pencapaian SDG 8 (Pekerjaan Layak & Pertumbuhan Ekonomi) dan SDG 10 (Pengurangan Ketimpangan Akses Talenta).",
                  accent: "bg-earth-terracotta",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-beige bg-cream/30 p-7 transition-all duration-200 hover:bg-white hover:shadow-md hover:border-primary-brown/25"
                >
                  <div className={`inline-flex p-3 rounded-xl ${feature.accent} text-white mb-5 shadow-xs`}>
                    <feature.icon className="size-5" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-primary-brown mb-2.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-primary-brown/75 leading-relaxed font-sans">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━ 7. DAMPAK NYATA (IMPACT COUNTERS) ━━━ */}
        <section id="dampak" className="py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <p className="text-xs font-bold tracking-widest uppercase text-earth-primary/70 mb-3">
                Dampak Terukur
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary-brown leading-tight">
                Dampak Nyata yang Terus Bertumbuh
              </h2>
              <p className="mt-4 text-sm sm:text-base text-primary-brown/75 font-sans leading-relaxed max-w-2xl mx-auto">
                Pencapaian nyata kolaborasi antara pelaku UMKM dan sivitas akademika kampus.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  value: formatCurrency(metrics.totalEarningsIdr),
                  label: "Dana Tersalurkan ke Mahasiswa",
                  icon: Wallet,
                },
                {
                  value: `${metrics.totalUmkm}`,
                  label: "UMKM Terdaftar & Terbantu",
                  icon: Briefcase,
                },
                {
                  value: `${metrics.completedJobs}`,
                  label: "Tugas Mikro Sukses Diselesaikan",
                  icon: CheckCircle2,
                },
                {
                  value: `${metrics.totalCampuses}`,
                  label: "Kampus Mitra Aktif",
                  icon: GraduationCap,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-6 lg:p-8 rounded-2xl border border-beige bg-white text-center shadow-xs"
                >
                  <div className="inline-flex p-2.5 rounded-lg bg-cream border border-beige mb-4">
                    <stat.icon className="size-5 text-earth-sage" />
                  </div>
                  <p className="font-heading text-2xl sm:text-3xl font-bold text-primary-brown">
                    {stat.value}
                  </p>
                  <p className="text-[11px] sm:text-xs font-semibold text-primary-brown/65 mt-2 leading-snug">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━ 8. KAMPUS MITRA (CAMPUS PARTNERS) ━━━ */}
        <section id="kampus" className="py-20 lg:py-24 bg-white border-y border-beige">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <p className="text-xs font-bold tracking-widest uppercase text-earth-primary/70 mb-3">
                Jaringan Kampus
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary-brown leading-tight">
                Didukung oleh Perguruan Tinggi Terkemuka
              </h2>
              <p className="mt-4 text-sm text-primary-brown/75 font-sans leading-relaxed max-w-2xl mx-auto">
                Terhubung dengan himpunan mahasiswa dan inkubator bisnis kampus terakreditasi.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {campuses.map((campus) => (
                <div
                  key={campus.id}
                  className="flex items-center gap-4 p-5 rounded-xl border border-beige bg-cream/30 transition-all hover:bg-white hover:shadow-sm hover:border-primary-brown/20"
                >
                  <div className="p-3 rounded-xl bg-earth-sage/10 text-earth-sage">
                    <GraduationCap className="size-6" />
                  </div>
                  <div>
                    <h4 className="font-heading text-base font-bold text-primary-brown">
                      {campus.name}
                    </h4>
                    <p className="text-xs text-primary-brown/65 font-sans mt-0.5">
                      {campus.city}, {campus.province}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━ 9. FAQ SECTION ━━━ */}
        <section id="faq" className="py-20 lg:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-xs font-bold tracking-widest uppercase text-earth-primary/70 mb-3">
                Informasi
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary-brown leading-tight">
                Pertanyaan yang Sering Diajukan
              </h2>
              <p className="mt-4 text-sm text-primary-brown/75 font-sans leading-relaxed">
                Informasi penting mengenai operasional dan aturan main di KARTA.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "Apa itu kode referral kampus dan bagaimana mendapatkannya?",
                  a: "Kode referral kampus adalah kode unik verifikasi yang diterbitkan oleh perguruan tinggi mitra resmi. Mahasiswa dapat memperoleh kode ini melalui koordinator kemahasiswaan, ketua program studi, BEM, atau inkubator bisnis kampus yang telah bekerja sama dengan KARTA.",
                },
                {
                  q: "Bagaimana mekanisme pembayaran paket dan penarikan imbalan?",
                  a: "UMKM melakukan pembayaran langganan melalui transfer rekening yang diverifikasi oleh tim admin KARTA. Untuk mahasiswa, imbalan dari pekerjaan yang diterima (Accepted) otomatis masuk ke saldo Payable, dan penarikan dapat diajukan dengan batas minimal Rp 50.000 langsung ke rekening bank mahasiswa.",
                },
                {
                  q: "Apa yang dimaksud dengan Volunteer Project / Paket Gratis?",
                  a: "Setiap UMKM berhak mempublikasikan hingga 3 pekerjaan mikro tanpa biaya setiap bulan berlabel Volunteer Project. Pekerjaan ini tidak memberikan imbalan uang tunai kepada mahasiswa, namun memberikan poin reputasi penuh (+10 poin) dan portofolio terverifikasi untuk membantu mahasiswa pemula membangun rekam jejak.",
                },
                {
                  q: "Bagaimana jika hasil pekerjaan tidak sesuai atau UMKM tidak merespons?",
                  a: "KARTA memberlakukan SLA review 3 hari: jika UMKM tidak memberikan evaluasi dalam 3 hari kalender setelah pengumpulan tugas, sistem secara otomatis menerima hasil (Auto-accept) dan mencairkan imbalan mahasiswa. Jika terjadi penolakan yang tidak objektif, mahasiswa memiliki jendela 3 hari untuk membuka sengketa yang ditinjau langsung oleh admin.",
                },
              ].map((faq) => (
                <div
                  key={faq.q}
                  className="p-6 rounded-xl border border-beige bg-white shadow-xs"
                >
                  <h3 className="font-sans text-sm font-bold text-primary-brown mb-3 flex items-start gap-3">
                    <HelpCircle className="size-5 text-earth-sage shrink-0 mt-px" />
                    {faq.q}
                  </h3>
                  <p className="text-sm text-primary-brown/75 leading-relaxed font-sans pl-8">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━ 10. BOTTOM CTA ━━━ */}
        <section className="py-20 lg:py-24 bg-primary-brown text-white">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Siap Mengembangkan Usaha atau Memulai Portofolio?
            </h2>
            <p className="mt-5 text-base text-white/80 font-sans max-w-xl mx-auto leading-relaxed">
              Bergabunglah hari ini bersama pelaku usaha mikro dan mahasiswa unggul di seluruh Indonesia.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login?as=student">
                <Button
                  size="lg"
                  className="bg-white text-primary-brown hover:bg-cream shadow-md text-sm px-8 h-12 font-semibold"
                >
                  <GraduationCap className="size-4 mr-2" />
                  Daftar sebagai Mahasiswa
                  <ArrowRight className="size-4 ml-2" />
                </Button>
              </Link>
              <Link href="/login?as=umkm">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 text-sm px-8 h-12 font-semibold"
                >
                  <Briefcase className="size-4 mr-2" />
                  Mulai sebagai UMKM
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
