# Karta Design System

Dokumen ini memuat panduan antarmuka dan sistem desain untuk Karta, sebuah platform B2B2C Campus-Based Micro Job Marketplace. Desain ini mengutamakan tampilan yang bersih, fungsional, profesional, dan menghindari pola desain template generik.

## 1. Konsep Visual
Karta menghubungkan UMKM dengan mahasiswa. Oleh karena itu, pendekatan visual yang digunakan harus terasa membumi, dapat dipercaya, dan elegan. Kita menghindari elemen tren sesaat seperti Announcement Bar, Eyebrow Badge, atau Announcement Pill agar UI tetap berfokus pada konten inti (tugas mikro, dashboard UMKM, dan metrik mahasiswa).

## 2. Palet Warna

Warna Karta menggunakan pendekatan earth-tone yang memberikan kesan profesional, hangat, dan bertumbuh.

*   **Primary Brown** (`#5a4639`): Digunakan untuk logo utama, teks heading, tombol aksi utama (Primary Button), dan elemen navigasi aktif.
*   **Sage Green** (`#a3b18a`): Digunakan untuk tombol sukses, indikator status pekerjaan "Accepted" atau "Paid", dan aksen keberhasilan.
*   **Beige** (`#c9b9a7`): Digunakan untuk warna border, pemisah konten, latar belakang kartu sekunder (Secondary Card), dan tombol sekunder.
*   **Cream** (`#f7f4ed`): Digunakan sebagai warna latar belakang utama (Main Background) aplikasi untuk memberikan kontras yang lembut dan tidak menyilaukan mata.
*   **Peach** (`#f4d7c7`): Digunakan untuk aksen peringatan ringan, highlight notifikasi in-app, atau status pekerjaan "Reserved".

## 3. Tipografi

Sistem tipografi Karta menggabungkan keanggunan serif untuk tajuk dan kejelasan sans-serif untuk antarmuka pengguna.

**Font Keluarga:**
*   **Heading:** Playfair Display (Serif)
*   **Body & UI:** Montserrat (Sans-serif)

**Hierarki Ukuran:**
*   **Heading 1 (H1):** Playfair Display, 40px, Bold (Untuk judul halaman utama seperti Dashboard)
*   **Heading 2 (H2):** Playfair Display, 32px, Semi-Bold (Untuk judul seksi seperti "Daftar Pekerjaan" atau "Profil UMKM")
*   **Heading 3 (H3):** Playfair Display, 24px, Medium (Untuk judul kartu pekerjaan atau nama modal)
*   **Body Large:** Montserrat, 16px, Regular (Untuk teks paragraf panjang, deskripsi pekerjaan, dan instruksi)
*   **Body Default:** Montserrat, 14px, Regular (Untuk teks antarmuka standar, form input, dan detail metadata)
*   **Small Text:** Montserrat, 12px, Regular (Untuk catatan kaki, timestamp waktu publikasi, dan keterangan limit kuota)
*   **Button Text:** Montserrat, 14px, Semi-Bold, Uppercase (Untuk teks di dalam tombol aksi)

## 4. Komponen Antarmuka (UI Components)

### Aturan Ketat Antarmuka
1. Dilarang keras menggunakan Announcement Bar di bagian atas navigasi.
2. Dilarang menggunakan Eyebrow Badge di atas judul halaman atau kartu.
3. Dilarang menggunakan Announcement Pill untuk tag status.
4. Jangan menggunakan gaya desain yang terlalu mencolok atau *AI slop*. Pertahankan margin yang luas, whitespace yang bersih, dan susunan grid klasik yang rapi.

### Kartu Pekerjaan (Job Cards)
*   **Background:** Putih murni (`#ffffff`) atau Beige (`#c9b9a7`) untuk pekerjaan dari paket Premium.
*   **Border:** Solid 1px Beige (`#c9b9a7`), radius sudut (border-radius) maksimal 8px untuk kesan tegas namun tidak terlalu kaku.
*   **Shadow:** Hindari drop-shadow tebal. Gunakan bayangan yang sangat tipis atau cukup andalkan border untuk memisahkan kartu dari latar belakang Cream.

### Tombol (Buttons)
*   **Primary Button:** Background Primary Brown (`#5a4639`), teks putih murni. Radius 6px.
*   **Secondary Button:** Background transparan, border 1px Primary Brown (`#5a4639`), teks Primary Brown.
*   **Action/Success Button:** Background Sage Green (`#a3b18a`), teks putih. Digunakan khusus untuk aksi seperti "Terima Pekerjaan" atau "Kirim Hasil".

### Form & Input
*   **Input Field:** Background putih, border 1px Beige (`#c9b9a7`). Saat aktif (focus), border berubah menjadi Primary Brown (`#5a4639`).
*   **Label:** Teks Body Default, warna Primary Brown (`#5a4639`), tebal (Medium).

## 5. Layout Dashboard
Terdapat tiga variasi dashboard dengan fondasi layout yang sama (Sidebar di kiri, Konten di kanan).

*   **Dashboard Mahasiswa:** Fokus pada metrik Poin, Rating, Saldo (Reserved, Payable, Paid), dan daftar pekerjaan aktif yang dimenangkan dengan sistem *first-come-first-served*.
*   **Dashboard UMKM:** Fokus pada alokasi kuota pekerjaan, manajemen status pekerjaan (Menunggu, Dikerjakan, Review, Selesai), dan monitoring hasil tautan eksternal dari mahasiswa.
*   **Dashboard Admin:** Fokus pada tabel data ringkas untuk manajemen kampus, validasi kode referral, penyelesaian sengketa (dispute), dan moderasi reputasi.

## 6. Notifikasi Dalam Aplikasi (In-App Notification)
Notifikasi muncul berupa panel *flyout* dari ikon lonceng di navigasi atas. 
*   **Desain Panel:** Latar belakang putih dengan border Beige.
*   **Item Notifikasi:** Menggunakan ikon sederhana, teks ringkas (Montserrat 14px), dengan aksen warna Peach (`#f4d7c7`) untuk notifikasi yang belum dibaca.