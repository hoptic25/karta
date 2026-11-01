import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-primary-brown">
      <PublicNavbar />

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 font-sans">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary-brown">
            Kebijakan Privasi
          </h1>
          <p className="mt-2 text-xs text-primary-brown/60">
            Terakhir diperbarui: 1 November 2026
          </p>
        </div>

        <div className="prose prose-stone text-sm text-primary-brown/85 space-y-6 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-primary-brown">
              1. Informasi yang Kami Kumpulkan
            </h2>
            <p>
              Karta mengumpulkan informasi pengguna saat Anda mendaftar melalui Google OAuth (nama, alamat email, dan foto profil), serta data spesifik peran seperti program studi dan minat pekerjaan untuk mahasiswa, atau nama bisnis dan lokasi untuk pelaku UMKM.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-primary-brown">
              2. Penggunaan Informasi
            </h2>
            <p>
              Data Anda digunakan semata-mata untuk memfasilitasi pencocokan pekerjaan mikro kampus, verifikasi keabsahan mahasiswa melalui kode referral kampus mitra, pengelolaan penarikan imbalan, dan penyajian portofolio publik.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-primary-brown">
              3. Penyimpanan dan Keamanan Data
            </h2>
            <p>
              Kami tidak membagikan data pribadi sensitif Anda kepada pihak ketiga tanpa izin. Nomor rekening bank mahasiswa dienkripsi dan hanya dapat diakses oleh administrator resmi untuk proses pencairan dana penarikan.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-primary-brown">
              4. Kontak
            </h2>
            <p>
              Pertanyaan mengenai kebijakan privasi ini dapat dikirimkan ke{" "}
              <a href="mailto:support@karta.id" className="underline font-medium">
                support@karta.id
              </a>
              .
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
