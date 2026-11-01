# KARTA — PRD Developer (Fondasi Vibe Coding)

**Versi:** 1.1 FINAL · **Tanggal:** 31 Okt 2026 · **Status:** Siap dibangun (MVP)
**Produk:** KARTA — Campus-Based Micro Job Marketplace (B2B2C) yang menghubungkan UMKM dengan mahasiswa kampus mitra
**Tujuan dokumen:** sumber kebenaran (*source of truth*) untuk membangun MVP bersama AI coding agent (Antigravity). Dokumen ini bukan dokumen lomba.

**Perubahan v1.1 dibanding v1.0:** (1) struktur folder berbasis fitur, satu aplikasi Next.js (modular monolith); (2) penyimpanan gambar dengan Vercel Blob; (3) penjadwalan cron via GitHub Actions + cadangan Vercel Cron + evaluasi *lazy*; (4) landing page dan login satu pintu; (5) harga paket diturunkan (tertinggi Rp 576.000); (6) lampiran setup terminal, env, dan checklist deploy; (7) Prisma 7, Next.js 16 (`proxy.ts`), dan Auth.js v5 disesuaikan.

---

## 0. Cara Memakai Dokumen Ini

Letakkan file ini di repo sebagai `docs/PRD.md`, lalu referensikan di setiap sesi agent. Kerjakan **satu fase per sesi** (lihat §18 Build Plan).

### 0.1 Aturan wajib untuk AI agent (salin ke file rules/instruksi proyek di Antigravity)

1. Baca `docs/PRD.md` sebelum menulis kode. Jangan menambah fitur di luar label **P0/P1**.
2. Semua aturan bisnis ada di `src/features/<fitur>/service.ts` (dan file domain di dalam folder fitur yang sama). Halaman (`app/`) dan komponen hanya memanggil `actions.ts` atau `queries.ts` milik fitur, tidak pernah memanggil Prisma langsung. Aturan dependensi lengkap ada di §4.3.
3. Setiap mutasi wajib: cek otorisasi (role + kepemilikan) → validasi Zod → eksekusi dalam transaksi bila menyentuh >1 tabel → audit log bila ditandai 🧾.
4. Uang selalu `Int` dalam rupiah. Tidak ada float untuk uang.
5. Waktu disimpan UTC di database, ditampilkan dalam `Asia/Jakarta`.
6. Teks UI dalam Bahasa Indonesia. Nama variabel, fungsi, tabel dalam Bahasa Inggris.
7. Bila PRD ambigu, pilih opsi paling sederhana dan catat di `docs/DECISIONS.md`. Jangan bertanya berulang-ulang.
8. Sebelum menyatakan selesai: `pnpm typecheck && pnpm lint && pnpm test` harus lulus.
9. Jangan menambah dependency besar tanpa alasan tertulis. Gunakan stack di §4.
10. Jangan menyimpan secret di kode. Semua lewat `.env` (sediakan `.env.example`).
11. Upload gambar hanya lewat client upload Vercel Blob (`@vercel/blob/client`) dengan token dari `/api/blob/upload`. Otorisasi, tujuan (`purpose`), tipe file, dan ukuran dicek di server sebelum token dibuat. Jangan pernah mengirim `BLOB_READ_WRITE_TOKEN` ke klien.
12. Hasil pekerjaan mahasiswa tetap berupa tautan eksternal. Jangan membuat fitur upload file kerja.
13. Aturan yang bergantung waktu (auto-accept, kedaluwarsa, penguncian penolakan) diimplementasikan sebagai fungsi idempoten di `features/platform/time-rules.ts` dan dipanggil oleh cron **dan** secara *lazy* saat data terkait dibuka (§13).

### 0.2 Legenda

| Label | Arti |
|---|---|
| **P0** | Wajib ada di MVP |
| **P1** | Dikerjakan setelah seluruh P0 stabil (spesifikasi sudah siap) |
| **OUT** | Sengaja tidak dibangun sekarang (lihat §19) |
| 🧾 | Wajib menulis `AuditLog` |

---

## 1. Ringkasan Produk

**Satu kalimat:** UMKM berlangganan paket bulanan untuk mempublikasikan pekerjaan mikro; mahasiswa dari kampus mitra mengambil dan mengerjakannya, lalu membangun penghasilan, portofolio, dan reputasi terverifikasi.

**Pengguna:** UMKM (client), Mahasiswa (worker), Admin (operator platform).

**Model bisnis:** Monthly Subscription + Job Quota + Job Allocation. Untuk pekerjaan berbayar, nilai alokasi dibagi **60% mahasiswa / 40% platform**. Paket gratis: 3 kuota/bulan, pekerjaan berlabel *Volunteer Project / Unpaid Project*, mahasiswa tetap mendapat poin.

**Platform:** Web app responsif (mobile-first) dengan landing page publik dan satu pintu login untuk tiga peran. Di-hosting di Vercel. Bukan aplikasi native.

**Non-goals MVP:** upload file hasil pekerjaan (hasil tetap lewat tautan eksternal), chat real-time, payment gateway otomatis, aplikasi native, matching ML, integrasi API kampus, email notification. *Pengecualian:* gambar pendukung (foto profil, logo UMKM, gambar referensi job) disimpan di Vercel Blob, lihat §6.9.

---

## 2. Keputusan Scope MVP

### 2.1 Tabel keputusan

| Area | Keputusan | Label | Alasan singkat |
|---|---|---|---|
| Landing page publik (hero, cara kerja, paket, dampak, FAQ) | Bangun | P0 | Pintu masuk dan bahan presentasi |
| Login Google OAuth satu pintu + onboarding peran | Bangun | P0 | Pintu masuk |
| Validasi kode referral kampus | Bangun | P0 | Gerbang kampus (inti B2B2C) |
| Opsi wajib email `.ac.id` | Toggle config, default mati | P1 | Penguat murah untuk kelemahan referral |
| Profil mahasiswa & UMKM | Bangun | P0 | |
| Paket, langganan, kuota | Bangun | P0 | Inti monetisasi |
| Pembayaran langganan | **Simulasi:** admin menekan "Tandai Sudah Bayar" | P0 | Keputusan tim; hindari kompleksitas gateway |
| Buat, simpan draft, publish job | Bangun | P0 | |
| **Acceptance Checklist** per job | Bangun | P0 | Pembeda utama (§3) |
| Job listing, detail, cari & filter | Bangun | P0 | |
| Ranking "Rekomendasi" | Rumus sederhana di TypeScript | P0 | Cukup untuk MVP |
| Claim first-come-first-served (atomic) | Bangun | P0 | |
| Batas pekerjaan aktif per level | Bangun | P0 | Cegah hoarding |
| Newcomer Lane (jendela klaim pemula) | Bangun | P1 | Pembeda SDG 10, mengatasi cold-start |
| Auto-release klaim yang tidak dimulai | Bangun | P1 | Anti "squatting" |
| Submit via URL eksternal + riwayat | Bangun | P0 | |
| Review: Accept / Request Revision / Reject | Bangun (revisi maks 2) | P0 | |
| Review SLA 3 hari → auto-accept | Bangun | P0 | Melindungi mahasiswa dari UMKM yang diam |
| Ubah deadline setelah klaim (butuh persetujuan mahasiswa) | Bangun | P0 | |
| Batalkan job, mundur sebelum mulai | Bangun | P0 | |
| Worker failure (lapor → admin putuskan) | Versi sederhana | P0 | |
| Sengketa | Versi sederhana (admin: terima karya / tegakkan penolakan) | P0 | |
| Ledger Reserved → Payable → Paid | Bangun | P0 | |
| Penarikan | Saldo penuh, minimal Rp50.000, admin tandai dibayar manual | P0 | |
| Poin, level, rating dua arah | Bangun | P0 | |
| Portofolio publik `/s/[username]` | Bangun | P0 | Pembeda (KARTA Score) |
| Notifikasi in-app (polling) | Bangun | P0 | Tanpa WebSocket, tanpa email |
| Dashboard admin (10 halaman ringkas) | Bangun | P0 | |
| Impact Dashboard (SDG 8 & 10) | Bangun | P0 | Bahan lomba + pembeda |
| Audit log | Bangun (tabel + helper) | P0 | |
| Upgrade paket di tengah periode | Tidak ada | OUT | Perpanjangan setelah/menjelang akhir periode saja |
| Foto profil mahasiswa & logo UMKM (Vercel Blob) | Bangun | P0 | Identitas visual, tampil di listing dan portofolio |
| Gambar referensi brief job (maks 3, Vercel Blob) | Bangun | P0 | Brief lebih jelas, mengurangi sengketa |
| Pembersihan gambar yatim (orphan) lewat cron | Bangun | P0 | Menjaga kuota penyimpanan |
| Halaman `/privacy` dan `/terms` | Bangun | P1 | Dibutuhkan saat verifikasi Google OAuth produksi |
| Chat, upload file hasil kerja, native app, ML, API kampus | Tidak ada | OUT | |

### 2.2 Penyederhanaan dibanding PRD kasar

- Satu langganan **berbayar** aktif per UMKM. Kuota gratis bulanan berjalan terpisah dan otomatis.
- Penarikan selalu seluruh saldo `PAYABLE` (tanpa nominal bebas, tanpa partial).
- Tidak ada approval admin sebelum publish. Admin dapat menyembunyikan atau membatalkan job setelahnya (moderasi *post-hoc*).
- Perubahan *scope* pekerjaan tidak punya fitur khusus. Brief awal dikunci setelah klaim, dan hanya deadline yang bisa berubah (dengan persetujuan).
- Rating UMKM terhadap mahasiswa memengaruhi poin; rating mahasiswa terhadap UMKM hanya ditampilkan.

---

## 3. Pembeda KARTA (Differentiators)

Marketplace freelance umum (mis. Fastwork, Sribulancer, Upwork, Fiverr) bersifat terbuka, berbasis tawar-menawar, dan reputasi dibangun dari nol di tiap platform. KARTA berbeda di enam hal. Setiap pembeda **dipetakan ke fitur konkret** agar tidak berhenti sebagai slogan.

| # | Pembeda | Wujud di produk | Modul |
|---|---|---|---|
| D1 | **Jaringan tertutup berbasis kampus** | Akses mahasiswa hanya lewat kode referral kampus mitra; kampus terhubung ke setiap akun | Auth, Admin |
| D2 | **Harga tetap per paket, tanpa tawar-menawar** | UMKM tidak menentukan harga; imbalan mengikuti alokasi paket. Tidak ada bidding sehingga tidak ada perang harga | Subscription, Job |
| D3 | **Acceptance Checklist** | UMKM wajib menulis 1–7 kriteria penerimaan saat publish. Mahasiswa mencentang sebelum submit. UMKM menilai kriteria satu per satu. *Reject* dan *Request Revision* wajib menunjuk kriteria yang belum terpenuhi. Hasilnya penolakan lebih objektif dan sengketa lebih jarang | Job, Review |
| D4 | **KARTA Score + portofolio terverifikasi** | Halaman publik `/s/[username]` berisi level, poin, rating, dan daftar pekerjaan yang diterima UMKM (bukan klaim sepihak) | Reward |
| D5 | **Perlindungan kerja yang adil** | Revisi maks 2×, deadline minimum per kategori, review SLA dengan auto-accept, jendela sengketa, label Volunteer wajib + batas 1 pekerjaan unpaid aktif | Execution |
| D6 | **Impact Dashboard** | Penghasilan tersalurkan, UMKM terbantu, sebaran provinsi, dan "pekerjaan pertama pemula", berguna untuk narasi SDG 8 & 10 | Admin, Landing |

**Fitur inklusi (SDG 10):** *Newcomer Lane* (P1): UMKM dapat menandai job "Cocok untuk pemula". Selama N menit pertama setelah publish, hanya mahasiswa level rendah yang boleh klaim. Dengan begitu mahasiswa baru atau dengan koneksi lambat tetap punya kesempatan mendapat pekerjaan pertama.

---

## 4. Tech Stack & Arsitektur

| Lapisan | Pilihan |
|---|---|
| Runtime & package manager | Node.js ≥ 20.19, **pnpm** |
| Framework | Next.js 16 (App Router) + React 19 + **TypeScript strict** |
| Arsitektur | **Satu aplikasi Next.js (modular monolith)**: frontend dan backend dalam satu repo dan satu deployment. Batas antar modul dijaga lewat struktur berbasis fitur (§4.1) dan aturan dependensi (§4.3). Tidak ada repo atau project terpisah untuk backend |
| Database | PostgreSQL + **Prisma ORM 7** (driver adapter `@prisma/adapter-pg`, config di `prisma.config.ts`). Host produksi: Neon (via Vercel Marketplace) |
| Penyimpanan gambar | **Vercel Blob** (store **Public**), paket `@vercel/blob`, client upload via `handleUpload` |
| Kompresi gambar (klien) | `browser-image-compression` (target ≤ 1 MB, WebP bila didukung) |
| Auth | Auth.js v5 (`next-auth@beta`) provider Google + `@auth/prisma-adapter`, **session strategy `jwt`**, konfigurasi dipecah `auth.config.ts` (aman untuk proxy) dan `auth.ts` (+ adapter) |
| UI | Tailwind CSS + shadcn/ui + lucide-react |
| Validasi & form | Zod + React Hook Form |
| Data fetching klien | TanStack Query (hanya untuk polling notifikasi dan list interaktif) |
| Mutasi | **Server Actions** memanggil service. Route handler hanya untuk `/api/auth/*`, `/api/cron/tick`, `/api/blob/upload` |
| Tanggal | date-fns + date-fns-tz (`Asia/Jakarta`) |
| Test | Vitest (unit/service), Playwright (P1, happy path) |
| Hosting | **Vercel** (Hobby selama masa lomba/prototipe; Pro bila dijalankan komersial, lihat §4.7) |
| Penjadwalan | GitHub Actions tiap jam memanggil `/api/cron/tick`, Vercel Cron harian sebagai cadangan, plus evaluasi *lazy* (§13) |
| Version control | Git + GitHub, satu branch per fase (§18) |

