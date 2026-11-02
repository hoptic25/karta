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

---

### [2026-11-02] Fase 4 — Discovery, Rekomendasi Pintar, dan Atomic Claim Mahasiswa

1. **Formula Rekomendasi Skor D-2 (`features/jobs/ranking.ts`):**
   - Skor penataan rekomendasi dihitung secara transparan berbasis empat komponen formula PRD §Modul D-2:
     - `roleMatch` (+40 poin): jika peran pekerjaan ada di dalam daftar keahlian mahasiswa (`student.roles`).
     - `tierBoost` (+0 BASIC/FREE, +10 PROFESSIONAL, +20 PREMIUM): insentif visibilitas paket langganan berbayar.
     - `urgency` (tenggat $\le 72$ jam: $20 \times (1 - \text{hoursLeft} / 72)$, selain itu 0).
     - `freshness` ($\max(0, 20 - \text{ageHours} / 6)$): prioritas tugas baru dalam 5 hari pertama.
   - Hasil diuji di `tests/ranking.test.ts` mencakup pencocokan peran, boost tier langganan, dan sorting multi-job.

2. **Pencegahan Race Condition Klaim Atomik (First-Come First-Served):**
   - Menggunakan klausa atomic update `prisma.job.updateMany` dengan filter `WHERE id = jobId AND status = 'OPEN'`.
   - Jika `count === 0`, transaksi dibatalkan seketika (`Job sudah diambil oleh mahasiswa lain`).
   - Mencegah fenomena double-claim ketika ratusan mahasiswa berebut pekerjaan secara bersamaan. Teruji dalam simulasi konkurensi (10 permintaan simultan $\to$ tepat 1 yang berhasil mengklaim).

3. **Integritas Aturan Bisnis Klaim Mahasiswa (BR-C1 s.d. BR-C5, BR-J5):**
   - `BR-C1`: Batas beban simultan aktif berdasarkan level (NEWCOMER: 1, RELIABLE: 2, TRUSTED: 3).
   - `BR-C2`: Batas unpaid/volunteer simultan (maksimal 1 pekerjaan volunteer aktif).
   - `BR-C3`: Penegasan persetujuan sukarela untuk tugas tanpa imbalan uang (dialog konfirmasi eksplisit di antarmuka sebelum klaim).
   - `BR-C4`: Penguncian level minimum pekerjaan (misal TRUSTED tidak bisa diambil oleh NEWCOMER).
   - `BR-C5`: Proteksi Newcomer Lane (jika `beginnerFriendly = true`, selama 30 menit awal hanya level `NEWCOMER` yang berhak mengklaim).
   - `BR-J5`: Batas cutoff deadline minimum (klaim ditolak jika sisa waktu menuju deadline kurang dari jam minimum pengerjaan).

4. **Pencatatan Saldo Mahasiswa Pending (`LedgerEntry` HOLD):**
   - Pada saat pekerjaan berbayar diklaim, transaksi membuat entri saldo mahasiswa `PENDING` senilai `studentShareIdr` berstatus `HOLD` bertipe `JOB_EARNING`.
   - Mengirim notifikasi in-app otomatis ke UMKM pemilik tugas.

---

### [2026-11-02] Fase 5 — Eksekusi, Review, Revisi, dan Workspace Mahasiswa

1. **Alur Pengerjaan Mahasiswa (`features/jobs/execution.ts`):**
   - `startWork` (BR-E1): Mahasiswa mengaktifkan waktu kerja (`CLAIMED` $\to$ `IN_PROGRESS`) dengan mencatat stempel waktu `startedAt` dan mengirim notifikasi real-time ke UMKM.
   - `withdrawJob` (BR-E6 & BR-E2): Mahasiswa diperbolehkan mundur sebelum mulai tanpa sanksi reputasi (`CLAIMED` $\to$ `OPEN`), penugasan diubah menjadi `WITHDRAWN`, dan entri saldo di-`VOIDED`. Jika mundur saat masa `IN_PROGRESS`, status penugasan dicatat dengan alasan.
   - `submitWork` (BR-E2 & BR-J7):
     - Memvalidasi tautan berkas terhadap whitelist domain terpercaya (`isValidDeliverableUrl`).
     - Mewajibkan self-check pada seluruh kriteria penerimaan sebelum tombol submit aktif.
     - Menghasilkan entri `Submission` bertahap (`number` 1, 2, 3), menandai `isLate` bila melewati batas waktu, dan mengaktifkan SLA review UMKM selama 3 hari (`reviewDueAt = now + 3d`).

