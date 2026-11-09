import { Suspense } from "react";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream text-primary-brown">
      <Suspense fallback={<div className="h-18 border-b border-beige bg-cream" />}>
        <PublicNavbar />
      </Suspense>

      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 font-sans">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary-brown">
            Syarat & Ketentuan Layanan Karta
          </h1>
          <p className="mt-2 text-xs text-primary-brown/60">
            Terakhir diperbarui: 3 November 2026 • Tata Tertib Ekosistem Marketplace Mikro Kampus
          </p>
        </div>

        <div className="text-sm text-primary-brown/85 space-y-6 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-primary-brown">
              1. Ketentuan Umum & Definisi
            </h2>
            <p>
              Dengan mendaftar, mengakses, atau menggunakan platform Karta, Anda menyepakati syarat dan ketentuan berikut. Karta adalah platform marketplace mikro berbasis kampus yang menghubungkan Usaha Mikro, Kecil, dan Menengah (UMKM) dengan mahasiswa aktif perguruan tinggi mitra untuk pengerjaan tugas mikro berbayar maupun sukarela yang terstruktur.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-primary-brown">
              2. Ketentuan Pendaftaran & Akun
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Pendaftaran akun menggunakan email dan password. Satu email hanya berhak memiliki satu peran aktif (Mahasiswa atau Pelaku UMKM).</li>
              <li>Pendaftaran mahasiswa mewajibkan penukaran kode referral perguruan tinggi mitra terdaftar dan dapat mewajibkan email institusi (<code>.ac.id</code>) sesuai kebijakan kampus pengelola.</li>
              <li>Pengguna bertanggung jawab penuh atas seluruh aktivitas yang terjadi di bawah akun terdaftar.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-primary-brown">
              3. Mekanisme Klaim Tugas & Newcomer Lane
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Klaim tugas mikro menggunakan sistem <em>First-Come, First-Served</em> (FCFS) yang atomik dan adil.</li>
              <li>Untuk mendukung inklusi talenta pemula (SDG 10), pekerjaan yang ditandai <em>Ramah Pemula</em> dilindungi oleh <strong>Newcomer Lane</strong> selama 30 menit pertama setelah publikasi, di mana pekerjaan hanya dapat diklaim oleh mahasiswa level <em>Newcomer</em> atau <em>Reliable</em>.</li>
              <li>Mahasiswa wajib memulai pengerjaan (<em>Start Work</em>) dalam kurun waktu 24 jam setelah klaim. Tugas yang tidak dimulai dalam 24 jam akan dilepas kembali ke pasar (<em>Auto-Release</em>) tanpa penalti.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-primary-brown">
              4. Standar Eksekusi, Review, dan Batas Revisi
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Mahasiswa wajib menyelesaikan deliverable pekerjaan sesuai dengan butir-butir <em>Acceptance Checklist</em> yang tertera sebelum tenggat waktu (<em>deadline</em>).</li>
              <li>UMKM wajib meninjau hasil pekerjaan dalam batas SLA 3 hari kalender. Jika UMKM tidak memberikan respon dalam kurun waktu 3 hari kalender, sistem secara otomatis menerima pekerjaan (<strong>Auto-Accept</strong>) demi kepastian hak imbalan mahasiswa.</li>
              <li>Permintaan revisi oleh UMKM dibatasi maksimal 2 (dua) kali dengan catatan evaluasi checklist yang jelas dan terarah.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-primary-brown">
              5. Saldo, Escrow, dan Penarikan Dana
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Alokasi imbalan mahasiswa dari pekerjaan berbayar diamankan dalam status tertahan (<em>escrow hold</em>) sejak pekerjaan dipublikasikan dan berpindah menjadi saldo dapat dicairkan (<em>PAYABLE</em>) setelah pekerjaan disetujui (<em>ACCEPTED</em>).</li>
              <li>Penarikan saldo (<em>withdrawal</em>) dapat diajukan dengan batas minimum Rp 50.000 ke rekening bank lokal terdaftar mahasiswa dan diproses melalui verifikasi transfer manual oleh administrator.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-primary-brown">
              6. Kebijakan Sengketa & Pelaporan Kendala
            </h2>
            <p>
              Jika pekerjaan ditolak oleh UMKM, mahasiswa memiliki jendela hak sanggah sengketa selama 3 hari kalender. Administrator Karta bertindak sebagai penengah independen yang meninjau kesesuaian deliverable terhadap checklist awal. Keputusan administrator bersifat final dan mengikat.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-xl font-semibold text-primary-brown">
              7. Kontak Layanan Bantuan
            </h2>
            <p>
              Apabila Anda memiliki pertanyaan atau kendala seputar Syarat dan Ketentuan ini, silakan hubungi tim dukungan kami melalui surat elektronik ke{" "}
              <a href="mailto:support@karta.id" className="underline font-medium text-earth-primary">
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
