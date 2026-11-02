# Log Keputusan Arsitektur & Implementasi (DECISIONS.md)

Dokumen ini mencatat keputusan teknis penting dan resolusi ambiguitas selama pembangunan platform KARTA sesuai aturan PRD §0.1 butir 7.

---

### [2026-11-01] Fase 1 — Fondasi Auth, Onboarding, Gambar, dan Landing Page

1. **Next.js 16 Proxy Architecture (`src/proxy.ts`):**
   - Sesuai panduan Next.js 16 (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`), konvensi `middleware.ts` telah digantikan secara resmi oleh `src/proxy.ts` dengan ekspor bernama `proxy()`.
   - `proxy.ts` menggunakan token JWT edge-safe via `getToken` dari `next-auth/jwt` tanpa memanggil database langsung. Rute dilindungi berdasarkan prefix `/student`, `/umkm`, `/admin`, dan `/onboarding`.

2. **Auth.js v5 Konfigurasi Terpisah (`auth.config.ts` & `auth.ts`):**
   - `auth.config.ts` memuat konfigurasi provider Google OAuth dan callbacks token untuk kompatibilitas edge/proxy.
   - `auth.ts` memuat instansiasi penuh NextAuth bersama `@auth/prisma-adapter` untuk runtime Node.js.
   - Pengecekan admin dilakukan via variabel lingkungan `ADMIN_EMAILS` (daftar email dipisahkan koma).

3. **Rate Limiting Kode Referral & Unggahan Gambar:**
   - BR-A4: Batas 5 kali kegagalan penebusan kode referral dalam jendela 15 menit per user diimplementasikan di memori server service (`referral.ts`).
   - BR-I4: Batas maksimal 10 unggahan gambar per jam per user diimplementasikan di `images/service.ts`.

4. **Implementasi Karta Design System pada Landing Page & Layout:**
   - Dilarang keras: Announcement Bar, Eyebrow Badge, dan Announcement Pill.
   - Palet warna: Cream (`#f7f4ed`), Primary Brown (`#5a4639`), Sage Green (`#a3b18a`), Beige (`#c9b9a7`), Peach (`#f4d7c7`).
   - Tipografi: Playfair Display untuk seluruh heading (H1, H2, H3) dan Montserrat untuk body text serta tombol (uppercase semi-bold tracking-wider).
   - Data dinamis landing page: Daftar paket diambil langsung dari tabel `Package` di database; metrik SDG dihitung dari tabel agregat profil, job, dan ledger; daftar kampus mitra diambil dari tabel `Campus` yang aktif.


### [2026-11-01] Fase 2 — Paket, Langganan, dan Manajemen Kuota

1. **Lazy Allocation Kuota Gratis Bulanan (BR-S1):**
   - Kuota gratis bulanan (3 tugas/bulan) dibuat secara lazy saat UMKM pertama kali membuka dasbor atau memvalidasi kuota untuk mempublikasikan tugas di bulan berjalan (`YYYY-MM`).
   - Mencegah ledakan entri database pada pergantian tanggal 1 setiap bulan.

2. **Hierarki Konsumsi Kuota (BR-S3):**
   - UMKM diperbolehkan memiliki satu paket gratis bulanan aktif dan maksimal satu paket berbayar aktif secara bersamaan.
   - Saat mempublikasikan tugas, sistem mengonsumsi kuota dengan prioritas: paket berbayar aktif yang mendekati kedaluwarsa terlebih dahulu, kemudian kuota gratis bulanan.

3. **Integritas QuotaLedger dan Pemulihan Kuota (BR-S4 & BR-S5):**
   - Setiap mutasi kuota (pengurangan saat publish -1 atau pemulihan +1) dicatat dalam tabel `QuotaLedger` di dalam transaksi database yang atomik (`prisma.$transaction`).
   - Kuota dipulihkan hanya pada kondisi sah: pembatalan job OPEN, job kedaluwarsa tanpa pelamar, atau pembatalan job CLAIMED sebelum mulai.

4. **Verifikasi Pembayaran Manual & Audit Log Admin (BR-S2, G-5):**
   - UMKM memilih paket berbayar -> status `PENDING_PAYMENT` -> instruksi transfer bank manual ditampilkan.
   - Admin memverifikasi pembayaran via `/admin/subscriptions`, mengaktifkan langganan, menetapkan `startsAt` dan `endsAt` (+30 hari), dan mencatat aksi ke tabel `AuditLog`.
   - Manajemen paket langganan (/admin/packages) memungkinkan admin menyesuaikan harga IDR, kuota tugas, dan alokasi kompensasi mahasiswa per tugas dengan audit trail.

### [2026-11-01] Fase 3 — Job UMKM, State Machine, dan Validasi Deadline

1. **State Machine Sentral (`features/jobs/state-machine.ts`):**
   - Mengimplementasikan seluruh transisi legal status pekerjaan sesuai tabel PRD §7 dengan verifikasi aktor (`UMKM`, `STUDENT`, `ADMIN`, `SYSTEM`).
   - Setiap transisi di luar tabel resmi melempar `StateMachineError`.
   - Status terminal (`ACCEPTED`, `CANCELLED`, `EXPIRED`) dikunci dari segala mutasi transisi.
   - 33 skenario transisi diuji secara komprehensif pada unit test `tests/state-machine.test.ts`.

2. **Aturan Validasi Deadline (BR-J3 & BR-J5):**
   - Validasi tenggat minimum pengerjaan per peran × tier paket langganan (`assertValidDeadline`).
   - Tier `FREE` dinormalisasi secara otomatis memakai batas minimum jam tier `BASIC` (contoh: Data Entry min 48 jam, Desain Grafis min 72 jam, Frontend Dev min 168 jam).
   - Batas klaim mahasiswa dihitung via `getClaimCutoffTime` (`now <= deadlineAt - minHours`).

3. **Snapshot Finansial & Konsumsi Kuota saat Publikasi (BR-J1, BR-J2, BR-S4, BR-S7):**
   - Saat pekerjaan dipublikasikan dari `DRAFT` menjadi `OPEN`:
     - Kuota langganan UMKM dipotong 1 (`deductQuota`) dalam transaksi atomik database.
     - Snapshot keuangan disimpan ke record `Job`: `allocationIdr`, `studentShareIdr` (60%), `platformShareIdr` (40%), `packageTier`, dan `isPaid`. UMKM tidak dapat memanipulasi nominal secara manual.
     - Newcomer Lane (BR-C5): jika `beginnerFriendly = true`, sistem menetapkan jendela 30 menit khusus pemula (`newcomerLaneUntil = now + 30m`).

4. **Kompensasi dan Pemulihan Kuota (BR-S5a & BR-S5c):**
   - Pembatalan pekerjaan `OPEN` oleh UMKM memulihkan kuota paket langganan secara otomatis (+1).
   - Pembatalan pekerjaan `CLAIMED` sebelum mahasiswa menekan Mulai Kerjakan membatalkan tugas, mengubah penugasan menjadi `WITHDRAWN`, membatalkan entri saldo (`VOIDED`), dan memulihkan kuota (+1).
