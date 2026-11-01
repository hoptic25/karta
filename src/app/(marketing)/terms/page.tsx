import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-primary-brown">
      <PublicNavbar />

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 font-sans">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary-brown">
            Syarat & Ketentuan Layanan
          </h1>
          <p className="mt-2 text-xs text-primary-brown/60">
            Terakhir diperbarui: 1 November 2026
          </p>
        </div>

        <div className="text-sm text-primary-brown/85 space-y-6 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-primary-brown">
              1. Ketentuan Umum
            </h2>
            <p>
              Dengan mendaftar atau menggunakan platform Karta, Anda menyetujui seluruh syarat dan ketentuan ini. Karta adalah marketplace mikro B2B2C yang memfasilitasi transaksi pekerjaan antara UMKM dan mahasiswa perguruan tinggi mitra.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-primary-brown">
              2. Tanggung Jawab Mahasiswa
            </h2>
            <p>
              Mahasiswa wajib menyelesaikan tugas mikro sesuai Acceptance Checklist dan tenggat waktu (deadline) yang telah disepakati. Tautan hasil pengerjaan harus valid dan dapat diakses publik/oleh pemilik pekerjaan.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-primary-brown">
              3. Tanggung Jawab UMKM
            </h2>
            <p>
              UMKM wajib memberikan instruksi yang jelas dan terukur dalam Acceptance Checklist. Evaluasi pekerjaan tunduk pada SLA 3 hari kalender, di mana ketiadaan respon dalam periode tersebut akan memicu sistem Auto-Accept.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-primary-brown">
              4. Kebijakan Sengketa
            </h2>
            <p>
              Apabila terjadi perbedaan pendapat terkait penolakan tugas, mahasiswa berhak mengajukan sengketa dalam kurun waktu 3 hari kalender untuk dievaluasi secara adil oleh administrator platform.
            </p>
          </section>
        </div>

        <div className="pt-8 border-t border-beige">
          <Link href="/" className="text-xs text-primary-brown/70 hover:text-primary-brown underline">
            ← Kembali ke Beranda
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

