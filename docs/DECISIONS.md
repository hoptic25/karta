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

