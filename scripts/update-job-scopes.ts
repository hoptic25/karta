import "dotenv/config";
import { prisma } from "../src/lib/db";

async function main() {
  console.log("=== MEMPERBARUI SCOPE TUGAS MIKRO AGAR PROPORSIONAL & TIDAK MEMBERATKAN MAHASISWA ===");

  // Definisi tugas mikro baru yang proporsional (tugas cepat, terukur, pas untuk 30-60 menit)
  const jobUpdates = [
    // 1. Kopi Karsa Nusantara
    {
      oldTitleMatch: "Desain 5 Konten Feed Instagram",
      newTitle: "Desain 1 Poster Feed Instagram Menu Seasonal Cold Brew",
      newDescription: "Membuat 1 desain poster feed Instagram persegi (1080x1080px) untuk promosi menu baru seasonal Cold Brew. Foto botol produk dan logo resolusi tinggi sudah disiapkan di Google Drive.",
      newInstructions: "Gunakan Figma atau Canva. Cukup 1 artboard desain siap publish dengan gaya minimalis estetik.",
      criteria: [
        "1 feed desain 1080x1080px format PNG/JPG tajam",
        "Menggunakan elemen foto botol dan logo resmi Kopi Karsa",
        "Menyertakan tautan link Figma atau Canva view",
      ],
    },
    {
      oldTitleMatch: "Video Reels & TikTok Eksplorasi Proses Roasting",
      newTitle: "Editing 1 Video Reels Singkat Menu Cold Brew (15-20 Detik)",
      newDescription: "Memotong dan menggabungkan 3-4 potongan video mentah pendek menjadi 1 video Reels/TikTok singkat 15-20 detik dengan transisi clean dan teks nama menu.",
      newInstructions: "Bahan mentah video 3 klip pendek (total 40 detik) sudah ada di Drive. Cukup potong, beri musik background bawaan reels, dan teks ringkas.",
      criteria: [
        "Durasi video 15-20 detik format vertikal 9:16",
        "Penyuntingan klip halus tanpa watermark aplikasi pihak ketiga",
        "Ekspor format MP4 1080p",
      ],
    },

    // 2. Batik Sekar Prameswari
    {
      oldTitleMatch: "Penulisan 3 Artikel Storytelling Edukasi Motif Batik",
      newTitle: "Penulisan 1 Caption Storytelling Motif Batik Parang (1 Paragraf)",
      newDescription: "Menulis 1 paragraf storytelling singkat (80–120 kata) mengenai makna filosofis motif batik Parang yang cocok dijadikan caption Instagram dan status WhatsApp promosi.",
      newInstructions: "Tulis di Google Docs. Bahasa santun, mengalir, dan sertakan 5 saran hashtag relevan.",
      criteria: [
        "Panjang teks 80–120 kata, rapi dan bebas typo",
        "Menjelaskan makna filosofis motif batik secara ringkas",
        "Menyertakan 5 rekomendasi hashtag",
      ],
    },
    {
      oldTitleMatch: "Penyusunan E-Katalog Produk Koleksi Kemeja",
      newTitle: "Penyusunan 1 Lembar Flyer Ringkasan Pricelist Batik (Single Page)",
      newDescription: "Menata 4 foto produk batik dan daftar harga ke dalam 1 lembar flyer digital/pricelist A4 satu sisi yang mudah dibagikan via WhatsApp.",
      newInstructions: "Gunakan Canva atau Figma. Foto dan daftar harga sudah siap, cukup ditata rapi dalam 1 halaman.",
      criteria: [
        "Desain flyer 1 halaman (single page) yang proporsional dan mudah dibaca",
        "Mencantumkan 4 foto produk beserta nama artikel dan harganya",
        "Ekspor file PDF/JPG berukuran ringan (< 2MB)",
      ],
    },

    // 3. Dapur Sambal Mak Etek
    {
      oldTitleMatch: "Input & Rekap Data Penjualan Toko Online",
      newTitle: "Input 25 Baris Data Transaksi Penjualan ke Google Sheets",
      newDescription: "Membantu menyalin 25 baris invoice penjualan harian dari foto nota fisik ke dalam tabel master spreadsheet Google Sheets.",
      newInstructions: "Template Google Sheets sudah disediakan dengan kolom yang jelas. Hanya ada 25 baris data.",
      criteria: [
        "25 baris transaksi terisi lengkap dan akurat sesuai nota",
        "Kolom tanggal, nama barang, jumlah, dan nominal cocok",
        "Tidak ada baris yang dobel",
      ],
    },
    {
      oldTitleMatch: "Penyusunan Kalender Konten Media Sosial 2 Minggu",
      newTitle: "Penyusunan 3 Ide Konten Instagram Sambal Mak Etek",
      newDescription: "Menuliskan 3 ide postingan sederhana (tema, hook kalimat pertama, dan saran visual) untuk konten mingguan sambal kemasan.",
      newInstructions: "Cukup tuliskan dalam bentuk bullet point atau tabel sederhana 3 baris di Google Docs.",
      criteria: [
        "Berisi 3 ide konten yang aplikatif untuk produk makanan kemasan",
        "Tiap ide dilengkapi hook kalimat pembuka dan deskripsi visual singkat",
        "Dikerjakan dalam Google Docs dengan akses view",
      ],
    },

    // 4. GlowUp Botanicals Skincare
    {
      oldTitleMatch: "Desain UI Prototipe Mobile Halaman Katalog",
      newTitle: "Desain 1 Kartu Komponen UI Produk Skincare di Figma",
      newDescription: "Merancang 1 komponen UI kartu produk mobile (Product Card) di Figma yang memuat foto botol, label nama serum, rating bintang, dan tombol 'Beli'.",
      newInstructions: "Gunakan Figma dengan auto-layout sederhana. Hanya mendesain 1 komponen card, bukan keseluruhan halaman aplikasi.",
      criteria: [
        "1 frame kartu produk mobile bersih dan estetik",
        "Memanfaatkan sistem auto-layout Figma",
        "Link publik Figma siap ditinjau",
      ],
    },
    {
      oldTitleMatch: "Implementasi Komponen Frontend Responsif FAQ",
      newTitle: "Styling CSS/Tailwind 1 Komponen Kartu Produk Sederhana",
      newDescription: "Merapikan styling CSS/Tailwind untuk 1 komponen kartu produk (gambar, judul, harga, dan tombol) agar responsif dan tampil manis di browser.",
      newInstructions: "Kode markup HTML sudah disiapkan, tinggal beri utility classes Tailwind sederhana.",
      criteria: [
        "Komponen kartu tampil rapi di tampilan mobile maupun desktop",
        "Bebas error konsol",
        "Tautan kode GitHub Gist atau StackBlitz/CodeSandbox",
      ],
    },

    // 5. Reka Kreasi Grafika
    {
      oldTitleMatch: "Riset Kontak 50 Organisasi Mahasiswa",
      newTitle: "Riset Kontak 10 Akun Instagram Himpunan Kampus",
      newDescription: "Mencari 10 tautan akun Instagram resmi himpunan/BEM fakultas di wilayah Yogyakarta dan mencatat nama akun serta email humasnya.",
      newInstructions: "Catat ke dalam 10 baris tabel Google Sheets yang sudah disiapkan.",
      criteria: [
        "10 kontak himpunan/organisasi kampus valid dan aktif",
        "Mencakup Nama Kampus, Organisasi, username Instagram, dan email",
        "Data rapi tanpa kesalahan pengetikan",
      ],
    },
    {
      oldTitleMatch: "Video Animasi Bumper Intro Logo",
      newTitle: "Penyesuaian Resolusi & Format Logo untuk Foto Profil Medsos",
      newDescription: "Mengekspor logo vektor yang sudah ada menjadi format foto profil medsos (lingkaran 500x500px) dengan background putih dan transparan.",
      newInstructions: "File master logo vektor format SVG/PNG resolusi tinggi sudah disediakan, cukup crop dan ekspor ke 2 file gambar siap pakai.",
      criteria: [
        "1 file PNG transparan 500x500px dan 1 file JPG background putih",
        "Posisi logo pas tepat di tengah area aman lingkaran medsos",
        "Gambar tajam tanpa pecah",
      ],
    },
  ];

  const allJobs = await prisma.job.findMany({
    include: { criteria: true },
  });

  console.log(`Ditemukan ${allJobs.length} pekerjaan di database. Memperbarui...`);

  for (const job of allJobs) {
    const matched = jobUpdates.find((u) =>
      job.title.toLowerCase().includes(u.oldTitleMatch.toLowerCase())
    );

    if (matched) {
      // 1. Update data pekerjaan utama
      await prisma.job.update({
        where: { id: job.id },
        data: {
          title: matched.newTitle,
          description: matched.newDescription,
          instructions: matched.newInstructions,
        },
      });

      // 2. Perbarui Acceptance Criteria agar proporsional
      await prisma.acceptanceCriterion.deleteMany({
        where: { jobId: job.id },
      });

      await prisma.acceptanceCriterion.createMany({
        data: matched.criteria.map((text, idx) => ({
          jobId: job.id,
          text,
          position: idx + 1,
        })),
      });

      console.log(`✓ Job "${job.title}" diperbarui menjadi: "${matched.newTitle}"`);
    } else {
      console.log(`- Job "${job.title}" tidak ada template spesifik, dibiarkan.`);
    }
  }

  console.log("\n=== SELESAI MEMPERBARUI SCOPE PEKERJAAN MIKRO ===");
}

main()
  .catch((err) => {
    console.error("Gagal update jobs:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

