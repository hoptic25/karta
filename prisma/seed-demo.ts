import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  JobRole,
  StudentLevel,
  LedgerType,
  LedgerStatus,
} from "../src/generated/prisma/enums";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL must be defined for seeding.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  console.log("🚀 Starting demo dataset seed...");

  // 1. Ensure Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@karta.id" },
    update: { role: "ADMIN", status: "ACTIVE" },
    create: {
      email: "admin@karta.id",
      name: "Admin Karta",
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  console.log("👤 Seeded Admin:", adminUser.email);

  // 2. Campuses
  const itb = await prisma.campus.findFirst({ where: { name: "Institut Teknologi Bandung" } });
  const ugm = await prisma.campus.findFirst({ where: { name: "Universitas Gadjah Mada" } });
  if (!itb || !ugm) {
    throw new Error("Base seed must run first! Please run pnpm db:seed first.");
  }

  // 3. Demo Students
  const student1User = await prisma.user.upsert({
    where: { email: "budi.santoso@mahasiswa.itb.ac.id" },
    update: { role: "STUDENT", status: "ACTIVE" },
    create: {
      email: "budi.santoso@mahasiswa.itb.ac.id",
      name: "Budi Santoso",
      role: "STUDENT",
      status: "ACTIVE",
    },
  });

  const studentProfile1 = await prisma.studentProfile.upsert({
    where: { userId: student1User.id },
    update: {},
    create: {
      userId: student1User.id,
      campusId: itb.id,
      studyProgram: "Teknik Informatika",
      username: "budisantoso",
      bio: "Frontend Developer & UI Designer antusias. Suka membantu UMKM membangun kehadiran digital.",
      skills: ["Figma", "React", "Next.js", "Tailwind CSS"],
      points: 175,
      level: StudentLevel.TRUSTED,
      bankName: "BCA",
      bankAccountName: "Budi Santoso",
      bankAccountNumber: "8830123456",
      portfolioPublic: true,
    },
  });

  const student2User = await prisma.user.upsert({
    where: { email: "siti.rahma@mail.ugm.ac.id" },
    update: { role: "STUDENT", status: "ACTIVE" },
    create: {
      email: "siti.rahma@mail.ugm.ac.id",
      name: "Siti Rahma",
      role: "STUDENT",
      status: "ACTIVE",
    },
  });

  const studentProfile2 = await prisma.studentProfile.upsert({
    where: { userId: student2User.id },
    update: {},
    create: {
      userId: student2User.id,
      campusId: ugm.id,
      studyProgram: "Ilmu Komunikasi",
      username: "sitirahma",
      bio: "Content Writer dan Social Media Enthusiast. Berpengalaman riset konten viral Instagram & TikTok.",
      skills: ["Copywriting", "Canva", "Social Media", "SEO"],
      points: 85,
      level: StudentLevel.RELIABLE,
      bankName: "Mandiri",
      bankAccountName: "Siti Rahma",
      bankAccountNumber: "1370019876543",
      portfolioPublic: true,
    },
  });

  console.log("🎓 Seeded Demo Students: Budi & Siti");

  // 4. Demo UMKM
  const umkm1User = await prisma.user.upsert({
    where: { email: "kopi.senja@gmail.com" },
    update: { role: "UMKM", status: "ACTIVE" },
    create: {
      email: "kopi.senja@gmail.com",
      name: "Rian Hendrawan",
      role: "UMKM",
      status: "ACTIVE",
    },
  });

  const umkmProfile1 = await prisma.umkmProfile.upsert({
    where: { userId: umkm1User.id },
    update: { isCampusPartner: true, partnerCampusId: itb.id },
    create: {
      userId: umkm1User.id,
      businessName: "Kopi Kenangan Senja",
      category: "Kuliner / F&B",
      province: "Jawa Barat",
      city: "Bandung",
      description: "Kedai kopi artisan lokal menyajikan biji kopi nusantara pilihan.",
      isCampusPartner: true,
      partnerCampusId: itb.id,
    },
  });

  const umkm2User = await prisma.user.upsert({
    where: { email: "batik.lestari@gmail.com" },
    update: { role: "UMKM", status: "ACTIVE" },
    create: {
      email: "batik.lestari@gmail.com",
      name: "Ibu Sri Wahyuni",
      role: "UMKM",
      status: "ACTIVE",
    },
  });

  const umkmProfile2 = await prisma.umkmProfile.upsert({
    where: { userId: umkm2User.id },
    update: { isCampusPartner: true, partnerCampusId: ugm.id },
    create: {
      userId: umkm2User.id,
      businessName: "Batik Lestari Nusantara",
      category: "Fashion & Kriya",
      province: "D.I. Yogyakarta",
      city: "Yogyakarta",
      description: "Produsen batik tulis dan cap ramah lingkungan khas Yogyakarta.",
      isCampusPartner: true,
      partnerCampusId: ugm.id,
    },
  });

  console.log("🏪 Seeded Demo UMKM: Kopi Senja & Batik Lestari");

  // 5. Subscriptions
  const partnerBasicPkg = await prisma.package.findUnique({ where: { code: "PARTNER_BASIC" } });
  if (partnerBasicPkg) {
    await prisma.subscription.upsert({
      where: { id: "demo-sub-kopi" },
      update: {},
      create: {
        id: "demo-sub-kopi",
        umkmId: umkmProfile1.id,
        packageId: partnerBasicPkg.id,
        status: "ACTIVE",
        quotaTotal: 6,
        quotaUsed: 2,
        startsAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        paymentNote: "Transfer BCA terverifikasi.",
      },
    });

    await prisma.subscription.upsert({
      where: { id: "demo-sub-batik" },
      update: {},
      create: {
        id: "demo-sub-batik",
        umkmId: umkmProfile2.id,
        packageId: partnerBasicPkg.id,
        status: "ACTIVE",
        quotaTotal: 6,
        quotaUsed: 1,
        startsAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        paymentNote: "Transfer Mandiri terverifikasi.",
      },
    });
  }

  // 6. Demo Jobs in Various Lifecycle States

  // Job 1: ACCEPTED with Ratings & Ledger (Kopi Senja -> Budi)
  const jobAccepted = await prisma.job.upsert({
    where: { id: "demo-job-banner" },
    update: {},
    create: {
      id: "demo-job-banner",
      umkmId: umkmProfile1.id,
      subscriptionId: "demo-sub-kopi",
      title: "Desain Banner Promosi Menu Baru Instagram",
      description: "Membuat desain banner promosi untuk menu kopi susu aren baru berformat 1:1 dan 9:16.",
      instructions: "Gunakan palet warna earthy tones, sertakan foto produk kopi terlampir, dan logo kedai.",
      role: JobRole.GRAPHIC_DESIGNER,
      deliverableType: "CANVA",
      deadlineAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: "ACCEPTED",
      packageTier: "BASIC",
      isPaid: true,
      allocationIdr: 25_000,
      studentShareIdr: 20_000,
      platformShareIdr: 5_000,
      publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      criteria: {
        create: [
          { text: "Format visual 1:1 dan 9:16", position: 1 },
          { text: "Memuat logo Kopi Kenangan Senja", position: 2 },
          { text: "Tautan template Canva dapat diedit", position: 3 },
        ],
      },
    },
  });

  const assignAccepted = await prisma.jobAssignment.upsert({
    where: { id: "demo-assign-banner" },
    update: {},
    create: {
      id: "demo-assign-banner",
      jobId: jobAccepted.id,
      studentId: studentProfile1.id,
      status: "COMPLETED",
      claimedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 3600000),
      endedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.submission.upsert({
    where: { jobId_number: { jobId: jobAccepted.id, number: 1 } },
    update: {},
    create: {
      assignmentId: assignAccepted.id,
      jobId: jobAccepted.id,
      number: 1,
      url: "https://canva.com/design/DAE12345/preview",
      note: "Banner telah diselesaikan dengan warna earthy brown dan layout modern.",
      isLate: false,
    },
  });

  // Ledger entries for Job 1
  await prisma.ledgerEntry.upsert({
    where: { id: "demo-ledger-student-1" },
    update: {},
    create: {
      id: "demo-ledger-student-1",
      jobId: jobAccepted.id,
      assignmentId: assignAccepted.id,
      type: LedgerType.STUDENT_SHARE,
      status: LedgerStatus.PAYABLE,
      amountIdr: 20_000,
      studentId: studentProfile1.id,
    },
  });

  await prisma.ledgerEntry.upsert({
    where: { id: "demo-ledger-platform-1" },
    update: {},
    create: {
      id: "demo-ledger-platform-1",
      jobId: jobAccepted.id,
      assignmentId: assignAccepted.id,
      type: LedgerType.PLATFORM_FEE,
      status: LedgerStatus.RECOGNIZED,
      amountIdr: 5_000,
    },
  });

  // Ratings for Job 1
  await prisma.rating.upsert({
    where: { jobId_direction: { jobId: jobAccepted.id, direction: "UMKM_TO_STUDENT" } },
    update: {},
    create: {
      jobId: jobAccepted.id,
      direction: "UMKM_TO_STUDENT",
      fromUserId: umkm1User.id,
      toUserId: student1User.id,
      score: 5,
      comment: "Hasil desain sangat memuaskan, rapi, dan cepat selesai. Komunikasi sangat profesional!",
    },
  });

  await prisma.rating.upsert({
    where: { jobId_direction: { jobId: jobAccepted.id, direction: "STUDENT_TO_UMKM" } },
    update: {},
    create: {
      jobId: jobAccepted.id,
      direction: "STUDENT_TO_UMKM",
      fromUserId: student1User.id,
      toUserId: umkm1User.id,
      score: 5,
      dimensions: {
        clarity: 5,
        communication: 5,
        professionalism: 5,
        reviewSpeed: 5,
      },
      comment: "Brief sangat jelas dan bahan foto yang diberikan sudah beresolusi tinggi. Sukses terus Kopi Senja!",
    },
  });

  // Job 2: OPEN Job (Batik Lestari mencari Content Writer)
  await prisma.job.upsert({
    where: { id: "demo-job-copywriting" },
    update: {},
    create: {
      id: "demo-job-copywriting",
      umkmId: umkmProfile2.id,
      subscriptionId: "demo-sub-batik",
      title: "Penulisan 5 Artikel Pendek Cerita Filosofi Motif Batik",
      description: "Menulis 5 artikel pendek (masing-masing 200-300 kata) tentang filosofi motif batik klasik untuk blog & caption media sosial.",
      instructions: "Gunakan bahasa Indonesia baku yang mengalir, edukatif, dan menarik bagi generasi muda.",
      role: JobRole.CONTENT_WRITER,
      deliverableType: "DOCS",
      deadlineAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      status: "OPEN",
      packageTier: "BASIC",
      isPaid: true,
      allocationIdr: 25_000,
      studentShareIdr: 20_000,
      platformShareIdr: 5_000,
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      criteria: {
        create: [
          { text: "Minimal 5 cerita motif batik lengkap", position: 1 },
          { text: "Bebas plagiarisme & gaya bahasa santun", position: 2 },
          { text: "Tautan Google Docs dengan akses view/comment", position: 3 },
        ],
      },
    },
  });

  // Job 3: SUBMITTED (menunggu review UMKM)
  const jobSubmitted = await prisma.job.upsert({
    where: { id: "demo-job-social" },
    update: {},
    create: {
      id: "demo-job-social",
      umkmId: umkmProfile1.id,
      subscriptionId: "demo-sub-kopi",
      title: "Riset Tren TikTok & Kalender Konten 1 Minggu",
      description: "Menyusun tabel ide konten harian TikTok untuk kedai kopi artisan.",
      instructions: "Sertakan audio tren, konsep visual, dan hook 3 detik pertama.",
      role: JobRole.SOCIAL_MEDIA,
      deliverableType: "DOCS",
      deadlineAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: "SUBMITTED",
      packageTier: "BASIC",
      isPaid: true,
      allocationIdr: 25_000,
      studentShareIdr: 20_000,
      platformShareIdr: 5_000,
      reviewDueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      criteria: {
        create: [
          { text: "Kalender konten lengkap 7 hari", position: 1 },
          { text: "Rekomendasi sound trending aktif", position: 2 },
        ],
      },
    },
  });

  const assignSubmitted = await prisma.jobAssignment.upsert({
    where: { id: "demo-assign-social" },
    update: {},
    create: {
      id: "demo-assign-social",
      jobId: jobSubmitted.id,
      studentId: studentProfile2.id,
      status: "ACTIVE",
      claimedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 1800000),
    },
  });

  await prisma.submission.upsert({
    where: { jobId_number: { jobId: jobSubmitted.id, number: 1 } },
    update: {},
    create: {
      assignmentId: assignSubmitted.id,
      jobId: jobSubmitted.id,
      number: 1,
      url: "https://docs.google.com/document/d/12345/preview",
      note: "Kalender 7 hari dan riset audio telah dilampirkan lengkap di Google Docs.",
      isLate: false,
    },
  });

  // 7. Initial Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: student1User.id,
        type: "JOB_ACCEPTED",
        title: "Tugas Diterima! Saldo Rp 20.000 Ditambahkan",
        body: 'Kopi Kenangan Senja telah menerima hasil pekerjaan "Desain Banner Promosi Menu Baru Instagram". Rating 5 bintang telah diberikan!',
        href: `/student/my-jobs/${jobAccepted.id}`,
      },
      {
        userId: umkm1User.id,
        type: "JOB_SUBMITTED",
        title: "Pekerjaan Baru Dikumpulkan",
        body: 'Siti Rahma telah mengumpulkan hasil pengerjaan untuk tugas "Riset Tren TikTok & Kalender Konten 1 Minggu". Silakan lakukan review.',
        href: `/umkm/jobs/${jobSubmitted.id}`,
      },
    ],
  });

  // 8. Audit Log Sample
  await prisma.auditLog.create({
    data: {
      actorId: adminUser.id,
      action: "SUBSCRIPTION_MARK_PAID",
      entity: "SUBSCRIPTION",
      entityId: "demo-sub-kopi",
      meta: {
        package: "PARTNER_BASIC",
        amountIdr: 75_000,
        umkm: "Kopi Kenangan Senja",
      },
    },
  });

  console.log("🎉 Demo dataset seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Demo seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
