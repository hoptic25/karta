This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Fitur MVP

| Peran | Fitur utama |
|---|---|
| **UMKM** | Langganan dan kuota, buat dan publish pekerjaan, checklist kriteria, review hasil, revisi, rating mahasiswa |
| **Mahasiswa** | Registrasi dengan kode kampus, cari dan ambil pekerjaan, kumpulkan hasil via tautan, saldo dan penarikan, poin, level, rating, portofolio publik |
| **Admin** | Kelola kampus, kode referral, paket, pekerjaan, transaksi, sengketa, laporan kegagalan, konfigurasi, dan Impact Dashboard |

Kategori pekerjaan: Data Entry, Content Writer, Graphic Designer, Video Editor, Social Media Officer, Junior Frontend Developer, UI/UX Designer.

Paket gratis menyediakan 3 pekerjaan per bulan yang berlabel **Volunteer Project** (tanpa imbalan uang, mahasiswa tetap mendapat poin).

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Database | PostgreSQL + Prisma ORM 7 |
| Autentikasi | Auth.js v5 (Google OAuth) |
| UI | Tailwind CSS, shadcn/ui, lucide-react |
| Form dan validasi | React Hook Form, Zod |
| Penyimpanan gambar | Vercel Blob |
| Pengujian | Vitest |
| Hosting | Vercel |

Arsitektur: **satu aplikasi Next.js (modular monolith)** dengan struktur berbasis fitur.

```
src/
├─ app/          # routing dan halaman (tipis)
├─ features/     # satu folder per domain: auth, jobs, subscription, wallet, ...
├─ components/   # ui (shadcn) dan layout
└─ lib/          # helper, konfigurasi database
prisma/          # schema, migrasi, seed
docs/            # PRD dan design system
```

## Memulai (Development)

**Prasyarat:** Node.js ≥ 20.19, pnpm, PostgreSQL (lokal atau Neon), akun Google Cloud untuk OAuth.

```bash
# 1. Clone dan install
git clone https://github.com/<username-github>/karta.git
cd karta
pnpm install

# 2. Salin env, lalu isi nilainya
cp .env.example .env.local        # PowerShell: Copy-Item .env.example .env.local

# 3. Siapkan database
pnpm db:migrate
pnpm db:seed

# 4. Jalankan
pnpm dev                          # http://localhost:3000
```

### Variabel lingkungan

| Variabel | Fungsi |
|---|---|
| `DATABASE_URL` | Koneksi database saat runtime (produksi: *pooled*) |
| `DIRECT_URL` | Koneksi langsung untuk migrasi |
| `AUTH_SECRET` | Rahasia sesi (`pnpm dlx auth secret`) |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Kredensial Google OAuth |
| `ADMIN_EMAILS` | Daftar email admin, dipisah koma |
| `APP_URL` | URL aplikasi |
| `CRON_SECRET` | Rahasia untuk endpoint cron |
| `BLOB_READ_WRITE_TOKEN` | Token Vercel Blob (khusus server) |

Panduan setup lengkap, termasuk langkah migrasi manual untuk *partial unique index*, ada di Lampiran A pada [`docs/PRD.md`](docs/PRD.md).

### Skrip

| Perintah | Fungsi |
|---|---|
| `pnpm dev` | Jalankan server development |
| `pnpm build` | Build produksi |
| `pnpm typecheck` | Cek tipe TypeScript |
| `pnpm lint` | Jalankan ESLint |
| `pnpm test` | Jalankan Vitest |
| `pnpm db:migrate` | Jalankan migrasi Prisma |
| `pnpm db:seed` | Isi data awal |
| `pnpm db:studio` | Buka Prisma Studio |

## Dokumentasi

| Dokumen | Isi |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Spesifikasi produk untuk developer: aturan bisnis, skema data, fitur, rencana build |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Panduan visual dan komponen UI |

## Alur Git

| Branch | Fungsi |
|---|---|
| `main` | Kode stabil, mengarah ke deploy produksi |
| `dev` | Tempat menggabungkan hasil tiap fase |
| `fase-N-nama` | Branch kerja per fase, dibuat dari `dev` |

Perubahan masuk ke `dev` lewat merge dari branch fase, lalu naik ke `main` lewat Pull Request.

## Status dan Roadmap

## Tim

| Peran | Fokus |
|---|---|
| Business & Product | Strategi bisnis, riset pasar, perencanaan produk |
| System Architect & Full-Stack Developer | Arsitektur sistem, UI/UX, frontend, backend, database, deployment |
| Finance | Perencanaan keuangan, kelayakan bisnis, penganggaran |

## Lisensi

Belum ditentukan. Selama belum ada lisensi, seluruh hak cipta dipegang oleh tim pengembang.