2. **Evaluasi Penilaian UMKM (BR-E3 & BR-E4):**
   - **Accept**: Status tugas menjadi `ACCEPTED`, assignment `COMPLETED`, saldo `STUDENT_SHARE` diubah menjadi `PAYABLE`, platform fee diakui (`RECOGNIZED`), serta menghitung reputasi mahasiswa (+10 poin base, +3 bonus tanpa revisi, +2 bonus tepat waktu pada submit perdana). Evaluasi kenaikan level otomatis (50 poin $\to$ `RELIABLE`, 150 $\to$ `TRUSTED`, 300 $\to$ `EXPERT`).
   - **Request Revision**: Dibatasi maksimal 2 kali (`revisionCount < 2`). Menyetel SLA revisi mahasiswa selama 3 hari (`revisionDueAt = now + 3d`), status tugas beralih ke `REVISION_REQUESTED`.
   - **Reject**: Wajib menyertakan alasan minimal 20 karakter dan evaluasi kriteria gagal. Status beralih ke `REJECTED`, saldo ditahan (`HELD`), serta membuka jendela sanggahan sengketa mahasiswa selama 3 hari (`disputeUntil = now + 3d`).

3. **Workspace Mahasiswa & Antarmuka Manajemen UMKM:**
   - Halaman `/student/my-jobs` menyediakan tab interaktif (Aktif, Menunggu Review, Perlu Revisi, Selesai, Lainnya).
   - Halaman `/student/my-jobs/[id]` menyediakan ruang kerja terpadu (Workspace) berisi linimasa status, form pengumpulan responsif, histori berkas, serta dialog pengunduran diri.
   - Halaman `/umkm/jobs/[id]` diperkaya dengan panel evaluasi interaktif saat tugas berstatus `SUBMITTED`, memungkinkan UMKM menilai setiap kriteria secara mandiri sebelum mengambil keputusan.

---

### [2026-11-02] Fase 6 — Finansial Mahasiswa, Penarikan Dana, Rating Reputasi, dan Portofolio Publik

1. **Ringkasan Saldo dan Alur Penarikan Dana (PRD §6.8 BR-W1 s.d. BR-W4):**
   - **BR-W1**: Saldo dihitung secara riil dari entri pembukuan `LedgerEntry` bertipe `STUDENT_SHARE`:
     - *Tersedia (PAYABLE)*: status `PAYABLE` dan `withdrawalId = null`.
     - *Tertahan (HELD)*: tugas yang ditolak atau dalam proses sengketa.
     - *Dalam Proses (RESERVED)*: tugas yang sedang dikerjakan (`IN_PROGRESS`) atau dalam tinjauan (`SUBMITTED`).
     - *Telah Dicairkan (PAID)*: tugas yang sudah selesai ditransfer admin.
   - **BR-W2**: Data rekening bank disimpan di profil mahasiswa (`bankName`, `bankAccountName`, `bankAccountNumber`) dengan sanitasi digit angka (5-20 digit) dan masking antarmuka (`•••• 1234`).
   - **BR-W3**: Penarikan saldo menerapkan aturan batas minimum Rp 50.000, menarik seluruh saldo `PAYABLE` yang tersedia sekaligus, dan membatasi maksimal 1 pengajuan aktif berstatus `REQUESTED` dalam satu waktu. Seluruh entri ledger yang dicairkan ditandai dengan `withdrawalId` di dalam transaksi database atomik.
   - **BR-W4**: Panel admin (`/admin/withdrawals`) memverifikasi transfer manual. Aksi persetujuan (`PAY`) menandai entri ledger menjadi `PAID` dan mencatat `AuditLog` (`WITHDRAWAL_PAID`). Aksi penolakan (`REJECT`) mewajibkan alasan penolakan, melepaskan tanda `withdrawalId` pada ledger sehingga saldo kembali dapat ditarik mahasiswa, mengirimkan notifikasi in-app, serta mencatat `AuditLog` (`WITHDRAWAL_REJECTED`).

