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
          title: "Desain 1 Poster Feed Instagram Menu Seasonal Cold Brew",
          roleKey: "GRAPHIC_DESIGNER",
          deliverableType: "FIGMA",
          description: "Membuat 1 desain poster feed Instagram persegi (1080x1080px) untuk promosi menu baru seasonal Cold Brew. Foto botol produk dan logo resolusi tinggi sudah disiapkan di Google Drive.",
          instructions: "Gunakan Figma atau Canva. Cukup 1 artboard desain siap publish dengan gaya minimalis estetik.",
          criteria: [
            "1 feed desain 1080x1080px format PNG/JPG tajam",
            "Menggunakan elemen foto botol dan logo resmi Kopi Karsa",
            "Menyertakan tautan link Figma atau Canva view",
          ],
        },
        {
          title: "Editing 1 Video Reels Singkat Menu Cold Brew (15-20 Detik)",
          roleKey: "VIDEO_EDITOR",
          deliverableType: "DRIVE",
          description: "Memotong dan menggabungkan 3-4 potongan video mentah pendek menjadi 1 video Reels/TikTok singkat 15-20 detik dengan transisi clean dan teks nama menu.",
          instructions: "Bahan mentah video 3 klip pendek (total 40 detik) sudah ada di Drive. Cukup potong, beri musik background bawaan reels, dan teks ringkas.",
          criteria: [
            "Durasi video 15-20 detik format vertikal 9:16",
            "Penyuntingan klip halus tanpa watermark aplikasi pihak ketiga",
            "Ekspor format MP4 1080p",
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
          title: "Penulisan 1 Caption Storytelling Motif Batik Parang (1 Paragraf)",
          roleKey: "CONTENT_WRITER",
          deliverableType: "DOCS",
          description: "Menulis 1 paragraf storytelling singkat (80–120 kata) mengenai makna filosofis motif batik Parang yang cocok dijadikan caption Instagram dan status WhatsApp promosi.",
          instructions: "Tulis di Google Docs. Bahasa santun, mengalir, dan sertakan 5 saran hashtag relevan.",
          criteria: [
            "Panjang teks 80–120 kata, rapi dan bebas typo",
            "Menjelaskan makna filosofis motif batik secara ringkas",
            "Menyertakan 5 rekomendasi hashtag",
          ],
        },
        {
          title: "Penyusunan 1 Lembar Flyer Ringkasan Pricelist Batik (Single Page)",
          roleKey: "GRAPHIC_DESIGNER",
          deliverableType: "FIGMA",
          description: "Menata 4 foto produk batik dan daftar harga ke dalam 1 lembar flyer digital/pricelist A4 satu sisi yang mudah dibagikan via WhatsApp.",
          instructions: "Gunakan Canva atau Figma. Foto dan daftar harga sudah siap, cukup ditata rapi dalam 1 halaman.",
          criteria: [
            "Desain flyer 1 halaman (single page) yang proporsional dan mudah dibaca",
            "Mencantumkan 4 foto produk beserta nama artikel dan harganya",
            "Ekspor file PDF/JPG berukuran ringan (< 2MB)",
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
          title: "Input 25 Baris Data Transaksi Penjualan ke Google Sheets",
          roleKey: "DATA_ENTRY",
          deliverableType: "DOCS",
          description: "Membantu menyalin 25 baris invoice penjualan harian dari foto nota fisik ke dalam tabel master spreadsheet Google Sheets.",
          instructions: "Template Google Sheets sudah disediakan dengan kolom yang jelas. Hanya ada 25 baris data.",
          criteria: [
            "25 baris transaksi terisi lengkap dan akurat sesuai nota",
            "Kolom tanggal, nama barang, jumlah, dan nominal cocok",
            "Tidak ada baris yang dobel",
          ],
        },
        {
          title: "Penyusunan 3 Ide Konten Instagram Sambal Mak Etek",
          roleKey: "SOCIAL_MEDIA",
          deliverableType: "DOCS",
          description: "Menuliskan 3 ide postingan sederhana (tema, hook kalimat pertama, dan saran visual) untuk konten mingguan sambal kemasan.",
          instructions: "Cukup tuliskan dalam bentuk bullet point atau tabel sederhana 3 baris di Google Docs.",
          criteria: [
            "Berisi 3 ide konten yang aplikatif untuk produk makanan kemasan",
            "Tiap ide dilengkapi hook kalimat pembuka dan deskripsi visual singkat",
            "Dikerjakan dalam Google Docs dengan akses view",
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
          title: "Desain 1 Kartu Komponen UI Produk Skincare di Figma",
          roleKey: "UIUX_DESIGNER",
          deliverableType: "FIGMA",
          description: "Merancang 1 komponen UI kartu produk mobile (Product Card) di Figma yang memuat foto botol, label nama serum, rating bintang, dan tombol 'Beli'.",
          instructions: "Gunakan Figma dengan auto-layout sederhana. Hanya mendesain 1 komponen card, bukan keseluruhan halaman aplikasi.",
          criteria: [
            "1 frame kartu produk mobile bersih dan estetik",
            "Memanfaatkan sistem auto-layout Figma",
            "Link publik Figma siap ditinjau",
          ],
        },
        {
          title: "Styling CSS/Tailwind 1 Komponen Kartu Produk Sederhana",
          roleKey: "FRONTEND_DEV",
          deliverableType: "GITHUB",
          description: "Merapikan styling CSS/Tailwind untuk 1 komponen kartu produk (gambar, judul, harga, dan tombol) agar responsif dan tampil manis di browser.",
          instructions: "Kode markup HTML sudah disiapkan, tinggal beri utility classes Tailwind sederhana.",
          criteria: [
            "Komponen kartu tampil rapi di tampilan mobile maupun desktop",
            "Bebas error konsol",
            "Tautan kode GitHub Gist atau StackBlitz/CodeSandbox",
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
          title: "Riset Kontak 10 Akun Instagram Himpunan Kampus",
          roleKey: "DATA_ENTRY",
          deliverableType: "DOCS",
          description: "Mencari 10 tautan akun Instagram resmi himpunan/BEM fakultas di wilayah Yogyakarta dan mencatat nama akun serta email humasnya.",
          instructions: "Catat ke dalam 10 baris tabel Google Sheets yang sudah disiapkan.",
          criteria: [
            "10 kontak himpunan/organisasi kampus valid dan aktif",
            "Mencakup Nama Kampus, Organisasi, username Instagram, dan email",
            "Data rapi tanpa kesalahan pengetikan",
          ],
        },
        {
          title: "Penyesuaian Resolusi & Format Logo untuk Foto Profil Medsos",
          roleKey: "VIDEO_EDITOR",
          deliverableType: "DRIVE",
          description: "Mengekspor logo vektor yang sudah ada menjadi format foto profil medsos (lingkaran 500x500px) dengan background putih dan transparan.",
          instructions: "File master logo vektor format SVG/PNG resolusi tinggi sudah disediakan, cukup crop dan ekspor ke 2 file gambar siap pakai.",
          criteria: [
            "1 file PNG transparan 500x500px dan 1 file JPG background putih",
            "Posisi logo pas tepat di tengah area aman lingkaran medsos",
            "Gambar tajam tanpa pecah",
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
