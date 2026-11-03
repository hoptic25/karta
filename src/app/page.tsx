import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
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
} from "lucide-react";

export default async function LandingPage() {
  const [packages, metrics, campuses] = await Promise.all([
    getActivePackages(),
    getCachedLandingMetrics(),
    getActiveCampuses(),
  ]);

  const partnerPackages = packages.filter((p) => p.segment === "PARTNER");
  const freePackage = packages.find((p) => p.segment === "FREE");

  return (
    <div className="flex min-h-screen flex-col bg-cream text-primary-brown selection:bg-peach selection:text-primary-brown">
      <PublicNavbar />

      <main className="flex-1">
        {/* 1. HERO SECTION */}
        <section className="relative border-b border-beige py-24 sm:py-32 lg:py-36">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-primary-brown leading-[1.15]">
              Campus-Based Micro Job Marketplace untuk Pertumbuhan UMKM dan Talenta Kampus
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-primary-brown/80 font-sans leading-relaxed">
              Hubungkan bisnis UMKM dengan mahasiswa terpilih dari kampus mitra. Selesaikan tugas mikro berkualitas tanpa perang harga, bangun portofolio terverifikasi, dan ciptakan dampak ekonomi nyata.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login?as=student" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">
                  Saya Mahasiswa
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              </Link>
              <Link href="/login?as=umkm" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Saya UMKM
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 2. PROBLEM & SOLUTION SECTION */}
        <section className="border-b border-beige py-20 bg-white/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-heading text-3xl font-semibold text-primary-brown">
                Menjembatani Kebutuhan UMKM & Peluang Nyata Mahasiswa
              </h2>
              <p className="mt-4 text-sm sm:text-base text-primary-brown/80">
                Tantangan operasional pelaku usaha mikro bertemu dengan potensi besar talenta perguruan tinggi dalam ekosistem yang terstandarisasi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {/* Box UMKM */}
              <div className="border border-beige bg-white p-8 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-md bg-cream text-primary-brown">
                    <Briefcase className="size-6" />
                  </div>
                  <h3 className="font-heading text-2xl font-medium text-primary-brown">
                    Bagi Pemilik UMKM
                  </h3>
                </div>
                <div className="space-y-4 text-sm text-primary-brown/80">
                  <p>
                    <strong className="text-primary-brown">Tantangan:</strong> Membutuhkan bantuan untuk desain promosi, input data, penulisan konten, atau video singkat tanpa biaya rekrutmen karyawan penuh waktu yang memberatkan.
                  </p>
                  <p>
                    <strong className="text-primary-brown">Solusi Karta:</strong> Berlangganan kuota pekerjaan bulanan dengan harga terjangkau mulai dari Rp 75.000. Dapatkan hasil kerja terstandarisasi dengan Acceptance Checklist yang terukur.
                  </p>
                </div>
              </div>

              {/* Box Mahasiswa */}
              <div className="border border-beige bg-white p-8 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-md bg-cream text-primary-brown">
                    <GraduationCap className="size-6" />
                  </div>
                  <h3 className="font-heading text-2xl font-medium text-primary-brown">
                    Bagi Mahasiswa Kampus
                  </h3>
                </div>
                <div className="space-y-4 text-sm text-primary-brown/80">
                  <p>
                    <strong className="text-primary-brown">Tantangan:</strong> Sulit menembus marketplace freelancer terbuka karena perang banting harga, persaingan global yang tidak imbang, dan tidak adanya rekam jejak awal.
                  </p>
                  <p>
                    <strong className="text-primary-brown">Solusi Karta:</strong> Akses eksklusif berbasis kode referral kampus mitra. Nikmati sistem first-come-first-served, penghasilan tetap terproteksi, serta portofolio publik terverifikasi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. CARA KERJA (HOW IT WORKS) */}
        <section id="cara-kerja" className="border-b border-beige py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-heading text-3xl font-semibold text-primary-brown">
                Alur Kerja yang Transparan dan Terarah
              </h2>
              <p className="mt-4 text-sm sm:text-base text-primary-brown/80">
                Tiga langkah terstruktur untuk memastikan kolaborasi bisnis berjalan lancar dan adil.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Langkah UMKM */}
              <div className="space-y-6">
                <h3 className="font-heading text-xl font-medium text-primary-brown border-b border-beige pb-3">
                  Alur Kolaborasi UMKM
                </h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-brown text-white text-sm font-semibold">
                      1
                    </span>
                    <div>
                      <h4 className="font-sans font-semibold text-base text-primary-brown">
                        Pilih Paket Kuota Bulanan
                      </h4>
                      <p className="text-sm text-primary-brown/80 mt-1">
                        Pilih paket langganan sesuai volume pekerjaan bisnis Anda. Mitra kampus mendapatkan tarif khusus bersubsidi.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-brown text-white text-sm font-semibold">
                      2
                    </span>
                    <div>
                      <h4 className="font-sans font-semibold text-base text-primary-brown">
                        Terbitkan Brief & Acceptance Checklist
                      </h4>
                      <p className="text-sm text-primary-brown/80 mt-1">
                        Jelaskan tugas mikro dan tentukan 1–7 kriteria penerimaan spesifik. Tanpa proses tawar-menawar yang memakan waktu.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-brown text-white text-sm font-semibold">
                      3
                    </span>
                    <div>
                      <h4 className="font-sans font-semibold text-base text-primary-brown">
                        Tinjau Hasil & Berikan Penilaian
                      </h4>
                      <p className="text-sm text-primary-brown/80 mt-1">
                        Periksa tautan hasil kerja berdasarkan checklist. Terima hasil, minta revisi (maksimal 2x), atau konfirmasi penyelesaian.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Langkah Mahasiswa */}
              <div className="space-y-6">
                <h3 className="font-heading text-xl font-medium text-primary-brown border-b border-beige pb-3">
                  Alur Mahasiswa Kampus
                </h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sage-green text-white text-sm font-semibold">
                      1
                    </span>
                    <div>
                      <h4 className="font-sans font-semibold text-base text-primary-brown">
                        Masuk dengan Kode Referral Kampus
                      </h4>
                      <p className="text-sm text-primary-brown/80 mt-1">
                        Verifikasi keaktifan Anda sebagai mahasiswa dari kampus mitra untuk membuka akses penuh ke bursa pekerjaan.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sage-green text-white text-sm font-semibold">
                      2
                    </span>
                    <div>
                      <h4 className="font-sans font-semibold text-base text-primary-brown">
                        Klaim Pekerjaan Terbuka
                      </h4>
                      <p className="text-sm text-primary-brown/80 mt-1">
                        Sistem first-come-first-served yang adil sesuai tingkat keahlian dan minat peran Anda, tanpa perlu adu proposal.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sage-green text-white text-sm font-semibold">
                      3
                    </span>
                    <div>
                      <h4 className="font-sans font-semibold text-base text-primary-brown">
                        Kumpulkan Tugas & Dapatkan Imbalan
                      </h4>
                      <p className="text-sm text-primary-brown/80 mt-1">
                        Kirimkan tautan pengerjaan tepat waktu, terima imbalan terproteksi ke saldo dompet, dan tingkatkan reputasi KARTA Score.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. PAKET & HARGA (PRICING) */}
        <section id="paket" className="border-b border-beige py-24 bg-white/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-heading text-3xl font-semibold text-primary-brown">
                Paket Langganan Transparan untuk Segala Skala Usaha
              </h2>
              <p className="mt-4 text-sm sm:text-base text-primary-brown/80">
                Semua paket berbayar mengalokasikan 60% langsung kepada mahasiswa pelaksana dan 40% untuk operasional platform.
              </p>
            </div>

            {/* Free Tier Notice */}
            {freePackage && (
              <div className="mb-10 p-6 rounded-lg border border-beige bg-cream/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading text-xl font-medium text-primary-brown">
                    {freePackage.name}
                  </h3>
                  <p className="text-sm text-primary-brown/80 mt-1">
                    Setiap UMKM berhak atas 3 kuota pekerjaan sukarela (Volunteer Project) gratis setiap bulan. Mahasiswa tetap memperoleh poin reputasi penuh.
                  </p>
                </div>
                <Link href="/login?as=umkm">
                  <Button variant="secondary" size="sm">
                    Coba Gratis
                  </Button>
                </Link>
              </div>
            )}

            {/* Packages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {partnerPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`border rounded-lg p-6 flex flex-col justify-between ${
                    pkg.tier === "PREMIUM"
                      ? "border-primary-brown bg-[#c9b9a7]/20"
                      : "border-beige bg-white"
                  }`}
                >
                  <div>
                    <h3 className="font-heading text-2xl font-medium text-primary-brown">
                      {pkg.name}
                    </h3>
                    <p className="text-xs uppercase tracking-wider text-primary-brown/70 font-semibold mt-1">
                      Khusus Mitra Kampus
                    </p>

                    <div className="mt-6 mb-6">
                      <span className="font-heading text-3xl font-bold text-primary-brown">
                        {formatCurrency(pkg.priceIdr)}
                      </span>
                      <span className="text-xs text-primary-brown/70 ml-1">/ bulan</span>
                    </div>

                    <ul className="space-y-3 text-sm text-primary-brown/80 border-t border-beige pt-4">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-sage-green shrink-0" />
                        <span><strong>{pkg.jobQuota}</strong> Kuota Pekerjaan Mikro</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-sage-green shrink-0" />
                        <span>Alokasi <strong>{formatCurrency(pkg.allocationPerJobIdr)}</strong> / pekerjaan</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-sage-green shrink-0" />
                        <span>Imbalan Mahasiswa: <strong>{formatCurrency(Math.floor((pkg.allocationPerJobIdr * 60) / 100))}</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-sage-green shrink-0" />
                        <span>Masa berlaku 30 hari</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-8 pt-4">
                    <Link href="/login?as=umkm" className="block">
                      <Button className="w-full">
                        Pilih Paket
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Regular Non-Partner Note */}
            <div className="mt-12 text-center text-xs text-primary-brown/70 max-w-2xl mx-auto">
              *Tersedia juga paket UMKM Reguler (non-mitra) mulai dari Rp 90.000 / bulan. UMKM yang terafiliasi dengan program binaan kampus mitra akan diverifikasi oleh admin untuk mendapatkan harga bersubsidi.
            </div>
          </div>
        </section>

        {/* 5. PEMBEDA KARTA (DIFFERENTIATORS D1–D6) */}
        <section id="pembeda" className="border-b border-beige py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-heading text-3xl font-semibold text-primary-brown">
                6 Nilai Pembeda KARTA
              </h2>
              <p className="mt-4 text-sm sm:text-base text-primary-brown/80">
                Dirancang khusus untuk mematahkan kelemahan platform freelance terbuka.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="border border-beige bg-white p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded bg-cream text-primary-brown">
                    <Building2 className="size-5" />
                  </div>
                  <h3 className="font-heading text-lg font-medium text-primary-brown">
                    Jaringan Tertutup Kampus
                  </h3>
                </div>
                <p className="text-sm text-primary-brown/80 leading-relaxed">
                  Hanya mahasiswa aktif dengan kode referral resmi dari universitas mitra yang dapat bergabung. Menjamin keaslian identitas dan komitmen akademik.
                </p>
              </div>

              <div className="border border-beige bg-white p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded bg-cream text-primary-brown">
                    <Scale className="size-5" />
                  </div>
                  <h3 className="font-heading text-lg font-medium text-primary-brown">
                    Harga Tetap Tanpa Bidding
                  </h3>
                </div>
                <p className="text-sm text-primary-brown/80 leading-relaxed">
                  Tidak ada perang harga antar mahasiswa maupun spekulasi tarif dari UMKM. Nilai imbalan sudah ditetapkan pasti sesuai tier paket langganan.
                </p>
              </div>

              <div className="border border-beige bg-white p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded bg-cream text-primary-brown">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <h3 className="font-heading text-lg font-medium text-primary-brown">
                    Acceptance Checklist
                  </h3>
                </div>
                <p className="text-sm text-primary-brown/80 leading-relaxed">
                  Setiap pekerjaan dilengkapi 1–7 kriteria terukur yang disepakati di awal. Evaluasi dan penolakan harus merujuk pada checklist, bukan selera subjektif.
                </p>
              </div>

              <div className="border border-beige bg-white p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded bg-cream text-primary-brown">
                    <Award className="size-5" />
                  </div>
                  <h3 className="font-heading text-lg font-medium text-primary-brown">
                    KARTA Score & Portofolio
                  </h3>
                </div>
                <p className="text-sm text-primary-brown/80 leading-relaxed">
                  Halaman publik profil mahasiswa memuat rekam jejak pekerjaan nyata yang telah diterima UMKM, poin keahlian, dan tingkat reputasi resmi.
                </p>
              </div>

              <div className="border border-beige bg-white p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded bg-cream text-primary-brown">
                    <ShieldCheck className="size-5" />
                  </div>
                  <h3 className="font-heading text-lg font-medium text-primary-brown">
                    Perlindungan Kerja Adil
                  </h3>
                </div>
                <p className="text-sm text-primary-brown/80 leading-relaxed">
                  Batas revisi maksimal 2 kali, SLA review 3 hari dengan auto-accept, dan jendela pengajuan sengketa yang diputuskan adil oleh operator platform.
                </p>
              </div>

              <div className="border border-beige bg-white p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded bg-cream text-primary-brown">
                    <TrendingUp className="size-5" />
                  </div>
                  <h3 className="font-heading text-lg font-medium text-primary-brown">
                    Impact Dashboard
                  </h3>
                </div>
                <p className="text-sm text-primary-brown/80 leading-relaxed">
                  Metrik terukur kontribusi terhadap pencapaian SDG 8 (Pekerjaan Layak & Pertumbuhan Ekonomi) dan SDG 10 (Pengurangan Ketimpangan Akses Talenta).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. DAMPAK NYATA (IMPACT COUNTERS) */}
        <section id="dampak" className="border-b border-beige py-20 bg-white/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-heading text-3xl font-semibold text-primary-brown">
                Dampak Nyata yang Terus Bertumbuh
              </h2>
              <p className="mt-4 text-sm sm:text-base text-primary-brown/80">
                Pencapaian nyata kolaborasi antara pelaku UMKM dan sivitas akademika kampus.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              <div className="p-6 rounded-lg border border-beige bg-white">
                <p className="font-heading text-3xl sm:text-4xl font-bold text-primary-brown">
                  {formatCurrency(metrics.totalEarningsIdr)}
                </p>
                <p className="text-xs sm:text-sm font-medium text-primary-brown/70 mt-2">
                  Dana Tersalurkan ke Mahasiswa
                </p>
              </div>

              <div className="p-6 rounded-lg border border-beige bg-white">
                <p className="font-heading text-3xl sm:text-4xl font-bold text-primary-brown">
                  {metrics.totalUmkm}
                </p>
                <p className="text-xs sm:text-sm font-medium text-primary-brown/70 mt-2">
                  UMKM Terdaftar & Terbantu
                </p>
              </div>

              <div className="p-6 rounded-lg border border-beige bg-white">
                <p className="font-heading text-3xl sm:text-4xl font-bold text-primary-brown">
                  {metrics.completedJobs}
                </p>
                <p className="text-xs sm:text-sm font-medium text-primary-brown/70 mt-2">
                  Tugas Mikro Sukses Diselesaikan
                </p>
              </div>

              <div className="p-6 rounded-lg border border-beige bg-white">
                <p className="font-heading text-3xl sm:text-4xl font-bold text-primary-brown">
                  {metrics.totalCampuses}
                </p>
                <p className="text-xs sm:text-sm font-medium text-primary-brown/70 mt-2">
                  Kampus Mitra Aktif
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. KAMPUS MITRA (CAMPUS PARTNERS) */}
        <section className="border-b border-beige py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="font-heading text-3xl font-semibold text-primary-brown">
                Didukung oleh Perguruan Tinggi Terkemuka
              </h2>
              <p className="mt-3 text-sm text-primary-brown/80">
                Terhubung dengan himpunan mahasiswa dan inkubator bisnis kampus terakreditasi.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {campuses.map((campus) => (
                <div
                  key={campus.id}
                  className="flex items-center gap-4 p-5 rounded-lg border border-beige bg-white"
                >
                  <div className="p-3 rounded-md bg-cream text-primary-brown">
                    <GraduationCap className="size-6" />
                  </div>
                  <div>
                    <h4 className="font-heading text-base font-semibold text-primary-brown">
                      {campus.name}
                    </h4>
                    <p className="text-xs text-primary-brown/70">
                      {campus.city}, {campus.province}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. FAQ SECTION */}
        <section id="faq" className="border-b border-beige py-24 bg-white/50">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl font-semibold text-primary-brown">
                Pertanyaan yang Sering Diajukan (FAQ)
              </h2>
              <p className="mt-3 text-sm text-primary-brown/80">
                Informasi penting mengenai operasional dan aturan main di Karta.
              </p>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-lg border border-beige bg-white">
                <h3 className="font-heading text-lg font-medium text-primary-brown mb-2 flex items-center gap-2">
                  <HelpCircle className="size-5 text-sage-green shrink-0" />
                  Apa itu kode referral kampus dan bagaimana mendapatkannya?
                </h3>
                <p className="text-sm text-primary-brown/80 leading-relaxed font-sans pl-7">
                  Kode referral kampus adalah kode unik verifikasi yang diterbitkan oleh perguruan tinggi mitra resmi. Mahasiswa dapat memperoleh kode ini melalui koordinator kemahasiswaan, ketua program studi, BEM, atau inkubator bisnis kampus yang telah bekerja sama dengan Karta.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-beige bg-white">
                <h3 className="font-heading text-lg font-medium text-primary-brown mb-2 flex items-center gap-2">
                  <HelpCircle className="size-5 text-sage-green shrink-0" />
                  Bagaimana mekanisme pembayaran paket dan penarikan imbalan?
                </h3>
                <p className="text-sm text-primary-brown/80 leading-relaxed font-sans pl-7">
                  UMKM melakukan pembayaran langganan melalui transfer rekening yang diverifikasi oleh tim admin Karta. Untuk mahasiswa, imbalan dari pekerjaan yang diterima (Accepted) otomatis masuk ke saldo Payable, dan penarikan dapat diajukan dengan batas minimal Rp 50.000 langsung ke rekening bank mahasiswa.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-beige bg-white">
                <h3 className="font-heading text-lg font-medium text-primary-brown mb-2 flex items-center gap-2">
                  <HelpCircle className="size-5 text-sage-green shrink-0" />
                  Apa yang dimaksud dengan Volunteer Project / Paket Gratis?
                </h3>
                <p className="text-sm text-primary-brown/80 leading-relaxed font-sans pl-7">
                  Setiap UMKM berhak mempublikasikan hingga 3 pekerjaan mikro tanpa biaya setiap bulan berlabel Volunteer Project. Pekerjaan ini tidak memberikan imbalan uang tunai kepada mahasiswa, namun memberikan poin reputasi penuh (+10 poin) dan portofolio terverifikasi untuk membantu mahasiswa pemula membangun rekam jejak.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-beige bg-white">
                <h3 className="font-heading text-lg font-medium text-primary-brown mb-2 flex items-center gap-2">
                  <HelpCircle className="size-5 text-sage-green shrink-0" />
                  Bagaimana jika hasil pekerjaan tidak sesuai atau UMKM tidak merespons?
                </h3>
                <p className="text-sm text-primary-brown/80 leading-relaxed font-sans pl-7">
                  Karta memberlakukan SLA review 3 hari: jika UMKM tidak memberikan evaluasi dalam 3 hari kalender setelah pengumpulan tugas, sistem secara otomatis menerima hasil (Auto-accept) dan mencairkan imbalan mahasiswa. Jika terjadi penolakan yang tidak objektif, mahasiswa memiliki jendela 3 hari untuk membuka sengketa yang ditinjau langsung oleh admin.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 9. BOTTOM CTA */}
        <section className="py-20 text-center">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary-brown">
              Siap Mengembangkan Usaha atau Memulai Portofolio Anda?
            </h2>
            <p className="mt-4 text-base text-primary-brown/80 font-sans max-w-xl mx-auto">
              Bergabunglah hari ini bersama ribuan pelaku usaha mikro dan mahasiswa unggul di seluruh Indonesia.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login?as=student">
                <Button size="lg">Daftar sebagai Mahasiswa</Button>
              </Link>
              <Link href="/login?as=umkm">
                <Button variant="secondary" size="lg">
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
