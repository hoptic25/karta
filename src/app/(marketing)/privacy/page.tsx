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
            Kebijakan Privasi Karta
          </h1>
          <p className="mt-2 text-xs text-primary-brown/60">
            Terakhir diperbarui: 3 November 2026 • Sesuai Standar Google OAuth & Kebijakan Data Mahasiswa
          </p>
        </div>

        <div className="prose prose-stone text-sm text-primary-brown/85 space-y-6 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-primary-brown">
              1. Informasi yang Kami Kumpulkan
            </h2>
            <p>
              Platform Karta mengumpulkan data pengguna semata-mata untuk memfasilitasi pencocokan pekerjaan mikro kampus antara UMKM dan mahasiswa mitra:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Data Autentikasi Google OAuth:</strong> Nama lengkap, alamat email Google, dan tautan foto profil avatar publik yang disediakan saat Anda masuk menggunakan tombol <em>Sign in with Google</em>.
              </li>
              <li>
                <strong>Data Peran Mahasiswa:</strong> Institusi perguruan tinggi mitra, program studi, kode referral pendaftaran kampus, peran keahlian (desain, copywriting, web, media sosial), dan nomor rekening bank pencairan imbalan.
              </li>
              <li>
                <strong>Data Profil UMKM:</strong> Nama merek/usaha bisnis, kota domisili usaha, tautan logo, dan status kemitraan binaan kampus.
              </li>
              <li>
                <strong>Penyimpanan Berkas Gambar:</strong> Berkas gambar referensi tugas mikro dan logo bisnis yang diunggah ke layanan penyimpanan cloud (Vercel Blob) dengan batas maksimal 2 MB per berkas.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-primary-brown">
              2. Penggunaan Google OAuth & Perlindungan Data Pengguna
            </h2>
            <p>
              Karta menggunakan Google OAuth 2.0 untuk memberikan pengalaman masuk yang cepat, andal, dan aman tanpa menyimpan kredensial kata sandi pengguna di peladen kami.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Kami hanya meminta akses profil dasar (<code>email</code> dan <code>profile</code>).</li>
              <li>Data akun Google Anda <strong>tidak pernah</strong> dijual, disewakan, atau dibagikan kepada pihak pengiklan mana pun.</li>
              <li>Data Anda tidak digunakan untuk melatih model kecerdasan buatan (AI) umum atau publik.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-primary-brown">
              3. Penyimpanan, Keamanan, dan Enkripsi
            </h2>
            <p>
              Data nomor rekening bank mahasiswa dilindungi dengan akses terbatas. Nomor rekening hanya dapat dibaca oleh administrator terverifikasi untuk tujuan eksekusi transfer pencairan saldo imbalan kerja (<em>withdrawal</em>) secara manual. Seluruh riwayat transaksi saldo dicatat dalam buku besar (<em>ledger</em>) ganda yang aman dan dapat diaudit.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-primary-brown">
              4. Portofolio Publik & Kontrol Privasi
            </h2>
            <p>
              Mahasiswa memiliki hak kendali penuh atas visibilitas profil dan hasil karya tugas mikro mereka melalui pengaturan <em>Portofolio Publik</em> di dasbor profil. Mahasiswa dapat menonaktifkan visibilitas publik portofolio kapan saja sesuai preferensi pribadi.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-primary-brown">
              5. Penghapusan Data & Kontak Pengelola
            </h2>
            <p>
              Anda berhak meminta salinan data Anda atau mengajukan penghapusan akun beserta seluruh data terkait secara permanen. Untuk pertanyaan, permohonan penghapusan data, atau komunikasi terkait privasi, hubungi kami di:
            </p>
            <p className="bg-white/60 p-3 rounded-lg border border-beige/60 text-xs">
              <strong>Tim Pengelola KARTA (Micro Job Marketplace Kampus)</strong><br />
              Email Resmi: <a href="mailto:support@karta.id" className="underline font-medium text-earth-primary">support@karta.id</a><br />
              Kanal Bantuan: Tim Layanan Pengguna & Kemahasiswaan Karta
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