2. **Sistem Rating Timbal Balik & Reputasi (PRD §6.7):**
   - **UMKM $\to$ Mahasiswa**: Rating bintang 1–5 dan komentar bebas hanya dapat diberikan setelah tugas berstatus `ACCEPTED`.
     - Rating tinggi ($\ge 4$ bintang) memberikan bonus reputasi +2 poin yang dicatat pada tabel `PointEvent`.
     - Nilai rata-rata reputasi mahasiswa dihitung secara inkremental dan memperbarui status level secara otomatis (0-49: `NEWCOMER`, 50-149: `RELIABLE`, 150-299: `TRUSTED`, $\ge 300$: `EXPERT`).
   - **Mahasiswa $\to$ UMKM**: Rating 4 dimensi (Kejelasan Brief, Komunikasi, Profesionalisme, Kecepatan Review) skala 1–5 bintang beserta komentar saran. Nilai rata-rata dari keempat dimensi memperbarui profil `ratingAvg` dan `ratingCount` UMKM.
   - Ditegakkan aturan integritas unik `@@unique([jobId, direction])` untuk mencegah ulasan duplikat.

3. **Portofolio Publik Mahasiswa (PRD §Modul F-4):**
   - Halaman `/s/[username]` dapat diakses publik tanpa login.
   - Menampilkan: identitas mahasiswa, kampus, jurusan, lencana level reputasi, total poin, bintang kepuasan, daftar keterampilan, serta katalog tugas mikro `ACCEPTED` lengkap dengan nama UMKM mitra, lencana relawan (jika unpaid), dan testimoni nyata UMKM.
   - Menjunjung tinggi privasi: **TIDAK** menampilkan alamat email, nominal uang (IDR), maupun nomor rekening perbankan.
   - Mengakomodasi preferensi privasi mahasiswa melalui sakelar `portfolioPublic` di halaman `/student/profile`.

4. **Halaman & Antarmuka Terintegrasi:**
   - `/student/earnings`: Dasbor saldo 4 kartu, kartu rekening pencairan, konfirmasi penarikan, riwayat pencairan, dan riwayat mutasi ledger.
   - `/student/profile`: Pengaturan bio profil, visibilitas portofolio publik, dan nomor rekening perbankan.
   - `/admin/withdrawals`: Dasbor admin antrean verifikasi transfer dan histori pencairan dana dengan jejak audit.




---

### [2026-11-02] Fase 7 — Sengketa (Disputes), Pelaporan Kendala (Failures), dan Time Rules (Cron Idempoten)

1. **Sistem Sengketa Tugas (PRD §6.6 BR-D1 s.d. BR-D3):**
   - **BR-D1 (Pengajuan Sengketa Mahasiswa)**:
     - Mahasiswa dapat mengajukan sanggahan sengketa (`openDispute`) saat tugas berstatus `REJECTED` selama dalam jendela waktu 3 hari (`now <= disputeUntil`).
     - Alasan sanggahan wajib minimal 30 karakter, dan tautan bukti diverifikasi menggunakan whitelist domain terpercaya (`isValidDeliverableUrl`).
     - Status tugas beralih menjadi `DISPUTED` dan notifikasi in-app otomatis dikirim ke UMKM.
   - **BR-D2 (Keputusan Admin terhadap Sengketa)**:
     - Dikelola melalui antarmuka admin `/admin/disputes`.
     - Keputusan `ACCEPT_WORK`: status tugas beralih ke `ACCEPTED`, assignment `COMPLETED`, saldo `STUDENT_SHARE` diubah menjadi `PAYABLE`, poin reputasi normal diberikan (+10 poin base, bonus tanpa revisi, bonus ketepatan waktu), dan dicatat jejak audit `DISPUTE_RESOLVED_ACCEPT`.
     - Keputusan `UPHOLD_REJECTION`: status tugas dikunci final (`rejectionFinalAt = now`), ledger `VOIDED`, dan dicatat jejak audit `DISPUTE_RESOLVED_REJECT`.
   - **BR-D3 (Penguncian Final Tanpa Sengketa)**:
     - Jika melewati batas waktu `disputeUntil` tanpa adanya sengketa, tugas otomatis dikunci final oleh cron (`finalizeRejectionsPastDispute`) dan ledger di-`VOIDED`. Kuota tidak dipulihkan.