### 4.1 Struktur folder (berbasis fitur)

```
karta/
├─ prisma/                       # schema.prisma, migrations/, seed.ts
├─ docs/                         # PRD.md, DECISIONS.md
├─ tests/                        # setup.ts, mocks/, *.test.ts
├─ .github/workflows/cron.yml    # pemicu cron tiap jam (Lampiran D)
├─ vercel.json                   # cron harian cadangan
├─ prisma.config.ts · next.config.ts · vitest.config.ts
└─ src/
   ├─ app/                       # HANYA routing + merangkai halaman (tipis)
   │  ├─ (marketing)/            # landing `/`, `/s/[username]`, `/privacy`, `/terms`
   │  ├─ (auth)/                 # `/login`, `/onboarding/*`, `/suspended`
   │  ├─ (student)/student/…     # dashboard, jobs, my-jobs, earnings, profile, notifications
   │  ├─ (umkm)/umkm/…           # dashboard, jobs, subscription, profile, notifications
   │  ├─ (admin)/admin/…         # users, campuses, referrals, packages, subscriptions, jobs,
   │  │                          # ledger, withdrawals, disputes, failure-reports, points,
   │  │                          # config, audit, impact
   │  └─ api/
   │     ├─ auth/[...nextauth]/route.ts
   │     ├─ cron/tick/route.ts
   │     └─ blob/upload/route.ts
   ├─ features/                  # satu folder = satu domain bisnis (§4.2)
   │  ├─ auth/  campus/  subscription/  jobs/  submissions/  wallet/
   │  ├─ reputation/  disputes/  notifications/  images/  platform/  admin/
   │  │    isi tiap fitur:  service.ts · actions.ts · queries.ts · schemas.ts
   │  │                     components/ · index.ts   (+ file domain khusus)
   ├─ components/
   │  ├─ ui/                     # shadcn (hasil `shadcn add`, jangan diedit sembarangan)
   │  └─ layout/                 # shell per peran, navbar, sidebar, footer
   ├─ lib/                       # format.ts, url.ts, constants.ts, db.ts, utils.ts
   ├─ generated/prisma/          # hasil `prisma generate` (tidak di-commit)
   ├─ auth.config.ts · auth.ts   # Auth.js (pecahan edge-safe dan penuh)
   └─ proxy.ts                   # pengganti middleware.ts di Next.js 16
```

### 4.2 Peta fitur → tanggung jawab

| Fitur | Tanggung jawab | File domain khusus |
|---|---|---|
| `auth` | Onboarding, penebusan referral, profil mahasiswa/UMKM, guard otorisasi | `guards.ts`, `referral.ts` |
| `campus` | CRUD kampus, pembuatan dan pengelolaan kode referral (admin) | |
| `subscription` | Paket, langganan, kuota gratis bulanan, `QuotaLedger` | `quota.ts` |
| `jobs` | Draft, publish, edit, batal, perubahan deadline, discovery, klaim | `state-machine.ts`, `claim.ts`, `ranking.ts`, `deadline.ts` |
| `submissions` | Mulai kerja, submit, review, revisi | `review.ts` |
| `wallet` | Ledger Reserved/Payable/Paid, saldo, penarikan | `ledger.ts`, `withdrawal.ts` |
| `reputation` | Poin, level, rating, portofolio publik | `points.ts`, `rating.ts` |
| `disputes` | Sengketa dan laporan kegagalan | |
| `notifications` | Pembuatan notifikasi, daftar, tandai dibaca | |
| `images` | Otorisasi unggah, pencatatan `ImageAsset`, hapus blob, `ImageUploader` | |
| `platform` | `PlatformConfig`, `AuditLog`, `time-rules`, runner cron, Impact Dashboard | `config.ts`, `audit.ts`, `time-rules.ts`, `cron.ts`, `impact.ts` |
| `admin` | Halaman dan query khusus admin yang merangkai fitur lain (user, moderasi job) | |

### 4.3 Aturan dependensi (wajib)

1. `app/` tipis: tanpa logika bisnis dan tanpa memanggil Prisma langsung. Halaman memanggil `queries.ts` atau `actions.ts` milik fitur.
2. `service.ts` berisi aturan bisnis dan akses Prisma, diawali `import "server-only"`.
3. `actions.ts` (`"use server"`): guard → parse Zod → panggil service → `revalidatePath`. Mengembalikan `Result<T>` (§12).
4. `queries.ts`: pembacaan data untuk Server Components. Tidak memutasi data.
5. Komponen khusus fitur ada di `features/<x>/components/`. `src/components/ui` hanya shadcn; `src/components/layout` hanya kerangka halaman.
6. Antar fitur hanya boleh mengimpor lewat `features/<y>/index.ts` (API publik fitur). Dilarang mengimpor `service.ts` fitur lain secara langsung dari luar fiturnya, kecuali lewat `index.ts`.
7. `lib/` tidak boleh mengimpor dari `features/`.
8. Komponen klien (`"use client"`) tidak boleh mengimpor `service.ts`, `queries.ts`, atau `lib/db.ts`.
9. (P1) Tambahkan aturan ESLint `no-restricted-imports` untuk menegakkan butir 1, 6, 7, dan 8.

### 4.4 Setup lokal

Urutan setup dikerjakan manual oleh developer (bukan oleh agent), langkah lengkapnya ada di **Lampiran A**. Fase 0 (§18) selesai bila Lampiran A sudah dikerjakan dan `pnpm dev` berjalan.

### 4.5 Konfigurasi Prisma 7 (acuan)

```ts
// prisma.config.ts : dipakai CLI (migrate, seed). Pakai koneksi DIRECT.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: { url: env("DIRECT_URL") },
});
```

```ts
// src/lib/db.ts : dipakai aplikasi saat runtime. Pakai koneksi POOLED.
import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL!, max: 5 }),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

`DATABASE_URL` = connection string *pooled* (runtime), `DIRECT_URL` = connection string *direct* (migrasi). Saat development lokal keduanya boleh sama.

### 4.6 Konfigurasi Vercel Blob (acuan)

`next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // avatar Google
    ],
  },
};

export default nextConfig;
```

`src/app/api/blob/upload/route.ts` (kerangka acuan; cek dokumentasi `@vercel/blob` bila signature berbeda):

```ts
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/features/auth";
import { assertCanUploadImage } from "@/features/images";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = await requireUser();                          // 1. login & ACTIVE
        const { purpose, jobId } = JSON.parse(clientPayload ?? "{}");
        await assertCanUploadImage({ user, purpose, jobId, pathname }); // 2. aturan BR-I
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: 2 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: user.id, purpose, jobId }),
        };
      },
      // Pencatatan ke database lewat Server Action `attachImage`, bukan di sini,
      // karena callback ini butuh URL publik dan biasanya tidak terpanggil di localhost.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
```

Sisi klien (`ImageUploader`): kompres gambar → `upload(pathname, file, { access: "public", handleUploadUrl: "/api/blob/upload", clientPayload: JSON.stringify({ purpose, jobId }) })` → panggil Server Action `attachImage({ purpose, url, pathname, jobId })`.

`attachImage` wajib: cek ulang otorisasi, pastikan `pathname` berawalan `karta/{purpose}/{userId}/`, verifikasi file ada dengan `head(url)` (tipe dan ukuran sesuai batas), simpan `ImageAsset`, dan untuk AVATAR/LOGO hapus blob lama dengan `del()`.

### 4.7 Deploy & environment (Vercel)

- **Plan:** Hobby hanya untuk penggunaan personal non-komersial. Cukup untuk prototipe dan lomba. Bila KARTA dijalankan dengan UMKM yang membayar langganan, pindah ke Pro.
- **Database produksi:** Neon (Postgres) lewat Marketplace Vercel. Gunakan connection string pooled untuk `DATABASE_URL` dan direct untuk `DIRECT_URL`.
- **Blob:** dua store terpisah, mis. `karta-images-dev` dan `karta-images-prod`, masing-masing bertipe **Public**. Mode akses tidak dapat diubah setelah store dibuat.
- **Google OAuth produksi:** tambahkan `https://<domain>/api/auth/callback/google` ke Authorized redirect URI. Untuk lolos verifikasi consent screen, sediakan halaman `/privacy` dan `/terms`.
- **Cron:** lihat §13 dan Lampiran D.
- **Variabel lingkungan:** daftar lengkap di Lampiran B. Isi di Vercel → Project → Settings → Environment Variables untuk Production dan Preview.

### 4.8 Prinsip arsitektur

- **Service murni** (tanpa import React/Next di dalam logika domain). Mudah diuji dan aman dari logika yang tersebar di UI.
- **Satu pintu transisi status job:** semua perubahan `Job.status` lewat `features/jobs/state-machine.ts` (`transition()`), yang menolak transisi ilegal (§7).
- **Snapshot nilai uang** di `Job` saat publish. Perubahan harga paket tidak memengaruhi job yang sudah terbit.
- **Konfigurasi di database** (`PlatformConfig`, `DeadlineRule`, `Package`) agar angka bisa diubah admin tanpa deploy.
- **Batas yang bisa dipecah kelak:** karena logika ada di `service.ts` per fitur, sebuah fitur dapat diangkat ke layanan terpisah tanpa menulis ulang bila suatu hari dibutuhkan.

---

## 5. Peran & Hak Akses

Peran: `STUDENT`, `UMKM`, `ADMIN`. Admin ditentukan oleh env `ADMIN_EMAILS` (daftar email dipisah koma) saat sign-in. Pengguna lain memilih `STUDENT` atau `UMKM` di onboarding (tidak bisa diubah sendiri setelahnya).

| Aksi | STUDENT | UMKM | ADMIN |
|---|:-:|:-:|:-:|
| Lihat job OPEN | ✅ (yang kampusnya aktif) | ✅ miliknya | ✅ semua |
| Buat/publish job | ❌ | ✅ | ❌ |
| Klaim job | ✅ | ❌ | ❌ |
| Submit hasil | ✅ (assignment miliknya) | ❌ | ❌ |
| Review hasil | ❌ | ✅ (job miliknya) | ❌ |
| Ajukan sengketa | ✅ (job ditolak miliknya) | ❌ | ❌ |
| Lapor kegagalan mahasiswa | ❌ | ✅ | ❌ |
| Putuskan sengketa/kegagalan | ❌ | ❌ | ✅ 🧾 |
| Kelola kampus, referral, paket, config | ❌ | ❌ | ✅ 🧾 |
| Tandai langganan lunas, tandai penarikan dibayar | ❌ | ❌ | ✅ 🧾 |
| Lihat portofolio publik | ✅ publik | ✅ publik | ✅ |

**Guard wajib** (`src/features/auth/guards.ts`, diekspor lewat `features/auth/index.ts`):
`requireUser()`, `requireRole(role)`, `requireStudentWithCampus()`, `requireOwnedJob(jobId)`, `requireOwnedAssignment(assignmentId)`. Pengguna `SUSPENDED` ditolak di semua guard.

---

## 6. Aturan Bisnis (Business Rules)

Semua angka bertanda ⚙️ disimpan di `PlatformConfig` (bisa diubah admin). Nilai di sini adalah **default seed**.

### 6.1 Auth & Verifikasi

- **BR-A1** Login hanya via Google OAuth. Login pertama → `/onboarding` untuk memilih peran.
- **BR-A2** Mahasiswa wajib menebus kode referral valid sebelum mengakses fitur mahasiswa. Profil mahasiswa baru dibuat **bersamaan** dengan penebusan kode (kampus terhubung saat itu juga).
- **BR-A3** Kode valid bila: `isActive` ∧ (`expiresAt` null atau belum lewat) ∧ (`maxUses` null atau `usedCount < maxUses`) ∧ kampus `isActive`. Default `maxUses = null` (tak terbatas). Penebusan memakai transaksi: naikkan `usedCount` + buat `ReferralRedemption` (unik per user).
- **BR-A4** Kode referral dinormalisasi `trim().toUpperCase()`. Kegagalan input kode dibatasi 5 kali per 15 menit per user.
- **BR-A5** ⚙️ `requireCampusEmail` (default `false`): bila `true`, email Google harus berakhiran `.ac.id`. Selain itu, `User.isCampusEmail` selalu diisi agar admin bisa melihatnya.
- **BR-A6** Mahasiswa yang belum punya kode melihat halaman bantuan: hubungi bagian kemahasiswaan, ketua program studi, bagian IT, atau koordinator kerja sama kampus.
- **BR-A7** Mahasiswa memilih ≥1 `JobRole`. Mahasiswa hanya boleh klaim job dengan role yang ada di profilnya.

### 6.2 Paket, Langganan, Kuota

- **BR-S1** Setiap UMKM mendapat **kuota gratis bulanan**: 3 job per bulan kalender (zona `Asia/Jakarta`). Dibuat *lazy*: saat UMKM membuka dashboard/publish dan belum ada langganan `FREE` untuk `periodKey` bulan itu (`"2026-11"`), sistem membuatnya `ACTIVE` dengan `quotaTotal = 3`. Job dari paket gratis `isPaid = false`.
- **BR-S2** Langganan berbayar dibuat `PENDING_PAYMENT`. Admin menekan **Tandai Sudah Bayar** 🧾 → `ACTIVE`, `startsAt = now`, `endsAt = now + durationDays` (30). Kuota = `Package.jobQuota`.
- **BR-S3** Maksimal satu langganan berbayar `ACTIVE` per UMKM. Perpanjangan boleh dibuat bila langganan aktif berakhir ≤ 7 hari lagi (`startsAt` baru = `endsAt` lama). Upgrade di tengah periode: OUT.
- **BR-S4** Kuota berkurang **saat publish**, bukan saat draft. Satu catatan `QuotaLedger` (`delta = -1`) per publish.
- **BR-S5** Kuota **dipulihkan** (`delta = +1`) hanya pada: (a) job `OPEN` dibatalkan UMKM, (b) job `EXPIRED` tanpa pengambil, (c) job `CLAIMED` (belum mulai) dibatalkan UMKM, (d) pembatalan setelah kegagalan mahasiswa terkonfirmasi admin, (e) admin membatalkan job dengan opsi `restoreQuota`. Pekerjaan yang sudah selesai tidak mengembalikan kuota.
- **BR-S6** Kuota tak terpakai hangus di akhir periode. Job aktif tetap berjalan walau langganan berakhir.
- **BR-S7** Publish butuh: langganan terpilih `ACTIVE`, `endsAt > now`, sisa kuota > 0. Pada form publish UMKM memilih sumber kuota ("Gratis — 2 tersisa" atau "Paket Basic — 4 tersisa").

### 6.3 Job

- **BR-J1** Field wajib: judul (5–120), deskripsi, instruksi pengerjaan, `role`, deadline, tujuan pengumpulan (tipe tautan: Drive/Docs/Figma/GitHub/Canva/Notion/lainnya), **1–7 acceptance criteria**.
- **BR-J2** Saat publish, sistem menyimpan snapshot: `isPaid`, `allocationIdr`, `studentShareIdr = floor(allocationIdr * ⚙️60 / 100)`, `platformShareIdr = allocationIdr - studentShareIdr`, `packageTier`, `subscriptionId`. UMKM **tidak** mengatur nominal.
- **BR-J3** **Deadline minimum:** `deadlineAt ≥ publishedAt + minHours(role, tier)` dari tabel `DeadlineRule` (§15). Tier `FREE` memakai nilai `BASIC`. Validasi di service saat publish dan saat UMKM mengubah deadline job `OPEN`.
- **BR-J4** Edit: `DRAFT` bebas. `OPEN` boleh edit judul/deskripsi/instruksi/checklist/deadline (role, paket, alokasi terkunci). Setelah `CLAIMED`, konten terkunci; hanya deadline yang bisa diubah lewat permintaan yang **wajib disetujui mahasiswa** (`DeadlineChangeRequest`).
- **BR-J5** **Batas klaim:** job tidak bisa diklaim bila `now > deadlineAt - minHours(role, tier)`. Cron menandai job `OPEN` yang melewati batas ini sebagai `EXPIRED` dan memulihkan kuota.
- **BR-J6** Job gratis wajib berlabel **Volunteer Project / Unpaid Project** di: listing, detail, modal konfirmasi klaim, My Jobs, dan kartu portofolio.
- **BR-J7** Tautan hasil harus `https://`, host ada di whitelist ⚙️ (`drive.google.com`, `docs.google.com`, `figma.com`, `github.com`, `canva.com`, `notion.so`, `notion.site`, `youtube.com`, `youtu.be`, `behance.net`, `dribbble.com`), panjang ≤ 2048, tanpa kredensial di URL.
- **BR-J8** Admin dapat menyembunyikan job (`isHidden`) atau membatalkannya dengan alasan 🧾.
- **BR-J9** (informasional) Form job menampilkan panduan ruang lingkup sesuai paket: Basic ≤ 1 jam, Professional ≤ 2 jam, Premium ≤ 4 jam pengerjaan. Tidak ditegakkan sistem pada MVP; tujuannya menjaga imbalan tetap wajar untuk tugas mikro.

### 6.4 Klaim

- **BR-C1** Syarat klaim (semua harus benar): user `ACTIVE`; punya `StudentProfile`; `job.role ∈ student.roles`; `student.level ≥ job.minLevel`; jumlah assignment `ACTIVE` < batas level; bila job gratis → assignment gratis aktif = 0 (**maks 1 unpaid aktif**); job `OPEN`, tidak `isHidden`, belum lewat batas klaim; lolos Newcomer Lane (P1).
- **BR-C2** Klaim **atomic**: `updateMany({ where: { id, status: 'OPEN' }, data: { status: 'CLAIMED' } })`; bila `count !== 1` → tolak "Pekerjaan sudah diambil". Dalam transaksi yang sama: buat `JobAssignment(ACTIVE)` dan, untuk job berbayar, buat `LedgerEntry` `RESERVED`. Partial unique index database menjamin satu assignment `ACTIVE` per job (§9).
- **BR-C3** Job gratis menampilkan modal konfirmasi "Pekerjaan ini tidak dibayar. Kamu akan mendapat poin." dan klaim hanya sah setelah dicentang.
- **BR-C4** Batas pekerjaan aktif per level (⚙️): `NEWCOMER 1`, `RELIABLE 2`, `TRUSTED 3`, `EXPERT 4`. "Aktif" = assignment `ACTIVE` (status job `CLAIMED`/`IN_PROGRESS`/`SUBMITTED`/`REVISION_REQUESTED`).
- **BR-C5 (P1) Newcomer Lane:** bila `job.beginnerFriendly`, `newcomerLaneUntil = publishedAt + ⚙️30 menit`. Sebelum waktu itu, hanya `level ∈ {NEWCOMER, RELIABLE}` yang boleh klaim. Setelah itu terbuka untuk semua.
- **BR-C6 (P1) Auto-release:** job `CLAIMED` yang tidak di-*Start* dalam ⚙️24 jam → assignment `WITHDRAWN` (alasan sistem), job kembali `OPEN`, ledger `VOIDED`, tanpa penalti poin.

### 6.5 Eksekusi, Review, Revisi

- **BR-E1** Mahasiswa menekan **Mulai Kerjakan** → `IN_PROGRESS`, mengisi `startedAt`.
- **BR-E2** **Submit** membuat `Submission` bernomor (1, 2, 3, ...) berisi URL, catatan, hasil self-check checklist; `isLate = now > deadlineAt`. Status → `SUBMITTED`, `reviewDueAt = now + ⚙️3 hari`.
- **BR-E3** **Review:** UMKM menilai tiap kriteria (`met: true/false` + komentar opsional) lalu memilih:
  - **Accept** → `ACCEPTED` (kriteria boleh sebagian belum terpenuhi bila UMKM tetap menerima).
  - **Request Revision** → hanya bila `revisionCount < 2` dan ada ≥1 kriteria `met=false` atau catatan. `revisionCount++`, status `REVISION_REQUESTED`, `revisionDueAt = now + ⚙️3 hari`.
  - **Reject** → wajib alasan (≥20 karakter) dan ≥1 kriteria `met=false`. Status `REJECTED`, `disputeUntil = now + ⚙️3 hari`, ledger → `HELD`.
- **BR-E4** Setelah revisi ke-2 diminta dan mahasiswa submit ulang (submission #3), UMKM hanya boleh **Accept** atau **Reject**.
- **BR-E5** **Auto-accept:** bila `SUBMITTED` dan `now > reviewDueAt`, cron menetapkan `ACCEPTED` (flag `autoAccepted = true`). Poin dihitung normal, tanpa bonus rating.
- **BR-E6** **Mundur sebelum mulai:** mahasiswa (status `CLAIMED`) boleh mundur dengan alasan → assignment `WITHDRAWN`, job `OPEN`, ledger `VOIDED`, tanpa penalti.
- **BR-E7** **Batal oleh UMKM:** `OPEN` atau `CLAIMED` boleh; setelah `IN_PROGRESS`, UMKM harus memakai **Lapor Masalah** (BR-F1).
- **BR-E8** Keterlambatan: submit setelah deadline tetap diterima (ditandai `isLate`), sampai UMKM melapor kegagalan. Submit terlambat tidak mendapat bonus tepat waktu.

### 6.6 Kegagalan & Sengketa

- **BR-F1** UMKM dapat membuat `FailureReport` bila job `IN_PROGRESS`/`REVISION_REQUESTED` dan (`now > deadlineAt + ⚙️12 jam`) **atau** tidak ada progres yang jelas (alasan wajib, ≥30 karakter). Mahasiswa diberi notifikasi dan dapat membalas via catatan tunggal (`studentResponse`).
- **BR-F2** Admin memutuskan 🧾:
  - `CONFIRMED` → assignment `FAILED`, mahasiswa −15 poin, ledger `VOIDED`, job kembali `OPEN` dengan `deadlineAt = max(deadlineAt lama, now + minHours)`; UMKM dinotifikasi dan boleh memperpanjang. Bila UMKM memilih membatalkan, kuota dipulihkan (BR-S5d).
  - `DISMISSED` → job lanjut seperti biasa.
- **BR-D1** Mahasiswa dapat membuka **sengketa** pada job `REJECTED` sebelum `disputeUntil` (alasan ≥30 karakter, boleh melampirkan tautan bukti). Status → `DISPUTED`, ledger tetap `HELD`.
- **BR-D2** Admin memutuskan 🧾: `ACCEPT_WORK` → `ACCEPTED` (alur selesai normal) atau `UPHOLD_REJECTION` → `REJECTED` final, ledger `VOIDED`.
- **BR-D3** Penolakan tanpa sengketa: setelah `disputeUntil`, cron mengunci final (`rejectionFinalAt`), ledger `VOIDED`. Kuota tidak dipulihkan; UMKM dapat menduplikasi job (menggunakan kuota baru).

### 6.7 Poin, Level, Rating

**Poin (⚙️ default):**

| Kejadian | Poin |
|---|---|
| Job diterima (berbayar maupun gratis) | **+10** |
| Diterima tanpa revisi | +3 |
| Submit pertama sebelum deadline | +2 |
| UMKM memberi rating ≥ 4 | +2 |
| Kegagalan terkonfirmasi admin | −15 |
| Penyesuaian manual admin | ± (alasan wajib) 🧾 |

Poin tidak pernah di bawah 0. Pengurangan hanya untuk pelanggaran **terkonfirmasi** (admin).

**Level (⚙️):**

| Level | Poin | Maks job aktif |
|---|---|---|
| NEWCOMER | 0–49 | 1 |
| RELIABLE | 50–149 | 2 |
| TRUSTED | 150–299 | 3 |
| EXPERT | ≥ 300 | 4 |

**Rating:**
- UMKM → mahasiswa: 1–5 bintang + komentar, dalam 14 hari setelah `ACCEPTED`. Memperbarui `ratingAvg`.
- Mahasiswa → UMKM: 4 dimensi (kejelasan instruksi, komunikasi, profesionalisme, ketepatan review), masing-masing 1–5.
- Satu rating per arah per job.

### 6.8 Penarikan

- **BR-W1** Saldo tersedia = jumlah `LedgerEntry(STUDENT_SHARE, PAYABLE, withdrawalId = null)`.
- **BR-W2** Mahasiswa mengisi data bank sekali di profil (nama bank, nama pemilik, nomor rekening). Nomor rekening hanya tampil ter-mask (`•••• 1234`) kecuali bagi admin.
- **BR-W3** Pengajuan = **seluruh saldo tersedia**, minimal ⚙️Rp50.000. Entri terkait diberi `withdrawalId`; satu penarikan `REQUESTED` pada satu waktu.
- **BR-W4** Admin **Tandai Dibayar** 🧾 → entri `PAID`, `Withdrawal.status = PAID`. Admin **Tolak** (wajib alasan) 🧾 → `withdrawalId` dilepas, saldo kembali tersedia.

### 6.9 Gambar (Vercel Blob)

- **BR-I1** Jenis gambar yang diizinkan: `AVATAR` (1 per mahasiswa), `UMKM_LOGO` (1 per UMKM), `JOB_REFERENCE` (maks ⚙️3 per job). Tujuan lain ditolak.
- **BR-I2** Format hanya `image/jpeg`, `image/png`, `image/webp`. **SVG dilarang** (risiko XSS). Ukuran maks ⚙️2 MB per file (klien mengompres dulu ke ≤ 1 MB bila bisa).
- **BR-I3** Otorisasi unggah: `AVATAR` hanya STUDENT pemilik profil; `UMKM_LOGO` hanya UMKM pemilik profil; `JOB_REFERENCE` hanya UMKM pemilik job berstatus `DRAFT` atau `OPEN`. Setelah job `CLAIMED`, gambar terkunci (selaras BR-J4).
- **BR-I4** Pathname wajib berformat `karta/{purpose}/{userId}/{nama}`; server menolak token bila tidak sesuai. Blob menambahkan suffix acak pada nama akhir.
- **BR-I5** Mengganti `AVATAR`/`UMKM_LOGO`: blob lama dihapus (`del`) dalam proses yang sama. Menghapus job `DRAFT` atau membatalkan job `OPEN` tanpa pengambil: gambar `JOB_REFERENCE` ikut dihapus.
- **BR-I6** Batas laju: maks ⚙️10 unggahan per jam per pengguna.
- **BR-I7** Gambar **bukan** bukti kerja. Hasil pekerjaan, bukti sengketa, dan portofolio tetap berupa tautan eksternal (BR-J7). Jangan menyimpan dokumen sensitif (KTP, rekening, bukti transfer) di store Public.

---

## 7. State Machine Job

Status: `DRAFT`, `OPEN`, `CLAIMED`, `IN_PROGRESS`, `SUBMITTED`, `REVISION_REQUESTED`, `ACCEPTED`, `REJECTED`, `DISPUTED`, `CANCELLED`, `EXPIRED`.

| Dari → Ke | Aktor | Pemicu | Efek samping |
|---|---|---|---|
| DRAFT → OPEN | UMKM | Publish | Validasi BR-J1/J3/S7; kuota −1; snapshot uang; notifikasi |
| OPEN → CLAIMED | Mahasiswa | Take Job | Assignment ACTIVE; ledger RESERVED (jika berbayar) |
| OPEN → CANCELLED | UMKM | Batalkan | Kuota +1 |
| OPEN → EXPIRED | Sistem | Lewat batas klaim | Kuota +1 |
| CLAIMED → IN_PROGRESS | Mahasiswa | Mulai | `startedAt` |
| CLAIMED → OPEN | Mahasiswa/Sistem | Mundur / auto-release | Assignment WITHDRAWN; ledger VOIDED |
| CLAIMED → CANCELLED | UMKM | Batalkan sebelum mulai | Kuota +1; ledger VOIDED; assignment WITHDRAWN |
| IN_PROGRESS → SUBMITTED | Mahasiswa | Submit | Submission baru; `reviewDueAt` |
| REVISION_REQUESTED → SUBMITTED | Mahasiswa | Submit ulang | Submission baru; `reviewDueAt` |
| SUBMITTED → ACCEPTED | UMKM / Sistem | Accept / SLA lewat | Ledger PAYABLE; poin; assignment COMPLETED |
| SUBMITTED → REVISION_REQUESTED | UMKM | Request Revision | `revisionCount++`; `revisionDueAt` |
| SUBMITTED → REJECTED | UMKM | Reject | Ledger HELD; `disputeUntil` |
| REJECTED → DISPUTED | Mahasiswa | Ajukan sengketa | Dispute OPEN |
| DISPUTED → ACCEPTED | Admin | ACCEPT_WORK | Seperti Accept |
| DISPUTED → REJECTED | Admin | UPHOLD_REJECTION | Ledger VOIDED; `rejectionFinalAt` |
| REJECTED (final) | Sistem | `disputeUntil` lewat | Ledger VOIDED; `rejectionFinalAt` |
| IN_PROGRESS/REVISION_REQUESTED → OPEN | Admin | FailureReport CONFIRMED | Assignment FAILED; −15 poin; ledger VOIDED |
| (aktif) → CANCELLED | Admin | Moderasi | Ledger VOIDED; kuota +1 bila `restoreQuota` |

Terminal: `ACCEPTED`, `REJECTED` (final), `CANCELLED`, `EXPIRED`. `jobStateMachine.transition(job, to, actor)` wajib melempar error untuk transisi di luar tabel ini, dan wajib diuji unit.

---

## 8. Uang & Ledger

**Prinsip:** KARTA mencatat alokasi sebagai **buku besar internal**. Pembayaran nyata (UMKM → platform, platform → mahasiswa) dilakukan manual di luar aplikasi pada MVP. Status internal dan status pembayaran aktual dipisah.

### 8.1 Entri ledger

Untuk setiap klaim job berbayar dibuat dua entri (satu `assignmentId`):

| Tipe | Jumlah | Penerima |
|---|---|---|
| `STUDENT_SHARE` | `job.studentShareIdr` | mahasiswa |
| `PLATFORM_FEE` | `job.platformShareIdr` | platform |

Job gratis (`isPaid = false`) tidak membuat entri ledger sama sekali.

### 8.2 Transisi status

```
STUDENT_SHARE:  RESERVED ──(Accept)──► PAYABLE ──(Admin tandai dibayar)──► PAID
                   │                      ▲
                   ├─(Reject)─► HELD ─────┘ (sengketa dimenangkan mahasiswa: ACCEPT_WORK)
                   │             └──(final reject / failure / withdraw / cancel)──► VOIDED
PLATFORM_FEE:   RESERVED ──(Accept)──► RECOGNIZED      (VOIDED pada kasus yang sama)
```

### 8.3 Tampilan saldo mahasiswa

| Label | Rumus |
|---|---|
| Dicadangkan | `RESERVED` |
| Ditahan | `HELD` |
| Dapat ditarik | `PAYABLE` dan `withdrawalId = null` |
| Dalam proses penarikan | `PAYABLE` dan `withdrawalId` terisi (status `REQUESTED`) |
| Sudah dibayar | `PAID` |

Semua transisi lewat `features/wallet/ledger.ts` dalam transaksi database. Tidak ada update status ledger dari luar service tersebut.

---

## 9. Data Model (Prisma)

Skema berikut adalah acuan dan **sudah lengkap**, termasuk model Auth.js (`Account`, `Session`, `VerificationToken`) dan `ImageAsset`. Ditulis untuk **Prisma 7** (generator `prisma-client`, URL di `prisma.config.ts`, driver adapter `@prisma/adapter-pg`).

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"   // Prisma 7: output wajib
}

datasource db {
  provider = "postgresql"
  // Prisma 7: URL TIDAK ditulis di sini. Ada di prisma.config.ts (lihat §4.5)
}

// ───────── Enums ─────────
enum Role                 { STUDENT UMKM ADMIN }
enum UserStatus           { ACTIVE SUSPENDED }
enum JobRole              { DATA_ENTRY CONTENT_WRITER GRAPHIC_DESIGNER VIDEO_EDITOR SOCIAL_MEDIA FRONTEND_DEV UIUX_DESIGNER }
enum StudentLevel         { NEWCOMER RELIABLE TRUSTED EXPERT }
enum PackageSegment       { FREE PARTNER NON_PARTNER }
enum PackageTier          { FREE BASIC PROFESSIONAL PREMIUM }
enum SubscriptionStatus   { PENDING_PAYMENT ACTIVE EXPIRED CANCELLED }
enum JobStatus            { DRAFT OPEN CLAIMED IN_PROGRESS SUBMITTED REVISION_REQUESTED ACCEPTED REJECTED DISPUTED CANCELLED EXPIRED }
enum AssignmentStatus     { ACTIVE COMPLETED WITHDRAWN FAILED }
enum ReviewDecision       { ACCEPT REQUEST_REVISION REJECT }
enum DisputeStatus        { OPEN RESOLVED }
enum DisputeResolution    { ACCEPT_WORK UPHOLD_REJECTION }
enum FailureReportStatus  { OPEN CONFIRMED DISMISSED }
enum DeadlineChangeStatus { PENDING APPROVED DECLINED }
enum LedgerType           { STUDENT_SHARE PLATFORM_FEE }
enum LedgerStatus         { RESERVED HELD PAYABLE PAID RECOGNIZED VOIDED }
enum WithdrawalStatus     { REQUESTED PAID REJECTED }
enum RatingDirection      { UMKM_TO_STUDENT STUDENT_TO_UMKM }
enum ImagePurpose         { AVATAR UMKM_LOGO JOB_REFERENCE }

// ───────── Identity ─────────
model User {
  id            String     @id @default(cuid())
  email         String     @unique
  name          String?
  image         String?
  emailVerified DateTime?
  role          Role?                       // null sampai onboarding selesai
  status        UserStatus @default(ACTIVE)
  isCampusEmail Boolean    @default(false)  // email berakhiran .ac.id
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  student       StudentProfile?
  umkm          UmkmProfile?
  redemption    ReferralRedemption?
  notifications Notification[]
  auditLogs     AuditLog[]
  accounts      Account[]
  sessions      Session[]
  images        ImageAsset[]
}

// ───────── Auth.js adapter ─────────
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime

  @@unique([identifier, token])
}

// ───────── Campus & referral ─────────
model Campus {
  id            String   @id @default(cuid())
  name          String   @unique
  city          String
  province      String
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())

  referralCodes ReferralCode[]
  students      StudentProfile[]
  partnerUmkms  UmkmProfile[]
}

model ReferralCode {
  id          String   @id @default(cuid())
  code        String   @unique
  campusId    String
  campus      Campus   @relation(fields: [campusId], references: [id])
  isActive    Boolean  @default(true)
  expiresAt   DateTime?
  maxUses     Int?                       // null = tidak terbatas
  usedCount   Int      @default(0)
  createdAt   DateTime @default(now())

  redemptions ReferralRedemption[]
  @@index([campusId])
}

model ReferralRedemption {
  id         String       @id @default(cuid())
  codeId     String
  code       ReferralCode @relation(fields: [codeId], references: [id])
  userId     String       @unique
  user       User         @relation(fields: [userId], references: [id])
  redeemedAt DateTime     @default(now())
}

model StudentProfile {
  id                String       @id @default(cuid())
  userId            String       @unique
  user              User         @relation(fields: [userId], references: [id])
  username          String       @unique          // untuk /s/[username]
  campusId          String
  campus            Campus       @relation(fields: [campusId], references: [id])
  studyProgram      String
  bio               String?
  avatarUrl         String?
  skills            String[]
  roles             JobRole[]
  points            Int          @default(0)
  level             StudentLevel @default(NEWCOMER)
  ratingAvg         Float        @default(0)
  ratingCount       Int          @default(0)
  completedJobs     Int          @default(0)
  portfolioPublic   Boolean      @default(true)
  bankName          String?
  bankAccountName   String?
  bankAccountNumber String?
  createdAt         DateTime     @default(now())

  assignments       JobAssignment[]
  ledgerEntries     LedgerEntry[]
  withdrawals       Withdrawal[]
  pointEvents       PointEvent[]
  @@index([campusId])
}

model UmkmProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  businessName    String
  category        String
  province        String
  city            String
  description     String?
  phone           String?
  logoUrl         String?
  isCampusPartner Boolean  @default(false)       // ditetapkan admin
  partnerCampusId String?
  partnerCampus   Campus?  @relation(fields: [partnerCampusId], references: [id])
  ratingAvg       Float    @default(0)
  ratingCount     Int      @default(0)
  createdAt       DateTime @default(now())

  subscriptions   Subscription[]
  jobs            Job[]
}

// ───────── Packages & Subscription ─────────
model Package {
  id                 String         @id @default(cuid())
  code               String         @unique      // PARTNER_BASIC, NON_PARTNER_PREMIUM, FREE
  name               String
  segment            PackageSegment
  tier               PackageTier
  priceIdr           Int
  jobQuota           Int
  allocationPerJobIdr Int                         // 0 untuk FREE
  durationDays       Int            @default(30)
  isPaidJobs         Boolean        @default(true)
  isActive           Boolean        @default(true)
  sortOrder          Int            @default(0)

  subscriptions      Subscription[]
}

model Subscription {
  id           String             @id @default(cuid())
  umkmId       String
  umkm         UmkmProfile        @relation(fields: [umkmId], references: [id])
  packageId    String
  package      Package            @relation(fields: [packageId], references: [id])
  status       SubscriptionStatus @default(PENDING_PAYMENT)
  periodKey    String?                            // "2026-11" khusus FREE bulanan
  startsAt     DateTime?
  endsAt       DateTime?
  quotaTotal   Int
  quotaUsed    Int                @default(0)
  paidAt       DateTime?
  markedPaidBy String?                            // admin userId
  paymentNote  String?
  createdAt    DateTime           @default(now())

  jobs         Job[]
  quotaLedger  QuotaLedger[]
  @@unique([umkmId, periodKey])
  @@index([umkmId, status])
}

model QuotaLedger {
  id             String       @id @default(cuid())
  subscriptionId String
  subscription   Subscription @relation(fields: [subscriptionId], references: [id])
  jobId          String?
  delta          Int                              // -1 publish, +1 restore
  reason         String
  createdAt      DateTime     @default(now())
}

// ───────── Jobs ─────────
model Job {
  id                String      @id @default(cuid())
  umkmId            String
  umkm              UmkmProfile @relation(fields: [umkmId], references: [id])
  subscriptionId    String?                      // diisi saat publish
  subscription      Subscription? @relation(fields: [subscriptionId], references: [id])

  title             String
  description       String
  instructions      String
  role              JobRole
  deliverableType   String                       // DRIVE | DOCS | FIGMA | GITHUB | CANVA | NOTION | OTHER
  deadlineAt        DateTime
  minLevel          StudentLevel @default(NEWCOMER)
  beginnerFriendly  Boolean     @default(false)
  newcomerLaneUntil DateTime?

  status            JobStatus   @default(DRAFT)
  isHidden          Boolean     @default(false)

  // snapshot saat publish
  packageTier       PackageTier?
  isPaid            Boolean     @default(false)
  allocationIdr     Int         @default(0)
  studentShareIdr   Int         @default(0)
  platformShareIdr  Int         @default(0)

  publishedAt       DateTime?
  revisionCount     Int         @default(0)
  reviewDueAt       DateTime?
  revisionDueAt     DateTime?
  disputeUntil      DateTime?
  rejectionFinalAt  DateTime?
  autoAccepted      Boolean     @default(false)
  completedAt       DateTime?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  criteria          AcceptanceCriterion[]
  images            ImageAsset[]
  assignments       JobAssignment[]
  deadlineRequests  DeadlineChangeRequest[]
  dispute           Dispute?
  failureReports    FailureReport[]
  ratings           Rating[]
  @@index([status, role, publishedAt])
  @@index([umkmId, status])
}

model AcceptanceCriterion {
  id       String @id @default(cuid())
  jobId    String
  job      Job    @relation(fields: [jobId], references: [id], onDelete: Cascade)
  text     String
  position Int
}

model JobAssignment {
  id           String           @id @default(cuid())
  jobId        String
  job          Job              @relation(fields: [jobId], references: [id])
  studentId    String
  student      StudentProfile   @relation(fields: [studentId], references: [id])
  status       AssignmentStatus @default(ACTIVE)
  claimedAt    DateTime         @default(now())
  startedAt    DateTime?
  endedAt      DateTime?
  endReason    String?

  submissions  Submission[]
  ledgerEntries LedgerEntry[]
  failureReports FailureReport[]
  @@index([studentId, status])
  // Partial unique index dibuat lewat migrasi SQL manual (lihat di bawah)
}

model Submission {
  id           String        @id @default(cuid())
  assignmentId String
  assignment   JobAssignment @relation(fields: [assignmentId], references: [id])
  jobId        String
  number       Int                                  // 1, 2, 3
  url          String
  note         String?
  selfCheck    Json?                                // [{criterionId, checked}]
  isLate       Boolean       @default(false)
  submittedAt  DateTime      @default(now())

  review       Review?
  @@unique([jobId, number])
}

model Review {
  id              String         @id @default(cuid())
  submissionId    String         @unique
  submission      Submission     @relation(fields: [submissionId], references: [id])
  reviewerUserId  String
  decision        ReviewDecision
  reason          String?
  criteriaResults Json                              // [{criterionId, met, comment?}]
  createdAt       DateTime       @default(now())
}

model DeadlineChangeRequest {
  id            String               @id @default(cuid())
  jobId         String
  job           Job                  @relation(fields: [jobId], references: [id])
  newDeadlineAt DateTime
  reason        String?
  status        DeadlineChangeStatus @default(PENDING)
  createdAt     DateTime             @default(now())
  respondedAt   DateTime?
}

model Dispute {
  id           String             @id @default(cuid())
  jobId        String             @unique
  job          Job                @relation(fields: [jobId], references: [id])
  raisedByUserId String
  reason       String
  evidenceUrl  String?
  status       DisputeStatus      @default(OPEN)
  resolution   DisputeResolution?
  adminNote    String?
  resolvedBy   String?
  createdAt    DateTime           @default(now())
  resolvedAt   DateTime?
}

model FailureReport {
  id              String              @id @default(cuid())
  jobId           String
  job             Job                 @relation(fields: [jobId], references: [id])
  assignmentId    String
  assignment      JobAssignment       @relation(fields: [assignmentId], references: [id])
  reportedByUserId String
  reason          String
  studentResponse String?
  status          FailureReportStatus @default(OPEN)
  adminNote       String?
  resolvedBy      String?
  createdAt       DateTime            @default(now())
  resolvedAt      DateTime?
}

// ───────── Money ─────────
model LedgerEntry {
  id           String        @id @default(cuid())
  jobId        String
  assignmentId String
  assignment   JobAssignment @relation(fields: [assignmentId], references: [id])
  type         LedgerType
  status       LedgerStatus  @default(RESERVED)
  amountIdr    Int
  studentId    String?                               // null untuk PLATFORM_FEE
  student      StudentProfile? @relation(fields: [studentId], references: [id])
  withdrawalId String?
  withdrawal   Withdrawal?   @relation(fields: [withdrawalId], references: [id])
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  @@index([studentId, status])
}

model Withdrawal {
  id                String           @id @default(cuid())
  studentId         String
  student           StudentProfile   @relation(fields: [studentId], references: [id])
  amountIdr         Int
  bankName          String
  bankAccountName   String
  bankAccountNumber String
  status            WithdrawalStatus @default(REQUESTED)
  adminNote         String?
  processedBy       String?
  requestedAt       DateTime         @default(now())
  processedAt       DateTime?

  entries           LedgerEntry[]
}

// ───────── Reputation ─────────
model PointEvent {
  id        String         @id @default(cuid())
  studentId String
  student   StudentProfile @relation(fields: [studentId], references: [id])
  jobId     String?
  delta     Int
  reason    String
  createdBy String?                                // admin userId untuk penyesuaian manual
  createdAt DateTime       @default(now())
}

model Rating {
  id         String          @id @default(cuid())
  jobId      String
  job        Job             @relation(fields: [jobId], references: [id])
  direction  RatingDirection
  fromUserId String
  toUserId   String
  score      Float                                  // rata-rata dimensi bila STUDENT_TO_UMKM
  dimensions Json?                                  // {clarity, communication, professionalism, reviewSpeed}
  comment    String?
  createdAt  DateTime        @default(now())
  @@unique([jobId, direction])
}

// ───────── System ─────────
model ImageAsset {
  id          String       @id @default(cuid())
  ownerUserId String
  owner       User         @relation(fields: [ownerUserId], references: [id])
  purpose     ImagePurpose
  url         String
  pathname    String       @unique
  contentType String
  sizeBytes   Int
  jobId       String?
  job         Job?         @relation(fields: [jobId], references: [id], onDelete: SetNull)
  createdAt   DateTime     @default(now())

  @@index([ownerUserId, purpose])
  @@index([jobId])
}

model Notification {
  id        String    @id @default(cuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  type      String
  title     String
  body      String
  href      String?
  readAt    DateTime?
  createdAt DateTime  @default(now())
  @@index([userId, readAt, createdAt])
}

model AuditLog {
  id        String   @id @default(cuid())
  actorId   String?
  actor     User?    @relation(fields: [actorId], references: [id])
  action    String                                  // mis. "SUBSCRIPTION_MARK_PAID"
  entity    String
  entityId  String
  meta      Json?
  createdAt DateTime @default(now())
  @@index([entity, entityId])
}

model PlatformConfig {
  key       String   @id
  value     Json
  updatedAt DateTime @updatedAt
}

model DeadlineRule {
  id       String      @id @default(cuid())
  role     JobRole
  tier     PackageTier
  minHours Int
  @@unique([role, tier])
}
```

**Migrasi SQL manual wajib** (setelah `prisma migrate dev --create-only`, tambahkan ke file migrasi):

```sql
-- Hanya satu assignment ACTIVE per job (pengaman race condition klaim)
CREATE UNIQUE INDEX "one_active_assignment_per_job"
  ON "JobAssignment" ("jobId") WHERE "status" = 'ACTIVE';
```

**Catatan implementasi:** Prisma tidak mendukung partial index di skema, sehingga indeks di atas hanya ada di migrasi SQL. Jangan dihapus saat `migrate dev` berikutnya.

---

## 10. Spesifikasi Fitur & Acceptance Criteria

Format: **ID — judul (label)** lalu kriteria penerimaan (AC) yang bisa diuji.

### Modul A — Auth & Onboarding

**A-1 Login Google (P0)**
- Klik "Masuk dengan Google" → sesi dibuat; email di `ADMIN_EMAILS` otomatis `role = ADMIN`.
- User tanpa `role` yang membuka halaman mana pun (selain `/login`, `/onboarding`) dialihkan ke `/onboarding`.
- User `SUSPENDED` melihat halaman "Akun dinonaktifkan" dan tidak bisa mengakses fitur.
- `/login` menerima parameter `?as=student` atau `?as=umkm` (nilai lain diabaikan). Nilainya disimpan sementara dan dipakai untuk memilih peran otomatis di onboarding. Setelah login, user diarahkan sesuai peran: `STUDENT` → `/student`, `UMKM` → `/umkm`, `ADMIN` → `/admin`.
- Admin tidak punya tombol khusus di landing page; admin masuk lewat `/login` yang sama dan dikenali dari `ADMIN_EMAILS`.
- Satu akun Google = satu peran pada MVP.

**A-2 Onboarding Mahasiswa (P0)**
- Langkah: pilih peran Mahasiswa → input kode referral → lengkapi profil (nama, prodi, ≥1 role, deskripsi singkat, `username` unik huruf kecil/angka/strip).
- Kode salah/kedaluwarsa/nonaktif/penuh → pesan spesifik; kegagalan ke-6 dalam 15 menit ditolak sementara.
- Tautan "Belum punya kode?" menampilkan panduan menghubungi pihak kampus (BR-A6).
- Sukses → `StudentProfile` dibuat, `usedCount` naik, redirect `/student`.
- Langkah profil menyediakan unggah foto profil **opsional** (BR-I1..I5). Bila kosong, tampil avatar Google (`User.image`), lalu inisial nama.

**A-3 Onboarding UMKM (P0)**
- Input: nama usaha, kategori, provinsi, kota, deskripsi, telepon. Sukses → `UmkmProfile`, redirect `/umkm`.
- `isCampusPartner` selalu `false` sampai admin mengubahnya.
- Langkah profil menyediakan unggah logo usaha **opsional**. Bila kosong, tampil inisial nama usaha.

### Modul B — Paket & Langganan

**B-1 Halaman Langganan UMKM (P0)** `/umkm/subscription`
- Menampilkan: paket aktif (nama, status, mulai, berakhir), kuota total/terpakai/sisa, kuota gratis bulan ini, riwayat penggunaan kuota, riwayat langganan.
- Daftar paket yang tersedia hanya segmen sesuai `isCampusPartner` UMKM (PARTNER atau NON_PARTNER).
- Tombol "Pilih paket" → membuat `Subscription(PENDING_PAYMENT)` + halaman instruksi pembayaran manual (teks dari `PlatformConfig.paymentInstructions`).

**B-2 Konfirmasi Pembayaran oleh Admin (P0)** `/admin/subscriptions` 🧾
- Admin melihat antrean `PENDING_PAYMENT`; tombol "Tandai Sudah Bayar" (+ catatan) mengaktifkan langganan sesuai BR-S2 dan menotifikasi UMKM.
- Tombol "Batalkan" mengubah ke `CANCELLED`.

**B-3 Kuota & kedaluwarsa (P0)**
- Cron mengubah langganan `ACTIVE` dengan `endsAt < now` menjadi `EXPIRED`.
- Notifikasi saat sisa kuota ≤ 1 dan 7 hari sebelum berakhir.

### Modul C — Pembuatan Job

**C-1 Buat & Simpan Draft (P0)** `/umkm/jobs/new`
- Draft tidak mengurangi kuota dan tanpa validasi deadline minimum.
- Form memuat: judul, role, deskripsi, instruksi, tipe tautan hasil, deadline, **checklist (1–7 kriteria, tambah/hapus/urutkan)**, centang "Cocok untuk pemula" (P1).
- Saat memilih `role`, sistem menampilkan deadline minimum yang berlaku dan template kriteria sugesti (opsional, dari konstanta per role). Form juga menampilkan panduan ruang lingkup paket (BR-J9).
- Bagian "Gambar referensi" (opsional, maks 3): pratinjau, hapus, dan urutkan. Hanya aktif pada status `DRAFT`/`OPEN`. Pada draft yang belum punya `id`, simpan draft otomatis sebelum mengunggah agar `jobId` tersedia.

**C-2 Publish (P0)**
- Validasi BR-J1, BR-J3, BR-S7 di server. Pesan error menyebutkan batas minimum konkret ("Deadline minimal 7 Nov 2026 14:00 untuk Graphic Designer paket Basic").
- Sukses: status `OPEN`, kuota −1, snapshot uang, `QuotaLedger`, notifikasi "Pekerjaan berhasil dipublikasikan".
- Publish dua kali beruntun (double-click) hanya mengurangi kuota sekali (idempoten lewat transisi status).

**C-3 Kelola Job UMKM (P0)** `/umkm/jobs`, `/umkm/jobs/[id]`
- Tab status (Draft, Open, Berjalan, Review, Selesai, Lainnya). Detail menampilkan riwayat submission, hasil review, dan status transaksi.
- Aksi sesuai status: Edit, Batalkan, Ajukan Perubahan Deadline, Lapor Masalah, Duplikat.

**C-4 Perubahan Deadline (P0)**
- Job `OPEN`: edit langsung (tetap ≥ minimum).
- Job `CLAIMED`/`IN_PROGRESS`: membuat `DeadlineChangeRequest(PENDING)`; mahasiswa Setuju/Tolak; baru berlaku setelah disetujui. Memperpendek deadline di bawah minimum tetap ditolak.

### Modul D — Discovery & Klaim

**D-1 Find Jobs (P0)** `/student/jobs`
- Menampilkan job `OPEN`, `isHidden = false`, belum lewat batas klaim.
- Kartu: judul, role, UMKM + rating, deadline, imbalan (`Rp xx.xxx` atau badge **Volunteer Project**), tier badge, sisa waktu klaim.
- Filter: role (default = role profil), berbayar/gratis, rentang deadline. Cari judul. Urutan: Rekomendasi (default), Terbaru, Deadline terdekat, Imbalan tertinggi. Pagination 20/halaman. Kartu job menampilkan logo UMKM (`next/image`, `alt` = nama usaha).

**D-2 Ranking Rekomendasi (P0)** (`features/jobs/ranking.ts`)
```
score = roleMatch(40 jika job.role ∈ student.roles, else 0)
      + tierBoost(BASIC 0, PROFESSIONAL 10, PREMIUM 20, FREE 0)
      + urgency(hoursLeft ≤ 72 ? 20 × (1 − hoursLeft/72) : 0)
      + freshness(max(0, 20 − ageHours/6))
```
Ambil maksimal 200 job `OPEN` terbaru, hitung skor di TypeScript, urutkan, lalu paginasi. Pisahkan fungsi murni agar bisa diuji.

**D-3 Detail Job (P0)** `/student/jobs/[id]`
- Menampilkan seluruh brief, checklist, deadline, imbalan, syarat (role, level), badge Volunteer bila gratis, dan tombol "Ambil Pekerjaan" dengan alasan penolakan jelas bila tidak memenuhi syarat (mis. "Batas pekerjaan aktif tercapai (1/1)"). Detail job juga menampilkan galeri gambar referensi (klik untuk memperbesar).

**D-4 Take Job (P0)**
- Logika BR-C1 s.d. BR-C4. Uji konkurensi wajib: 10 klaim paralel pada satu job → tepat 1 sukses, 9 mendapat "sudah diambil".
- Job gratis: modal konfirmasi (BR-C3).
- Sukses → notifikasi ke UMKM, redirect ke `/student/my-jobs/[id]`.

### Modul E — Eksekusi & Review

**E-1 My Jobs (P0)** `/student/my-jobs`
- Tab: Aktif, Menunggu Review, Revisi, Selesai, Lainnya. Menampilkan hitung mundur deadline, badge Volunteer, status ledger (berbayar).

**E-2 Workspace Pekerjaan (P0)** `/student/my-jobs/[id]`
- Tombol **Mulai Kerjakan** (hanya `CLAIMED`) dan **Mundur** (alasan wajib, hanya `CLAIMED`).
- Form **Submit**: URL (validasi BR-J7), catatan, checklist self-check. Riwayat submission + hasil review tiap submission.
- Saat `REVISION_REQUESTED`: tampil kriteria yang belum terpenuhi dan `revisionDueAt`.
- Saat `REJECTED` dalam jendela sengketa: tombol **Ajukan Sengketa**.

**E-3 Review oleh UMKM (P0)** `/umkm/jobs/[id]`
- Tampilkan submission terbaru (tautan dibuka di tab baru dengan `rel="noopener noreferrer"`) + checklist self-check mahasiswa.
- UMKM menilai tiap kriteria lalu memilih Accept / Request Revision / Reject sesuai BR-E3/E4. Tombol yang tidak diizinkan di-*disable* dengan alasan.
- Hitung mundur sisa waktu review; peringatan bahwa lewat batas = diterima otomatis.

**E-4 Lapor Masalah (P0)** (`FailureReport`, BR-F1) dan **Sengketa (P0)** (BR-D1) lengkap dengan halaman admin.

### Modul F — Reward & Reputasi

**F-1 Poin & Level (P0)** Dihitung di `features/reputation/points.ts` saat `ACCEPTED`; setiap perubahan menulis `PointEvent`; level diperbarui otomatis; notifikasi saat naik level.
**F-2 Rating (P0)** Form rating muncul setelah `ACCEPTED` (jendela 14 hari). Satu per arah per job.
**F-3 Penghasilan & Penarikan (P0)** `/student/earnings`: ringkasan saldo (§8.3), riwayat transaksi, tombol "Tarik Saldo" (BR-W1..W4), riwayat penarikan.
**F-4 Portofolio Publik (P0)** `/s/[username]` (tanpa login)
- Menampilkan nama, kampus, prodi, role, level, poin, rating, jumlah pekerjaan diterima, dan daftar pekerjaan `ACCEPTED` (judul, role, nama UMKM, tanggal, badge Volunteer bila gratis, rating bila ada). Tidak menampilkan imbalan, email, atau data bank.
- Mahasiswa dapat mematikan `portfolioPublic` (foto profil ikut disembunyikan dari halaman publik). Halaman memakai metadata Open Graph untuk dibagikan.

### Modul G — Admin

| ID | Halaman | Fungsi inti (semua mutasi 🧾) |
|---|---|---|
| G-1 | `/admin` | Ringkasan: user, job per status, antrean (langganan menunggu, sengketa, laporan, penarikan) |
| G-2 | `/admin/users` | Cari, lihat detail, suspend/aktifkan, set `isCampusPartner` UMKM |
| G-3 | `/admin/campuses` | CRUD kampus (nama, kota, provinsi, aktif) |
| G-4 | `/admin/referrals` | Buat kode (acak 8 karakter, tanpa karakter ambigu), set expiry, `maxUses`, aktif/nonaktif, riwayat penebusan |
| G-5 | `/admin/packages` | Edit harga, kuota, alokasi, aktif/nonaktif (tidak memengaruhi job lama) |
| G-6 | `/admin/subscriptions` | B-2 |
| G-7 | `/admin/jobs` | Cari/filter, sembunyikan, batalkan (opsi `restoreQuota`) |
| G-8 | `/admin/ledger`, `/admin/withdrawals` | Lihat entri ledger; antrean penarikan: Tandai Dibayar / Tolak |
| G-9 | `/admin/disputes`, `/admin/failure-reports` | Tampilkan brief, checklist, submission, review, catatan; keputusan sesuai BR-D2 / BR-F2 |
| G-10 | `/admin/points` | Penyesuaian manual poin dengan alasan |
| G-11 | `/admin/config` | Edit `PlatformConfig` (§15.3) dan `DeadlineRule` |
| G-12 | `/admin/audit` | Daftar audit log dengan filter entitas/aktor |
| G-13 | `/admin/impact` | Impact Dashboard (G-14) |

**G-14 Impact Dashboard (P0)** (`features/platform/impact.ts`)
Metrik: total imbalan tersalurkan (`STUDENT_SHARE` berstatus `PAYABLE`/`PAID`), jumlah pekerjaan selesai, mahasiswa aktif (≥1 job diterima), UMKM terlayani (≥1 job diterima), kampus mitra aktif, **sebaran provinsi** (mahasiswa via kampus, UMKM via profil), jumlah Volunteer Project selesai, **persentase mahasiswa yang mendapat pekerjaan pertama**, dan median waktu dari registrasi ke pekerjaan pertama diterima. Empat angka teratas juga tampil sebagai *counter* di landing page publik (di-cache 1 jam).

### Modul H — Notifikasi

**H-1 In-app notification (P0)**
- Ikon lonceng dengan badge jumlah belum dibaca; polling TanStack Query tiap 30 detik; halaman daftar dengan "tandai semua dibaca". Tanpa email, tanpa WebSocket.
- Notifikasi dibuat hanya lewat `createNotification(userId, type, payload)` dari `features/notifications`.

| Penerima | Tipe (`type`) |
|---|---|
| UMKM | `JOB_PUBLISHED`, `JOB_CLAIMED`, `JOB_SUBMITTED`, `REVIEW_DUE_SOON`, `JOB_AUTO_ACCEPTED`, `DEADLINE_APPROACHING`, `DEADLINE_REQUEST_RESPONDED`, `JOB_EXPIRED`, `FAILURE_REPORT_RESOLVED`, `SUBSCRIPTION_ACTIVATED`, `QUOTA_LOW`, `SUBSCRIPTION_ENDING`, `RATING_RECEIVED` |
| Mahasiswa | `REVISION_REQUESTED`, `JOB_ACCEPTED`, `JOB_REJECTED`, `DISPUTE_RESOLVED`, `DEADLINE_CHANGE_REQUESTED`, `DEADLINE_APPROACHING`, `FAILURE_REPORTED`, `FAILURE_RESOLVED`, `LEDGER_PAYABLE`, `WITHDRAWAL_PAID`, `WITHDRAWAL_REJECTED`, `LEVEL_UP`, `CLAIM_AUTO_RELEASED`, `RATING_RECEIVED` |
| Admin | `PAYMENT_PENDING`, `DISPUTE_OPENED`, `FAILURE_REPORT_OPENED`, `WITHDRAWAL_REQUESTED` |

### Modul I — Gambar (Vercel Blob)

**I-1 Komponen `ImageUploader` (P0)** (`features/images/components/ImageUploader.tsx`)
- Props: `purpose`, `jobId?`, `max`, nilai awal. Memilih file → validasi tipe/ukuran di klien → kompres → unggah dengan progres → panggil `attachImage`.
- Menampilkan error spesifik (tipe tidak didukung, > 2 MB, batas jumlah tercapai, tidak berwenang).
- Dapat dipakai ulang untuk `AVATAR`, `UMKM_LOGO`, `JOB_REFERENCE`.

**I-2 Hapus & ganti (P0)**
- `removeImage` menghapus blob (`del`) dan baris `ImageAsset`, serta mengosongkan `avatarUrl`/`logoUrl` bila perlu.
- Mengganti AVATAR/LOGO = unggah baru lalu hapus yang lama.

**I-3 Pembersihan yatim (P0)**
- Cron menghapus `ImageAsset` `JOB_REFERENCE` yang `jobId`-nya null dan usianya > 24 jam, beserta blob-nya.

### Modul J — Landing Page & Halaman Publik

**J-1 Landing page `/` (P0)** (`app/(marketing)/page.tsx`)
Bagian berurutan:
1. **Hero:** nilai jual satu kalimat + dua tombol: "Saya Mahasiswa" → `/login?as=student`, "Saya UMKM" → `/login?as=umkm`.
2. **Masalah & solusi:** UMKM butuh tenaga tambahan tanpa karyawan tetap; mahasiswa butuh penghasilan, pengalaman, dan portofolio.
3. **Cara kerja:** dua jalur masing-masing 3 langkah (UMKM: pilih paket → publish job → terima hasil; Mahasiswa: masuk dengan kode kampus → ambil job → kumpulkan hasil dan dibayar).
4. **Paket & harga:** dibaca dari tabel `Package` aktif (segmen Mitra/Non-Mitra, kuota, harga). Tidak di-*hardcode*.
5. **Pembeda KARTA:** ringkasan D1–D6 (§3).
6. **Dampak:** empat counter dari Impact Dashboard (cache 1 jam).
7. **Kampus mitra:** daftar kampus `isActive`.
8. **FAQ:** apa itu kode referral, bagaimana pembayaran, apa itu Volunteer Project, bagaimana bila hasil ditolak.
9. **Footer:** kontak, tautan `/privacy`, `/terms`.
- Mobile-first, metadata SEO dan Open Graph, skor Lighthouse performa ≥ 85 di mobile sebagai target.
- Seluruh data dinamis (paket, counter, kampus) diambil di server dan boleh di-cache dengan revalidasi (mis. 1 jam).

**J-2 Halaman hukum (P1)** `/privacy`, `/terms`: halaman statis singkat (data yang dikumpulkan, penggunaan Google OAuth, penyimpanan gambar, kontak). Dibutuhkan untuk verifikasi consent screen Google di produksi.

**J-3 Halaman publik lain (P0)**: `/s/[username]` (F-4), halaman 404 dan error yang ramah.

---

## 11. Peta Halaman (Routes)

| Area | Route |
|---|---|
| Publik | `/` (landing + counter dampak), `/s/[username]`, `/privacy`, `/terms` (P1) |
| Auth | `/login` (`?as=student\|umkm`), `/onboarding`, `/onboarding/student`, `/onboarding/umkm`, `/suspended` |
| Mahasiswa | `/student`, `/student/jobs`, `/student/jobs/[id]`, `/student/my-jobs`, `/student/my-jobs/[id]`, `/student/earnings`, `/student/profile`, `/student/notifications` |
| UMKM | `/umkm`, `/umkm/jobs`, `/umkm/jobs/new`, `/umkm/jobs/[id]`, `/umkm/jobs/[id]/edit`, `/umkm/subscription`, `/umkm/profile`, `/umkm/notifications` |
| Admin | lihat §10 Modul G |
| Sistem | `/api/auth/*`, `/api/cron/tick`, `/api/blob/upload` |

`proxy.ts` (Next.js 16 mengganti nama `middleware.ts`; ekspor bernama `proxy`) melindungi prefix `/student`, `/umkm`, `/admin` berdasarkan `role`, dan mengarahkan user belum onboarding ke `/onboarding`. `/api/cron/tick` dan `/api/blob/upload` memeriksa otorisasinya sendiri di dalam handler (secret dan sesi), bukan di `proxy.ts`. `proxy.ts` hanya boleh mengimpor `auth.config.ts`, bukan `auth.ts`/Prisma. Karena sesi memakai JWT, `role` disimpan di token; **status SUSPENDED dan role selalu dicek ulang ke database di guards**, bukan hanya dari token. Guard di service tetap wajib (proxy bukan satu-satunya pertahanan).

### 11.1 Dashboard ringkas

- **Mahasiswa:** pekerjaan aktif + deadline terdekat, saldo dapat ditarik, level & progres poin, rekomendasi 3 job.
- **UMKM:** kuota tersisa, job per status, review yang menunggu (dengan sisa waktu), langganan berakhir kapan.

### 11.2 Pedoman UI

- Mobile-first; tabel lebar berubah jadi kartu di layar kecil.
- Format uang `Rp 25.000` via `Intl.NumberFormat('id-ID')`; tanggal `31 Okt 2026, 14:00 WIB`.
- Badge status berwarna konsisten (satu peta status → warna di `lib/constants.ts`). Badge **Volunteer Project** berwarna mencolok (amber) dan selalu terlihat.
- Setiap daftar punya *empty state*, *loading skeleton*, dan pesan error yang spesifik. Aksi destruktif memakai dialog konfirmasi.
- Aksesibilitas dasar: kontras AA, label form, fokus terlihat, navigasi keyboard.

---

## 12. Daftar Server Actions

Konvensi: setiap action `async function xxx(input: unknown): Promise<Result<T>>` dengan `Result = { ok: true, data } | { ok: false, error: { code, message } }`. Action hanya: guard → parse Zod → panggil service → `revalidatePath`.

| Modul | Actions |
|---|---|
| auth | `completeStudentOnboarding`, `completeUmkmOnboarding`, `redeemReferralCode` |
| profile | `updateStudentProfile`, `updateUmkmProfile`, `updateBankAccount`, `togglePortfolioPublic` |
| subscription | `selectPackage`, `cancelPendingSubscription` · admin: `markSubscriptionPaid` |
| job | `saveJobDraft`, `publishJob`, `updateOpenJob`, `cancelJob`, `duplicateJob`, `requestDeadlineChange`, `respondDeadlineChange` |
| claim | `takeJob`, `startJob`, `withdrawFromJob` |
| submission | `submitWork` |
| review | `reviewSubmission` (decision: ACCEPT / REQUEST_REVISION / REJECT) |
| dispute | `openDispute` · admin: `resolveDispute` |
| failure | `reportFailure`, `respondFailureReport` · admin: `resolveFailureReport` |
| rating | `rateStudent`, `rateUmkm` |
| withdrawal | `requestWithdrawal` · admin: `markWithdrawalPaid`, `rejectWithdrawal` |
| notification | `markNotificationRead`, `markAllRead` |
| image | `attachImage`, `removeImage`, `reorderJobImages` |
| admin | `createCampus`, `updateCampus`, `createReferralCode`, `updateReferralCode`, `updatePackage`, `setUserStatus`, `setCampusPartner`, `hideJob`, `adminCancelJob`, `adjustPoints`, `updateConfig`, `updateDeadlineRule` |

---

## 13. Penjadwalan & Aturan Berbasis Waktu

**Masalah:** plan Hobby Vercel hanya mengizinkan Vercel Cron sekali sehari (dan waktunya bisa meleset sekitar satu jam). Karena itu KARTA memakai tiga lapis:

1. **GitHub Actions** (gratis) memanggil `/api/cron/tick` tiap jam (Lampiran D). Bisa sedikit terlambat, cukup untuk aturan berbasis hari.
2. **Vercel Cron harian** (`vercel.json`) sebagai cadangan bila GitHub Actions gagal.
3. **Evaluasi *lazy***: fungsi aturan waktu yang sama (`features/platform/time-rules.ts`) dipanggil saat sebuah job, dashboard, atau halaman admin dibuka, sehingga status yang ditampilkan selalu sudah mutakhir walau cron belum jalan.

**Endpoint** `/api/cron/tick` menerima `GET` dan `POST`, dilindungi header `Authorization: Bearer ${CRON_SECRET}` (Vercel Cron mengirim header ini otomatis bila env `CRON_SECRET` ada). Setiap tugas harus idempoten: pakai kondisi `where` pada status, bukan asumsi satu kali jalan. Hasil tick dicatat ringkas (jumlah baris terdampak per tugas) di log.

| # | Tugas | Aksi |
|---|---|---|
| 1 | Job `OPEN` melewati batas klaim | → `EXPIRED`, kuota +1, notifikasi UMKM |
| 2 | `SUBMITTED` dan `reviewDueAt < now` | → `ACCEPTED` (`autoAccepted`), ledger PAYABLE, poin |
| 3 | `REJECTED` dan `disputeUntil < now` dan tanpa sengketa dan `rejectionFinalAt` kosong | Kunci final, ledger VOIDED |
| 4 | Langganan `ACTIVE` dan `endsAt < now` | → `EXPIRED` |
| 5 | Pengingat deadline H-24 jam (mahasiswa & UMKM), review due H-24 jam, kuota ≤ 1, langganan berakhir ≤ 7 hari | Notifikasi (hindari duplikat: cek notifikasi sejenis dalam 24 jam) |
| 6 (P1) | `CLAIMED` tanpa `startedAt` melewati ⚙️24 jam | Auto-release (BR-C6) |
| 7 | `DeadlineChangeRequest` `PENDING` lebih dari 3 hari | Otomatis `DECLINED` |
| 8 | `ImageAsset` `JOB_REFERENCE` tanpa `jobId` dan usia > 24 jam | `del()` blob lalu hapus baris |

---

## 14. Keamanan, Performa, Kualitas

**Keamanan**
- Otorisasi di setiap action dan service, termasuk cek kepemilikan (IDOR). Jangan percaya `id` dari klien tanpa cek relasi ke user.
- Semua input divalidasi Zod di server. Output teks pengguna di-*escape* (React default); tautan eksternal dibuka dengan `rel="noopener noreferrer" target="_blank"`.
- Validasi URL hasil (BR-J7) lewat satu fungsi `lib/url.ts` yang diuji (tolak `javascript:`, `data:`, `http:`, host di luar whitelist, kredensial di URL).
- Rate limit sederhana (tabel atau memori) untuk: penebusan referral, klaim job, login.
- Nomor rekening di-*mask* di UI mahasiswa; hanya admin dapat melihat penuh; jangan di-log.
- Secret hanya via env. Sediakan `.env.example` sesuai Lampiran B (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ADMIN_EMAILS`, `CRON_SECRET`, `APP_URL`, `BLOB_READ_WRITE_TOKEN`). Jangan pernah memakai awalan `NEXT_PUBLIC_` untuk secret.
- Token upload hanya diterbitkan setelah `requireUser()` dan validasi BR-I3/I4. `allowedContentTypes` dan `maximumSizeInBytes` selalu diset di server; jangan percaya validasi klien.
- Tolak SVG dan tipe selain jpeg/png/webp. Verifikasi ulang tipe dan ukuran dengan `head(url)` sebelum mencatat `ImageAsset`.
- Jangan mengunggah dokumen sensitif ke store Public. Gunakan store terpisah untuk development dan produksi.
- `/api/cron/tick` menolak permintaan tanpa `CRON_SECRET` yang benar (bandingkan dengan *constant-time compare*).

**Performa**
- Halaman daftar dipaginasi (20/halaman). Index sesuai skema. Hindari N+1 (gunakan `include`/`select`).
- Target: halaman utama < 2 detik pada koneksi 4G.

**Reliabilitas & integritas**
- Operasi multi-tabel (klaim, publish, review, ledger, withdrawal) wajib di `prisma.$transaction`.
- Klaim & publish harus aman dari double-submit dan race condition.

**Observability minimal:** log error terstruktur di service; halaman `/admin/audit` untuk jejak keputusan.

---

## 15. Seed Data (`prisma/seed.ts`)

### 15.1 Paket: harga rendah untuk UMKM (angka awal, ubah lewat `/admin/packages`)

Prinsip: harga = kuota × alokasi per job. Harga tertinggi **Rp 576.000** (di bawah batas tim Rp 599.000). Non-Mitra = Mitra + 20%.

| code | segmen | tier | harga/bulan | kuota | alokasi/job | imbalan mhs (60%) | fee platform (40%) |
|---|---|---|---|---|---|---|---|
| FREE | FREE | FREE | 0 | 3 | 0 | 0 (unpaid, dapat poin) | 0 |
| PARTNER_BASIC | PARTNER | BASIC | 75.000 | 3 | 25.000 | 15.000 | 10.000 |
| PARTNER_PROFESSIONAL | PARTNER | PROFESSIONAL | 180.000 | 6 | 30.000 | 18.000 | 12.000 |
| PARTNER_PREMIUM | PARTNER | PREMIUM | 480.000 | 12 | 40.000 | 24.000 | 16.000 |
| NON_PARTNER_BASIC | NON_PARTNER | BASIC | 90.000 | 3 | 30.000 | 18.000 | 12.000 |
| NON_PARTNER_PROFESSIONAL | NON_PARTNER | PROFESSIONAL | 216.000 | 6 | 36.000 | 21.600 | 14.400 |
| NON_PARTNER_PREMIUM | NON_PARTNER | PREMIUM | 576.000 | 12 | 48.000 | 28.800 | 19.200 |

Catatan: angka ini belum divalidasi pasar. Imbalan Rp 15.000–28.800 per job hanya pantas untuk tugas mikro (BR-J9). Fee platform 40% hanya tercapai penuh bila kuota terpakai; kuota hangus menambah margin.

### 15.2 `DeadlineRule` (jam minimum; `FREE` memakai nilai `BASIC`)

| Role | BASIC | PROFESSIONAL | PREMIUM |
|---|---|---|---|
| DATA_ENTRY | 48 | 36 | 24 |
| CONTENT_WRITER | 72 | 48 | 36 |
| GRAPHIC_DESIGNER | 72 | 48 | 36 |
| SOCIAL_MEDIA | 72 | 48 | 36 |
| VIDEO_EDITOR | 120 | 96 | 72 |
| UIUX_DESIGNER | 120 | 96 | 72 |
| FRONTEND_DEV | 168 | 120 | 96 |

### 15.3 `PlatformConfig` (key → default)

`studentSharePct: 60` · `freeQuotaPerMonth: 3` · `maxRevisions: 2` · `reviewSlaDays: 3` · `revisionWindowDays: 3` · `disputeWindowDays: 3` · `failureGraceHours: 12` · `startWithinHours: 24` · `newcomerLaneMinutes: 30` · `ratingWindowDays: 14` · `minWithdrawalIdr: 50000` · `requireCampusEmail: false` · `levelThresholds: {RELIABLE:50, TRUSTED:150, EXPERT:300}` · `levelCaps: {NEWCOMER:1, RELIABLE:2, TRUSTED:3, EXPERT:4}` · `points: {accept:10, noRevision:3, onTime:2, highRating:2, failure:-15}` · `linkWhitelist: [...]` · `paymentInstructions: "..."` · `imageMaxBytes: 2097152` · `jobImagesMax: 3` · `imageUploadsPerHour: 10` · `imageAllowedTypes: ["image/jpeg","image/png","image/webp"]`

### 15.4 Data demo (untuk pengembangan & demo lomba)

2 kampus (berbeda provinsi), 3 kode referral (aktif, kedaluwarsa, penuh), 1 admin, 3 UMKM (1 mitra kampus), 5 mahasiswa berbagai level, ±12 job di berbagai status (termasuk 2 gratis, 1 ditolak dalam jendela sengketa, 1 menunggu review hampir lewat SLA), dan sedikit data ledger/withdrawal. Sediakan script `pnpm db:seed:demo`.

---

## 16. Strategi Pengujian

**Unit/service (Vitest, wajib P0):**
1. `jobStateMachine`: setiap transisi legal lolos, ilegal ditolak.
2. `claim`: 10 klaim paralel → 1 sukses; batas pekerjaan aktif; maks 1 unpaid aktif; role mismatch; lewat batas klaim.
3. `quota`: kurang saat publish, tidak saat draft, pulih pada kasus BR-S5, tidak pulih pada ACCEPTED.
4. `ledger`: seluruh jalur status di §8.2; pembulatan `floor` + sisa ke platform; job gratis tanpa entri.
5. `review`: revisi maks 2; Request Revision butuh kriteria/catatan; Reject butuh alasan + kriteria.
6. `deadline`: aturan minimum per role × tier; perubahan setelah klaim butuh persetujuan.
7. `referral`: kadaluwarsa, nonaktif, `maxUses`, penebusan ganda, rate limit.
8. `url`: whitelist dan kasus serangan.
9. `ranking`: fungsi skor deterministik.
10. `cron` dan `time-rules`: idempoten (dua kali jalan = hasil sama); hasil sama bila dipicu lewat cron maupun lazy.
11. `images`: tolak purpose tidak valid, role salah, pathname di luar prefix, job milik UMKM lain, job sudah `CLAIMED`, melebihi batas 3 gambar, rate limit; ganti AVATAR menghapus blob lama. Mock `@vercel/blob` (`put`, `del`, `head`); jangan memanggil Blob sungguhan saat test.

**E2E (Playwright, P1):** UMKM publish → mahasiswa klaim → submit → UMKM accept → saldo `PAYABLE` → tarik → admin tandai dibayar.

---

## 17. Metrik Keberhasilan MVP

Acquisition: kampus aktif, mahasiswa & UMKM terdaftar. Activation: % mahasiswa yang menyelesaikan onboarding, % UMKM yang publish job pertama, waktu registrasi → publish pertama. Marketplace: job dipublikasikan, % diklaim, waktu rata-rata sampai diklaim, job selesai. Quality: % diterima, rating rata-rata, % butuh revisi, tingkat pembatalan, tingkat sengketa. Business: langganan aktif, perpanjangan, pendapatan langganan, total alokasi, fee platform. Impact: lihat G-14. Target angka ditetapkan setelah ada data operasional awal.

---

## 18. Build Plan (urutan pengerjaan untuk vibe coding)

Kerjakan berurutan. **Satu fase = satu sesi agent = satu branch git** (`fase-0-fondasi`, `fase-1-auth`, dst). Mulai tiap sesi dengan: *"Baca docs/PRD.md. Kerjakan Fase N saja. Buat rencana singkat dulu, lalu implementasikan, jalankan typecheck/lint/test, dan ringkas perubahan. Catat keputusan di docs/DECISIONS.md."*

| Fase | Cakupan | Definition of Done |
|---|---|---|
| **0. Fondasi** | Seluruh Lampiran A (dikerjakan manual); struktur folder §4.1; skema §9 + migrasi SQL partial index; `lib/format.ts`, `lib/url.ts`, `lib/db.ts`; seed §15; Vitest; Blob store terhubung; `next.config.ts` | `pnpm dev` jalan; `prisma migrate` + seed sukses; test `url.ts` lulus |
| **1. Auth, Onboarding, Gambar** | Auth.js Google, `proxy.ts`, guards, `/login?as=`, onboarding mahasiswa/UMKM, referral + rate limit, admin kampus & referral, `/api/blob/upload`, fitur `images` (avatar, logo) | A-1..A-3, G-3, G-4, I-1, I-2 lolos; test referral dan images lulus |
| **2. Paket & Langganan** | Admin paket, halaman langganan UMKM, kuota gratis lazy, pilih paket, admin tandai lunas, kuota ledger | B-1..B-3 lolos; test quota (sebagian) lulus |
| **3. Job UMKM** | CRUD draft, checklist, gambar referensi, publish (validasi deadline + snapshot + kuota), kelola job, `state-machine.ts` | C-1..C-4, BR-I3..I5; test state machine & deadline lulus |
| **4. Discovery & Klaim** | Find Jobs, filter/cari, ranking, detail + galeri, Take Job atomic, batas aktif, modal Volunteer | D-1..D-4; **test konkurensi klaim lulus** |
| **5. Eksekusi & Review** | My Jobs, workspace, start/mundur, submit, review dengan checklist, revisi, perubahan deadline | E-1..E-3; test review lulus |
| **6. Uang & Reputasi** | Ledger, poin & level, rating, earnings, penarikan, admin withdrawals, portofolio publik (dengan foto) | F-1..F-4, G-8, G-10; test ledger lulus |
| **7. Sengketa, Kegagalan, Waktu** | Dispute, FailureReport, admin keputusan, `time-rules.ts`, runner cron (§13 tugas 1–8), evaluasi lazy | E-4, G-9; test cron/time-rules idempoten lulus |
| **8. Notifikasi, Impact, Landing, Deploy** | Notifikasi lengkap + lonceng; Impact Dashboard; **landing page J-1**; audit log page; empty/loading/error states; data demo; deploy Vercel (Lampiran D) + GitHub Actions cron | H-1, G-1, G-12, G-14, J-1; seluruh test lulus; situs produksi berjalan dan cron tick sukses |
| **9. (P1)** | Newcomer Lane, auto-release klaim, opsi `.ac.id`, `/privacy` & `/terms`, aturan ESLint batas fitur, e2e Playwright | BR-C5, BR-C6, BR-A5, J-2 |

**Catatan Antigravity:** minta agent menyusun *plan* sebelum eksekusi tiap fase dan jalankan test sebagai bagian dari tugas. Review diff sebelum menerima, terutama pada `claim`, `ledger`, `review`, `guards`, dan `/api/blob/upload` karena paling rawan salah.

---

## 19. Di Luar MVP (Backlog)

Pembayaran otomatis (payment gateway + escrow sungguhan; periksa regulasi penyedia pembayaran), upgrade paket di tengah periode, **ukuran job S/M/L** yang memakai 1/2/3 kuota, sistem **Apply & Select** (alternatif FCFS), chat UMKM–mahasiswa, upload file hasil kerja langsung, store Blob **Private** untuk dokumen sensitif, cover portofolio, notifikasi email/WhatsApp, sertifikat penyelesaian, aplikasi native, matching ML, integrasi API/SIAKAD kampus, dashboard kampus, partial withdrawal, pelaporan job oleh mahasiswa, optimasi gambar sisi server, analitik performa lanjutan.

---

## 20. Keputusan & Asumsi (mohon ditinjau)

Hal-hal di bawah adalah keputusan yang menutup bagian TBD. Ubah langsung bila tidak sesuai, lalu perbarui dokumen ini.

1. **Harga paket rendah demi UMKM:** tertinggi Rp 576.000/bulan (batas tim Rp 599.000), terendah berbayar Rp 75.000. Alokasi per job Rp 25.000–48.000. Angka belum divalidasi pasar; sebaiknya diuji lewat wawancara 5–10 UMKM sebelum dipakai dalam proyeksi keuangan.
2. **Imbalan mahasiswa** Rp 15.000–28.800 per job hanya wajar untuk tugas mikro ≤ 1–4 jam. Ruang lingkup dijaga lewat panduan (BR-J9), belum ditegakkan sistem. Ukuran job S/M/L masuk backlog.
3. **Segmen Mitra vs Non-Mitra:** "Mitra Kampus" = UMKM yang ditetapkan admin sebagai mitra/binaan kampus (`isCampusPartner`), mendapat harga lebih rendah.
4. **First-come-first-served dipertahankan** untuk MVP, dilengkapi batas aktif per level dan Newcomer Lane (P1) sebagai penyeimbang.
5. **Auto-accept** setelah 3 hari tanpa review, demi melindungi mahasiswa.
6. **Penarikan** selalu saldo penuh dan manual (admin transfer di luar aplikasi). Pembayaran langganan juga manual (admin tandai lunas).
7. **Paket gratis** tetap tersedia dan menghasilkan poin penuh (+10), dengan batas 1 pekerjaan unpaid aktif per mahasiswa.
8. **Nilai poin, level, SLA, grace period** adalah default yang bisa diubah di `PlatformConfig`.
9. **Vercel Blob** dipakai hanya untuk gambar pendukung pada store Public (2 MB/file, maks 3 gambar per job). Database tetap satu (PostgreSQL via Prisma). Biaya dan kuota Blob mengikuti paket akun Vercel dan perlu dicek sebelum produksi.
10. **Hosting:** Vercel Hobby selama lomba/prototipe; Pro bila komersial. Postgres produksi di Neon. Cron lewat GitHub Actions + Vercel Cron harian + evaluasi lazy.
11. **Struktur berbasis fitur** dalam satu aplikasi Next.js (bukan repo frontend/backend terpisah).
12. **Satu akun Google = satu peran.** Pemilik UMKM yang juga mahasiswa memakai dua akun.
13. **Status hukum mahasiswa** (mitra lepas vs karyawan), pajak, dan perizinan pengelolaan dana belum dibahas; wajib ditinjau sebelum pembayaran nyata diaktifkan.

---

## Lampiran A — Setup Terminal (dikerjakan manual)

**A.1 Prasyarat:** Node.js ≥ 20.19, git, pnpm, akun GitHub, akun Vercel, akun Google Cloud, dan Docker (atau akun Neon).

```bash
node -v          # harus >= 20.19
git --version
corepack enable
pnpm -v          # bila belum ada: npm i -g pnpm
```

**A.2 Postgres lokal (Docker).** Simpan sebagai `docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:17
    environment:
      POSTGRES_USER: karta
      POSTGRES_PASSWORD: karta
      POSTGRES_DB: karta
    ports: ["5432:5432"]
    volumes: [karta_pg:/var/lib/postgresql/data]
volumes:
  karta_pg:
```

```bash
docker compose up -d
docker compose exec db psql -U karta -c "CREATE DATABASE karta_test;"
```

Tanpa Docker: buat database di Neon dan pakai connection string-nya (direct untuk `DIRECT_URL`, pooled untuk `DATABASE_URL`).

**A.3 Buat proyek.** `create-next-app` otomatis menjalankan `git init`.

```bash
pnpm create next-app@latest karta --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
cd karta
git status
```

Pilih `src/` (wajib, struktur §4.1 memakainya).

**A.4 shadcn/ui**

```bash
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input label textarea select checkbox badge card dialog alert-dialog dropdown-menu tabs table sonner skeleton form separator sheet avatar pagination
```

Bila CLI menyatakan ada komponen yang tidak tersedia, lewati komponen itu.

**A.5 Paket runtime**

```bash
pnpm add zod react-hook-form @hookform/resolvers @tanstack/react-query date-fns date-fns-tz lucide-react server-only
```

Bila muncul peringatan peer dependency antara `date-fns` dan `date-fns-tz`, ganti `date-fns-tz` dengan `@date-fns/tz`.

**A.6 Prisma 7**

```bash
pnpm add @prisma/client @prisma/adapter-pg pg dotenv
pnpm add -D prisma @types/pg tsx
pnpm prisma init --datasource-provider postgresql --output ../src/generated/prisma
```

Kerjakan manual:
1. Isi `.env`: `DATABASE_URL` dan `DIRECT_URL` (lokal keduanya sama): `postgresql://karta:karta@localhost:5432/karta`.
2. Ganti isi `prisma/schema.prisma` dengan skema §9.
3. Ganti isi `prisma.config.ts` dengan contoh §4.5, dan buat `src/lib/db.ts`.
4. Pastikan `.gitignore` memuat `.env*` dan `src/generated`.

**A.7 Migrasi pertama dengan partial unique index**

```bash
pnpm prisma migrate dev --name init --create-only
```

Buka `migration.sql` yang baru dibuat, tambahkan di bagian paling bawah:

```sql
CREATE UNIQUE INDEX "one_active_assignment_per_job"
  ON "JobAssignment" ("jobId") WHERE "status" = 'ACTIVE';
```

```bash
pnpm prisma migrate dev
```

**A.8 Auth.js dan Google OAuth**

```bash
pnpm add next-auth@beta @auth/prisma-adapter
pnpm dlx auth secret
```

Di Google Cloud Console: buat proyek → APIs & Services → Credentials → OAuth client ID bertipe **Web application** → Authorized redirect URI `http://localhost:3000/api/auth/callback/google`. Selama consent screen mode *Testing*, tambahkan emailmu sebagai test user. Salin Client ID dan Secret ke `.env.local` (lihat Lampiran B).

**A.9 Vercel Blob**

```bash
pnpm add @vercel/blob browser-image-compression
pnpm dlx vercel login
pnpm dlx vercel link
```

Di dashboard Vercel: Project → Storage → Create → **Blob**, akses **Public**, nama `karta-images-dev`. Tarik env ke file terpisah agar `.env.local` tidak tertimpa, lalu salin `BLOB_READ_WRITE_TOKEN`:

```bash
pnpm dlx vercel env pull .env.vercel.local
```

**A.10 Vitest**

```bash
pnpm add -D vitest vite-tsconfig-paths dotenv-cli
mkdir -p tests/mocks && echo "export {};" > tests/mocks/server-only.ts
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "server-only": fileURLToPath(new URL("./tests/mocks/server-only.ts", import.meta.url)),
    },
  },
  test: { environment: "node", setupFiles: ["./tests/setup.ts"] },
});
```

`.env.test` berisi `DATABASE_URL` dan `DIRECT_URL` yang menunjuk ke `karta_test`. Tambahkan script di `package.json`:

```json
"typecheck": "tsc --noEmit",
"test": "dotenv -e .env.test -- vitest run",
"db:migrate": "prisma migrate dev",
"db:test:migrate": "dotenv -e .env.test -- prisma migrate deploy",
"db:seed": "prisma db seed",
"db:studio": "prisma studio",
"postinstall": "prisma generate"
```

Script `lint` biarkan memakai bawaan `create-next-app`. Jalankan `pnpm db:test:migrate` sekali sebelum test pertama.

**A.11 Jalankan**

```bash
pnpm dev     # http://localhost:3000
```

**A.12 Git**

```bash
mkdir docs && cp /path/ke/KARTA-PRD-v1.1-FINAL.md docs/PRD.md
git add -A && git commit -m "chore: setup fondasi"
git remote add origin <url-repo>
git push -u origin main
git switch -c fase-1-auth      # satu branch per fase
```

---

## Lampiran B — `.env.example`

```bash
# Database (Prisma 7)
DATABASE_URL="postgresql://karta:karta@localhost:5432/karta"   # runtime (produksi: pooled)
DIRECT_URL="postgresql://karta:karta@localhost:5432/karta"     # migrasi (produksi: direct)

# Auth.js
AUTH_SECRET=""
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
ADMIN_EMAILS="emailmu@gmail.com"

# App
APP_URL="http://localhost:3000"
CRON_SECRET=""

# Vercel Blob (server-only, jangan pakai NEXT_PUBLIC_)
BLOB_READ_WRITE_TOKEN=""
```

---

## Lampiran C — Prompt kickoff agent

Fase 0 dikerjakan manual lewat Lampiran A. Untuk fase 1 dan seterusnya, tempel di sesi baru Antigravity:

```
Baca docs/PRD.md secara lengkap. Kerjakan HANYA Fase <N> (§18).
Buat rencana singkat dulu dan tunggu saya setujui, lalu implementasikan.
Ikuti aturan §0.1, struktur folder §4.1, dan aturan dependensi §4.3.
Jalankan pnpm typecheck, pnpm lint, dan pnpm test sebelum menyatakan selesai.
Catat keputusan di docs/DECISIONS.md. Jangan mengerjakan fitur di luar Fase <N>.
```

---

## Lampiran D — Cron & Deploy

**D.1 `vercel.json`** (cadangan harian, 03:00 WIB = 20:00 UTC):

```json
{
  "crons": [{ "path": "/api/cron/tick", "schedule": "0 20 * * *" }]
}
```

**D.2 `.github/workflows/cron.yml`** (tiap jam):

```yaml
name: cron-tick
on:
  schedule:
    - cron: "5 * * * *"
  workflow_dispatch:
jobs:
  tick:
    runs-on: ubuntu-latest
    steps:
      - name: Panggil KARTA cron tick
        run: |
          curl -fsS "${{ secrets.APP_URL }}/api/cron/tick" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Tambahkan secrets `APP_URL` dan `CRON_SECRET` di GitHub → Settings → Secrets and variables → Actions. Jadwal GitHub Actions dapat terlambat beberapa menit; itu dapat diterima karena aturan waktu juga dievaluasi *lazy*.

**D.3 Checklist deploy (Fase 8)**
1. Push repo ke GitHub, import ke Vercel.
2. Buat database Neon (Marketplace). Isi `DATABASE_URL` (pooled) dan `DIRECT_URL` (direct) di Vercel Environment Variables.
3. Isi seluruh env Lampiran B untuk Production. Buat store Blob produksi (`karta-images-prod`, Public) dan isi `BLOB_READ_WRITE_TOKEN` produksi.
4. Jalankan migrasi ke database produksi: `pnpm prisma migrate deploy` (dengan `DIRECT_URL` produksi), lalu seed data dasar (paket, `DeadlineRule`, `PlatformConfig`, admin) tanpa data demo.
5. Tambahkan Authorized redirect URI produksi di Google Cloud.
6. Tambahkan secrets GitHub Actions, lalu jalankan workflow `cron-tick` manual (`workflow_dispatch`) dan pastikan respons sukses.
7. Uji alur penuh di produksi: login → onboarding → publish → klaim → submit → review → penarikan → tandai dibayar.
