import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";
import { PackageTier, StudentLevel } from "../src/generated/prisma/client";

const PRESERVED_EMAILS = [
  "hoptic25@gmail.com",
  "admin@karta.id",
  "renatha.tech@gmail.com",
  "renatha.office@gmail.com",
  "renathatech@gmail.com",
  "renatga.office@gmail.com",
];

async function main() {
  console.log("=== MEMULAI PEMBERSIHAN DATA DUMMY & SEED BARU ===");

  // 1. Identifikasi user yang akan dihapus
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true },
  });

  const usersToDelete = allUsers.filter(
    (u) => !PRESERVED_EMAILS.some((preserved) => preserved.toLowerCase() === u.email.toLowerCase())
  );

  console.log(
    `Menemukan ${usersToDelete.length} user dummy untuk dibersihkan. Akun preserved:`,
    PRESERVED_EMAILS
  );

  const userIdsToDelete = usersToDelete.map((u) => u.id);

  if (userIdsToDelete.length > 0) {
    // Cari semua UMKM dan Student milik user yang akan dihapus
    const umkmsToDelete = await prisma.umkmProfile.findMany({
      where: { userId: { in: userIdsToDelete } },
      select: { id: true },
    });
    const umkmIdsToDelete = umkmsToDelete.map((u) => u.id);

    const studentsToDelete = await prisma.studentProfile.findMany({
      where: { userId: { in: userIdsToDelete } },
      select: { id: true },
    });
    const studentIdsToDelete = studentsToDelete.map((s) => s.id);

    // Cari jobs yang terkait
    const jobsToDelete = await prisma.job.findMany({
      where: { umkmId: { in: umkmIdsToDelete } },
      select: { id: true },
    });
    const jobIdsToDelete = jobsToDelete.map((j) => j.id);

    console.log(`Membersihkan relasi untuk ${jobIdsToDelete.length} jobs lama...`);

    // Hapus review dan submission terkait job/assignment
    await prisma.review.deleteMany({
      where: {
        OR: [
          { submission: { jobId: { in: jobIdsToDelete } } },
          { submission: { assignment: { studentId: { in: studentIdsToDelete } } } },
        ],
      },
    });

    await prisma.submission.deleteMany({
      where: {
        OR: [
          { jobId: { in: jobIdsToDelete } },
          { assignment: { studentId: { in: studentIdsToDelete } } },
        ],
      },
    });

    if (jobIdsToDelete.length > 0) {
      await prisma.acceptanceCriterion.deleteMany({
        where: { jobId: { in: jobIdsToDelete } },
      });
      await prisma.dispute.deleteMany({
        where: { jobId: { in: jobIdsToDelete } },
      });
      await prisma.rating.deleteMany({
        where: { jobId: { in: jobIdsToDelete } },
      });
      await prisma.failureReport.deleteMany({
        where: { jobId: { in: jobIdsToDelete } },
      });
      await prisma.deadlineChangeRequest.deleteMany({
        where: { jobId: { in: jobIdsToDelete } },
      });
      await prisma.ledgerEntry.deleteMany({
        where: { jobId: { in: jobIdsToDelete } },
      });
      await prisma.jobAssignment.deleteMany({
        where: { jobId: { in: jobIdsToDelete } },
      });
      await prisma.imageAsset.deleteMany({
        where: { jobId: { in: jobIdsToDelete } },
      });
      await prisma.job.deleteMany({
        where: { id: { in: jobIdsToDelete } },
      });
    }

    if (studentIdsToDelete.length > 0) {
      await prisma.jobAssignment.deleteMany({
        where: { studentId: { in: studentIdsToDelete } },
      });
      await prisma.ledgerEntry.deleteMany({
        where: { studentId: { in: studentIdsToDelete } },
      });
      await prisma.pointEvent.deleteMany({
        where: { studentId: { in: studentIdsToDelete } },
      });
      await prisma.withdrawal.deleteMany({
        where: { studentId: { in: studentIdsToDelete } },
      });
      await prisma.studentProfile.deleteMany({
        where: { id: { in: studentIdsToDelete } },
      });
    }

    if (umkmIdsToDelete.length > 0) {
      await prisma.quotaLedger.deleteMany({
        where: { subscription: { umkmId: { in: umkmIdsToDelete } } },
      });
      await prisma.subscription.deleteMany({
        where: { umkmId: { in: umkmIdsToDelete } },
      });
      await prisma.umkmProfile.deleteMany({
        where: { id: { in: umkmIdsToDelete } },
      });
    }

    // Hapus akun & notifikasi user
    await prisma.notification.deleteMany({
      where: { userId: { in: userIdsToDelete } },
    });
    await prisma.auditLog.deleteMany({
      where: { actorId: { in: userIdsToDelete } },
    });
    await prisma.account.deleteMany({
      where: { userId: { in: userIdsToDelete } },
    });
    await prisma.session.deleteMany({
      where: { userId: { in: userIdsToDelete } },
    });

    await prisma.user.deleteMany({
      where: { id: { in: userIdsToDelete } },
    });

    console.log("Pembersihan akun dummy lama selesai!");
  } else {
    console.log("Tidak ada akun dummy lama yang perlu dibersihkan.");
  }

  // 2. Persiapan Data Master
  const campuses = await prisma.campus.findMany();
  if (campuses.length === 0) {
    throw new Error("Tidak ada kampus di database. Pastikan tabel Campus sudah terisi.");
  }
  const itbCampus = campuses.find((c) => c.name.includes("Bandung")) || campuses[0];
  const ugmCampus = campuses.find((c) => c.name.includes("Gadjah Mada")) || campuses[campuses.length - 1];

  const jobRoles = await prisma.jobRole.findMany({ where: { isActive: true } });
  const roleMap: Record<string, string> = {};
  for (const r of jobRoles) {
    roleMap[r.key] = r.id;
  }
  console.log("Job Roles aktif:", Object.keys(roleMap));

  const packages = await prisma.package.findMany({ where: { isActive: true } });
  const partnerBasicPkg = packages.find((p) => p.code === "PARTNER_BASIC") || packages[0];
  const partnerProPkg = packages.find((p) => p.code === "PARTNER_PROFESSIONAL") || packages[1] || packages[0];
  const partnerPremiumPkg = packages.find((p) => p.code === "PARTNER_PREMIUM") || packages[2] || packages[0];

  const defaultPasswordHash = await bcrypt.hash("Karta2026!", 10);

  // 3. SEED 5 AKUN DUMMY MAHASISWA
  console.log("\nMembuat 5 Akun Dummy Mahasiswa...");
  const dummyStudents = [
    {
      name: "Aditya Pratama",
      email: "aditya.pratama@mhs.itb.ac.id",
      username: "adityapratama",
      campusId: itbCampus.id,
      studyProgram: "Teknik Informatika",
      bio: "Mahasiswa Informatika yang fokus pada pengembangan web frontend modern dan desain antarmuka responsif.",
      skills: ["React", "TypeScript", "Tailwind CSS", "Next.js"],
      roleKeys: ["FRONTEND_DEV", "UIUX_DESIGNER"],
      points: 120,
      level: StudentLevel.RELIABLE,
      ratingAvg: 4.9,
      ratingCount: 6,
      completedJobs: 6,
    },
    {
      name: "Nadia Safira",
      email: "nadia.safira@mail.ugm.ac.id",
      username: "nadiasafira",
      campusId: ugmCampus.id,
      studyProgram: "Desain Komunikasi Visual",
      bio: "Kreator konten visual, ilustrator, dan desainer grafis dengan pengalaman branding UMKM lokal.",
      skills: ["Figma", "Adobe Illustrator", "Canva", "Social Media Feed"],
      roleKeys: ["GRAPHIC_DESIGNER", "SOCIAL_MEDIA"],
      points: 95,
      level: StudentLevel.RELIABLE,
      ratingAvg: 4.8,
      ratingCount: 5,
      completedJobs: 5,
    },
    {
      name: "Farhan Ramadhan",
      email: "farhan.ramadhan@mhs.itb.ac.id",
      username: "farhanramadhan",
      campusId: itbCampus.id,
      studyProgram: "Manajemen Bisnis",
      bio: "Teliti dalam pengolahan data, rekapitulasi keuangan sederhana, dan riset pasar digital untuk UMKM.",
      skills: ["Excel / Google Sheets", "Data Entry", "Market Research", "Pivot Table"],
      roleKeys: ["DATA_ENTRY", "CONTENT_WRITER"],
      points: 50,
      level: StudentLevel.NEWCOMER,
      ratingAvg: 5.0,
      ratingCount: 2,
      completedJobs: 2,
    },
    {
      name: "Claudia Wijaya",
      email: "claudia.wijaya@mail.ugm.ac.id",
      username: "claudiawijaya",
      campusId: ugmCampus.id,
      studyProgram: "Ilmu Komunikasi",
      bio: "Penulis konten kreatif, copywriter iklan sosial media, dan storyteller produk lokal Nusantara.",
      skills: ["Copywriting", "Storytelling", "SEO Writing", "Instagram Reels Script"],
      roleKeys: ["CONTENT_WRITER", "SOCIAL_MEDIA"],
      points: 160,
      level: StudentLevel.TRUSTED,
      ratingAvg: 4.9,
      ratingCount: 9,
      completedJobs: 9,
    },
    {
      name: "Reza Firmansyah",
      email: "reza.firmansyah@mhs.itb.ac.id",
      username: "rezafirmansyah",
      campusId: itbCampus.id,
      studyProgram: "Desain Produk & Multimedia",
      bio: "Video editor dan animator video pendek untuk kebutuhan promosi TikTok dan Instagram Reels.",
      skills: ["CapCut", "Adobe Premiere Pro", "After Effects", "Color Grading"],
      roleKeys: ["VIDEO_EDITOR", "GRAPHIC_DESIGNER"],
      points: 80,
      level: StudentLevel.RELIABLE,
      ratingAvg: 4.7,
      ratingCount: 4,
      completedJobs: 4,
    },
  ];

  for (const s of dummyStudents) {
    const studentUser = await prisma.user.create({
      data: {
        name: s.name,
        email: s.email,
        password: defaultPasswordHash,
        role: "STUDENT",
        status: "ACTIVE",
        student: {
          create: {
            username: s.username,
            fullName: s.name,
            campusId: s.campusId,
            studyProgram: s.studyProgram,
            bio: s.bio,
            skills: s.skills,
            jobRoleIds: s.roleKeys.map((k) => roleMap[k]).filter(Boolean),
            points: s.points,
            level: s.level,
            ratingAvg: s.ratingAvg,
            ratingCount: s.ratingCount,
            completedJobs: s.completedJobs,
            portfolioPublic: true,
            jobRoles: {
              connect: s.roleKeys.map((k) => ({ id: roleMap[k] })).filter((item) => !!item.id),
            },
          },
        },
      },
    });
    console.log(`✓ Mahasiswa dibuat: ${studentUser.name} (${studentUser.email})`);
  }

  // 4. SEED 5 AKUN DUMMY UMKM + 2 PROJECT MASING-MASING
  console.log("\nMembuat 5 Akun Dummy UMKM (Nama Bisnis) & 10 Project...");

  const now = new Date();
  const deadline1 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 hari ke depan
  const deadline2 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 hari ke depan
  const subEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const dummyUmkms = [
    {
      businessName: "Kopi Karsa Nusantara",
      email: "halo@kopikarsa.id",
      category: "Kuliner & Kedai Kopi",
      city: "Bandung",
      province: "Jawa Barat",
      description: "Produsen biji kopi lokal artisanal dan kedai kopi modern yang mengangkat cita rasa kopi Jawa Barat.",
      package: partnerProPkg,
      projects: [
        {
          title: "Desain 5 Konten Feed Instagram & Story Menu Baru Signature",
          roleKey: "GRAPHIC_DESIGNER",
          deliverableType: "FIGMA",
          description: "Dibutuhkan mahasiswa desain grafis untuk membuat 5 template postingan feed Instagram (1080x1080) dan 3 template story (1080x1920) untuk peluncuran menu seasonal cold brew Kopi Karsa. Foto produk resolusi tinggi dan panduan palet warna earth-tone akan disediakan via Google Drive.",
          instructions: "Gunakan software Figma atau Canva. Pastikan desain bersih, estetik, dan menonjolkan visual botol kopi.",
          criteria: [
            "Ukuran feed 1080x1080px dan story 1080x1920px (resolusi tajam)",
            "Mengikuti palet warna brand Kopi Karsa (krem, cokelat tua, hijau sage)",
            "Melampirkan tautan source file (Figma link atau Canva view/edit)",
          ],
        },
        {
          title: "Video Reels & TikTok Eksplorasi Proses Roasting Biji Kopi (30-45 Detik)",
          roleKey: "VIDEO_EDITOR",
          deliverableType: "DRIVE",
          description: "Mengedit video pendek reels/TikTok berdurasi 30-45 detik dari kumpulan footage mentah proses penyangraian (roasting) biji kopi arabika. Perlu audio estetik kekinian, efek transisi halus, dan subtitle dinamis.",
          instructions: "Bahan mentah video berdurasi 5 menit tersedia di Google Drive. Hasil akhir di-upload kembali ke Google Drive.",
          criteria: [
            "Aspek rasio vertikal 9:16 (1080x1920px), durasi 30-45 detik",
            "Teks subtitle dinamis sinkron dengan alur video",
            "Hasil ekspor format MP4 tanpa watermark pihak ketiga",
          ],
        },
      ],
    },
    {
      businessName: "Batik Sekar Prameswari",
      email: "kontak@batiksekar.com",
      category: "Fashion & Kriya Tekstil",
      city: "Yogyakarta",
      province: "D.I. Yogyakarta",
      description: "Produsen batik tulis dan cap kontemporer ramah lingkungan asal Yogyakarta dengan motif filosofis Nusantara.",
      package: partnerProPkg,
      projects: [
        {
          title: "Penulisan 3 Artikel Storytelling Edukasi Motif Batik Tradisional untuk Blog",
          roleKey: "CONTENT_WRITER",
          deliverableType: "DOCS",
          description: "Menulis 3 artikel blog edukatif (masing-masing 500-700 kata) yang mengupas makna filosofis di balik motif batik Parang, Kawung, dan Truntum dengan bahasa santun, inspiratif, dan ramah generasi muda.",
          instructions: "Tulis dalam Google Docs. Sertakan usulan judul menarik, kata kunci, dan meta deskripsi ringkas.",
          criteria: [
            "Artikel orisinal bebas plagiasi, minimal 500 kata per motif batik",
            "Gaya penulisan mengalir, edukatif, dan bebas dari typo",
            "Diserahkan dalam bentuk tautan Google Docs dengan akses view",
          ],
        },
        {
          title: "Penyusunan E-Katalog Produk Koleksi Kemeja & Kain Tenun format PDF",
          roleKey: "GRAPHIC_DESIGNER",
          deliverableType: "FIGMA",
          description: "Menyusun e-katalog digital sebanyak 10-12 halaman yang memuat foto produk, kode artikel, deskripsi bahan katun primisima, dan panduan ukuran untuk kebutuhan penawaran ke pembeli grosir.",
          instructions: "Foto produk dan rincian harga sudah disiapkan. Desain harus rapi dan mewah.",
          criteria: [
            "Tata letak halaman katalog rapi, proporsional, dan mudah dibaca",
            "File ekspor PDF berukuran di bawah 10 MB agar mudah dibagikan via WhatsApp",
            "Menyertakan link master file di Figma atau Canva",
          ],
        },
      ],
    },
    {
      businessName: "Dapur Sambal Mak Etek",
      email: "admin@sambalmaketek.id",
      category: "Kuliner Kemasan",
      city: "Bandung",
      province: "Jawa Barat",
      description: "UMKM produsen sambal botol kemasan khas Minang dan bumbu rendang instan siap saji tanpa bahan pengawet.",
      package: partnerBasicPkg,
      projects: [
        {
          title: "Input & Rekap Data Penjualan Toko Online Marketplace ke Master Spreadsheet",
          roleKey: "DATA_ENTRY",
          deliverableType: "DOCS",
          description: "Merekapitulasi 200 riwayat transaksi pesanan dari laporan penjualan marketplace (Shopee & Tokopedia) ke master Google Sheets bulanan dengan kolom tanggal, produk, kuantitas, harga, dan laba kotor.",
          instructions: "Gunakan template Google Sheets yang sudah kami sediakan. Periksa formula penjumlahan.",
          criteria: [
            "200 baris data terekapitulasi lengkap tanpa ada data ganda",
            "Formula total omset dan laba kotor berjalan otomatis",
            "Format angka mata uang Rupiah dan tanggal rapi dan seragam",
          ],
        },
        {
          title: "Penyusunan Kalender Konten Media Sosial 2 Minggu (10 Ide & Copywriting)",
          roleKey: "SOCIAL_MEDIA",
          deliverableType: "DOCS",
          description: "Menyusun draft kalender konten media sosial untuk 10 postingan Instagram & TikTok bertema resep kreasi sambal dan testimoni pelanggan, lengkap dengan hook, visual brief, dan copywriting caption.",
          instructions: "Tuliskan rencana konten ke dalam tabel spreadsheet berisi kolom Hari, Hook, Visual, Caption, dan CTA.",
          criteria: [
            "Memuat minimal 10 rancangan konten lengkap dari hook hingga call-to-action",
            "Rekomendasi hashtag relevan untuk kategori kuliner Nusantara",
            "Diserahkan dalam tautan Google Sheets dengan akses view",
          ],
        },
      ],
    },
    {
      businessName: "GlowUp Botanicals Skincare",
      email: "hello@glowupbotanicals.id",
      category: "Kecantikan & Perawatan Diri",
      city: "Bandung",
      province: "Jawa Barat",
      description: "Brand skincare berbahan aktif botani alami lokal Indonesia yang tersertifikasi BPOM dan ramah kulit sensitif.",
      package: partnerPremiumPkg,
      projects: [
        {
          title: "Desain UI Prototipe Mobile Halaman Katalog & Rincian Produk Skincare",
          roleKey: "UIUX_DESIGNER",
          deliverableType: "FIGMA",
          description: "Merancang antarmuka UI mobile (layar 375px/390px) untuk halaman katalog produk herbal dan halaman detail rincian produk (kandungan bahan, sertifikasi BPOM, ulasan pembeli) dengan gaya minimalis bersih.",
          instructions: "Gunakan Figma dengan sistem auto-layout dan komponen reusable yang terstruktur.",
          criteria: [
            "Desain UI mobile responsif dengan komponen auto-layout di Figma",
            "Palet warna selaras dengan tema botanical (soft beige, pale sage, warm white)",
            "Menyertakan link Figma publik dengan prototipe klik sederhana",
          ],
        },
        {
          title: "Implementasi Komponen Frontend Responsif FAQ & Kartu Produk (React & Tailwind)",
          roleKey: "FRONTEND_DEV",
          deliverableType: "GITHUB",
          description: "Membuat komponen React/Next.js interaktif untuk accordion FAQ dan kartu produk responsif dengan interaksi hover halus berdasarkan desain acuan Figma.",
          instructions: "Gunakan React/Next.js dengan Tailwind CSS. Pastikan kode modular dan rapi.",
          criteria: [
            "Komponen React/TypeScript bebas error linting",
            "Tampilan responsif sempurna di perangkat mobile dan desktop",
            "Diserahkan via tautan repositori GitHub atau StackBlitz demo",
          ],
        },
      ],
    },
    {
      businessName: "Reka Kreasi Grafika",
      email: "order@rekakreasigrafika.com",
      category: "Percetakan & Merchandise",
      city: "Yogyakarta",
      province: "D.I. Yogyakarta",
      description: "Studio percetakan digital, sablon merchandise ramah lingkungan, dan custom stationery untuk instansi dan kampus.",
      package: partnerProPkg,
      projects: [
        {
          title: "Riset Kontak 50 Organisasi Mahasiswa untuk Database Penawaran Merchandise",
          roleKey: "DATA_ENTRY",
          deliverableType: "DOCS",
          description: "Melakukan riset daring dan mengumpulkan kontak aktif (nama himpunan/BEM, universitas, akun Instagram resmi, kontak humas/email) dari 50 organisasi kemahasiswaan di wilayah Yogyakarta dan sekitarnya.",
          instructions: "Cari informasi publik melalui media sosial organisasi kampus. Masukkan ke Google Sheets.",
          criteria: [
            "Tercatat minimal 50 organisasi kemahasiswaan kampus yang valid dan aktif",
            "Informasi mencakup Nama Kampus, Organisasi, Akun IG, dan Kontak/Email",
            "Data disusun rapi dalam tabel Google Sheets tanpa baris kosong",
          ],
        },
        {
          title: "Video Animasi Bumper Intro Logo 5 Detik untuk Video Media Sosial",
          roleKey: "VIDEO_EDITOR",
          deliverableType: "DRIVE",
          description: "Membuat animasi intro logo pendek berdurasi 5-7 detik dengan efek visual motion graphic dinamis dan efek suara (SFX) yang cocok untuk pembuka video YouTube dan konten reels Reka Kreasi Grafika.",
          instructions: "Logo vektor format SVG/AI disediakan di Google Drive. Animasi harus energik dan modern.",
          criteria: [
            "Animasi bumper logo durasi 5-7 detik dengan transisi mulus",
            "Format file MP4 1080p 60fps dengan sinkronisasi sound effect",
            "Menyertakan file project After Effects atau link Canva",
          ],
        },
      ],
    },
  ];

  for (const u of dummyUmkms) {
    // 1. Buat User & Profile UMKM (Nama bisnis, bukan nama orang)
    const umkmUser = await prisma.user.create({
      data: {
        name: u.businessName,
        email: u.email,
        password: defaultPasswordHash,
        role: "UMKM",
        status: "ACTIVE",
        umkm: {
          create: {
            businessName: u.businessName,
            category: u.category,
            city: u.city,
            province: u.province,
            description: u.description,
            isCampusPartner: true,
            partnerCampusId: itbCampus.id,
            ratingAvg: 4.9,
            ratingCount: 3,
          },
        },
      },
      include: { umkm: true },
    });

    const umkmProfileId = umkmUser.umkm!.id;

    // 2. Buat Subscription Aktif untuk UMKM
    const sub = await prisma.subscription.create({
      data: {
        umkmId: umkmProfileId,
        packageId: u.package.id,
        status: "ACTIVE",
        quotaTotal: u.package.jobQuota,
        quotaUsed: 2, // 2 job sudah diterbitkan
        startsAt: now,
        endsAt: subEndsAt,
        paidAt: now,
      },
    });

    console.log(`✓ UMKM dibuat: ${u.businessName} (${u.email}) [Paket: ${u.package.name}]`);

    // 3. Buat 2 Project untuk UMKM ini
    for (let i = 0; i < u.projects.length; i++) {
      const p = u.projects[i];
      const roleId = roleMap[p.roleKey];
      if (!roleId) {
        console.error(`Role ${p.roleKey} tidak ditemukan!`);
        continue;
      }

      const allocation = u.package.allocationPerJobIdr || 25000;
      const studentShare = Math.floor((allocation * 60) / 100);
      const platformShare = allocation - studentShare;
      const deadline = i === 0 ? deadline1 : deadline2;

      const job = await prisma.job.create({
        data: {
          umkmId: umkmProfileId,
          subscriptionId: sub.id,
          title: p.title,
          description: p.description,
          instructions: p.instructions,
          jobRoleId: roleId,
          deliverableType: p.deliverableType,
          deadlineAt: deadline,
          minLevel: StudentLevel.NEWCOMER,
          beginnerFriendly: true,
          status: "OPEN",
          isPaid: true,
          packageTier: u.package.tier as PackageTier,
          allocationIdr: allocation,
          studentShareIdr: studentShare,
          platformShareIdr: platformShare,
          publishedAt: now,
          criteria: {
            create: p.criteria.map((c, idx) => ({
              text: c,
              position: idx + 1,
            })),
          },
        },
      });

      console.log(`   └─ Job ${i + 1}: "${job.title}" [Alokasi: Rp ${allocation.toLocaleString()}]`);
    }
  }

  console.log("\n=== SEED SELESAI DENGAN SUKSES! ===");
  console.log("Info Login Akun Dummy:");
  console.log("Password untuk SEMUA akun dummy di atas: Karta2026!");
}

main()
  .catch((e) => {
    console.error("Gagal menjalankan seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