2. **Pelaporan Kendala & Kegagalan (PRD §6.6 BR-F1 s.d. BR-F2):**
   - **BR-F1 (Laporan Kendala UMKM)**:
     - UMKM dapat mengajukan laporan kendala (`reportFailureByUmkm`) jika tugas berstatus `IN_PROGRESS` atau `REVISION_REQUESTED` dan melewati batas waktu atau tidak ada progres mahasiswa. Alasan laporan minimal 30 karakter.
     - Mahasiswa diberi hak merespons (`respondToFailureByStudent`) dengan tanggapan minimal 10 karakter.
   - **BR-F2 (Keputusan Admin Laporan Kendala)**:
     - Keputusan `CONFIRMED`: assignment dinyatakan `FAILED`, mahasiswa menerima penalti reputasi -15 poin (dievaluasi terhadap penurunan level), entri ledger `VOIDED`, dan tugas di-reset kembali ke status `OPEN` dengan batas waktu `deadlineAt` baru setidaknya `now + minHours` agar dapat diklaim pelamar lain.
     - Keputusan `DISMISSED`: laporan ditutup dan pengerjaan tugas tetap berlanjut normal.

3. **Time Rules & Cron Runner Idempoten (PRD §13 & §18):**
   - Diimplementasikan di `src/features/platform/time-rules.ts` mencakup 8 tugas otomasi terjadwal yang sepenuhnya idempoten:
     1. `expireOpenJobsPastCutoff`: Tugas `OPEN` melewati batas klaim (`deadlineAt - minHours`) beralih ke `EXPIRED`, kuota langganan UMKM dipulihkan (+1) melalui `quotaUsed: { decrement: 1 }` dan dicatat di `quotaLedger`.
     2. `autoAcceptReviewPastSla`: Tugas `SUBMITTED` melewati SLA review UMKM 3 hari (`reviewDueAt < now`) otomatis diterima sistem (`ACCEPTED`, `autoAccepted = true`), saldo dilepas ke `PAYABLE`, dan poin reputasi dihitung normal.
     3. `finalizeRejectionsPastDispute`: Tugas `REJECTED` melewati jendela `disputeUntil` tanpa sengketa dikunci final (`rejectionFinalAt = now`) dan ledger di-`VOIDED`.
     4. `expireEndedSubscriptions`: Langganan UMKM melewati `endsAt` beralih ke `EXPIRED`.
     5. `sendUpcomingReminders`: Notifikasi pengingat otomatis dikirimkan ke mahasiswa ketika tenggat tugas tinggal 24 jam.
     6. `autoReleaseUnstartedClaimedJobs` (BR-C6): Tugas `CLAIMED` yang tidak dimulai (`startedAt = null`) dalam 24 jam pertama otomatis dibatalkan (`WITHDRAWN`), ledger di-`VOIDED`, dan tugas dibuka kembali ke `OPEN`.
     7. `autoDeclineExpiredDeadlineRequests`: Pengajuan perpanjangan tenggat waktu yang tidak direspons UMKM lebih dari 3 hari otomatis ditolak (`DECLINED`).
     8. `cleanupOrphanJobReferenceImages`: Berkas gambar referensi berumur >24 jam tanpa keterkaitan `jobId` otomatis dibersihkan dari database.
   - **Evaluasi Lazy (`evaluateJobTimeRules`)**: Dieksekusi otomatis ketika workspace tugas atau detail pekerjaan dibuka oleh pengguna, memastikan status selalu mutakhir tanpa harus menunggu jadwal cron.
   - **Endpoint Cron API (`/api/cron/tick`)**: Menerima request `GET` dan `POST` dengan pengamanan header `Authorization: Bearer <CRON_SECRET>` yang diverifikasi secara konstan-waktu (`crypto.timingSafeEqual`).
   - **Cadangan Penjadwalan**: Disediakan `vercel.json` untuk Vercel Cron harian dan `.github/workflows/cron.yml` untuk pemicu tiap jam via GitHub Actions.
