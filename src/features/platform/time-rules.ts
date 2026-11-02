import "server-only";

import { prisma } from "@/lib/db";
import { getMinimumDeadlineHours } from "@/features/jobs/deadline";
import type { StudentLevel } from "@/generated/prisma/client";

export interface TimeRulesResult {
  expiredOpenJobs: number;
  autoAcceptedJobs: number;
  finalizedRejections: number;
  expiredSubscriptions: number;
  remindersSent: number;
  autoReleasedClaims: number;
  autoDeclinedDeadlineRequests: number;
  cleanedOrphanAssets: number;
}

/**
 * 1. Job OPEN melewati batas klaim cutoff -> EXPIRED, kembalikan kuota (+1)
 */
export async function expireOpenJobsPastCutoff(now = new Date()): Promise<number> {
  const openJobs = await prisma.job.findMany({
    where: { status: "OPEN" },
    select: {
      id: true,
      title: true,
      role: true,
      packageTier: true,
      deadlineAt: true,
      subscriptionId: true,
      umkm: { select: { id: true, userId: true } },
    },
  });

  let count = 0;

  for (const job of openJobs) {
    const minHours = getMinimumDeadlineHours(job.role, job.packageTier || "BASIC");
    const cutoffTime = new Date(job.deadlineAt.getTime() - minHours * 60 * 60 * 1000);

    if (now > cutoffTime) {
      await prisma.$transaction(async (tx) => {
        // Update job to EXPIRED
        await tx.job.update({
          where: { id: job.id },
          data: { status: "EXPIRED" },
        });

        // Pulihkan kuota jika ada subscriptionId
        if (job.subscriptionId) {
          const sub = await tx.subscription.findUnique({
            where: { id: job.subscriptionId },
          });

          if (sub) {
            await tx.subscription.update({
              where: { id: sub.id },
              data: { quotaUsed: { decrement: 1 } },
            });

            await tx.quotaLedger.create({
              data: {
                subscriptionId: sub.id,
                delta: 1,
                reason: `Pemulihan kuota: tugas "${job.title}" kedaluwarsa tanpa pelamar`,
                jobId: job.id,
              },
            });
          }
        }

        // Notifikasi UMKM
        await tx.notification.create({
          data: {
            userId: job.umkm.userId,
            type: "JOB_EXPIRED",
            title: "Tugas Kedaluwarsa (Batas Waktu Klaim Terlampaui)",
            body: `Tugas "${job.title}" tidak diklaim hingga batas waktu minimum. Kuota langganan telah dikembalikan ke akun Anda.`,
            href: `/umkm/jobs/${job.id}`,
          },
        });
      });

      count++;
    }
  }

  return count;
}

/**
 * 2. SUBMITTED dan reviewDueAt < now -> AUTO_ACCEPT (autoAccepted = true)
 */
export async function autoAcceptReviewPastSla(now = new Date()): Promise<number> {
  const overdueJobs = await prisma.job.findMany({
    where: {
      status: "SUBMITTED",
      reviewDueAt: { lt: now },
    },
    include: {
      umkm: { select: { id: true, userId: true } },
      assignments: {
        where: { status: "ACTIVE" },
        include: {
          student: true,
          submissions: {
            orderBy: { number: "desc" },
            take: 1,
          },
        },
        take: 1,
      },
    },
  });

  let count = 0;

  for (const job of overdueJobs) {
    const assignment = job.assignments[0];
    if (!assignment) continue;

    const student = assignment.student;
    const latestSubmission = assignment.submissions?.[0] ?? (job as unknown as { submissions?: { isLate?: boolean }[] }).submissions?.[0];

    // Poin reputasi: base +10, +3 jika tanpa revisi, +2 jika submit on-time
    const isNoRevision = job.revisionCount === 0;
    const isOnTime = latestSubmission ? !latestSubmission.isLate : true;

    let pointsDelta = 10;
    if (isNoRevision) pointsDelta += 3;
    if (isOnTime) pointsDelta += 2;

    const newPoints = student.points + pointsDelta;
    let newLevel: StudentLevel = student.level;
    if (newPoints >= 300) newLevel = "EXPERT";
    else if (newPoints >= 150) newLevel = "TRUSTED";
    else if (newPoints >= 50) newLevel = "RELIABLE";

    await prisma.$transaction(async (tx) => {
      // 1. Update job to ACCEPTED
      await tx.job.update({
        where: { id: job.id },
        data: {
          status: "ACCEPTED",
          autoAccepted: true,
        },
      });

      // 2. Update assignment to COMPLETED
      await tx.jobAssignment.update({
        where: { id: assignment.id },
        data: {
          status: "COMPLETED",
          endedAt: now,
        },
      });

      // 3. Mutasi ledger saldo mahasiswa RESERVED -> PAYABLE, PLATFORM_FEE -> RECOGNIZED
      await tx.ledgerEntry.updateMany({
        where: {
          jobId: job.id,
          type: "STUDENT_SHARE",
          status: "RESERVED",
        },
        data: { status: "PAYABLE" },
      });

      await tx.ledgerEntry.updateMany({
        where: {
          jobId: job.id,
          type: "PLATFORM_FEE",
        },
        data: { status: "RECOGNIZED" },
      });

      // 4. Update profil mahasiswa & pointEvent
      await tx.studentProfile.update({
        where: { id: student.id },
        data: {
          points: newPoints,
          level: newLevel,
          completedJobs: { increment: 1 },
        },
      });

      await tx.pointEvent.create({
        data: {
          studentId: student.id,
          jobId: job.id,
          delta: pointsDelta,
          reason: `Penyelesaian tugas otomatis (SLA review terlampaui) (+10${isNoRevision ? " +3 no-rev" : ""}${isOnTime ? " +2 tepat waktu" : ""})`,
        },
      });

      // 5. Notifikasi mahasiswa & UMKM
      await tx.notification.create({
        data: {
          userId: student.userId,
          type: "JOB_ACCEPTED",
          title: "Tugas Selesai (Diterima Otomatis)",
          body: `Tugas "${job.title}" telah diterima otomatis oleh sistem karena melewati SLA review UMKM. Saldo dan +${pointsDelta} reputasi telah ditambahkan!`,
          href: `/student/my-jobs/${job.id}`,
        },
      });

      await tx.notification.create({
        data: {
          userId: job.umkm.userId,
          type: "JOB_ACCEPTED",
          title: "Tugas Diterima Otomatis (SLA Terlewati)",
          body: `Tugas "${job.title}" telah diterima otomatis oleh sistem karena batas waktu peninjauan 3 hari telah berakhir.`,
          href: `/umkm/jobs/${job.id}`,
        },
      });
    });

    count++;
  }

  return count;
}

/**
 * 3. REJECTED dan disputeUntil < now dan tanpa sengketa -> Kunci final, ledger VOIDED
 */
export async function finalizeRejectionsPastDispute(now = new Date()): Promise<number> {
  const rejectedJobs = await prisma.job.findMany({
    where: {
      status: "REJECTED",
      disputeUntil: { lt: now },
      rejectionFinalAt: null,
      dispute: null, // Tanpa sengketa aktif
    },
    select: { id: true },
  });

  let count = 0;

  for (const j of rejectedJobs) {
    await prisma.$transaction(async (tx) => {
      await tx.job.update({
        where: { id: j.id },
        data: { rejectionFinalAt: now },
      });

      // Batalkan saldo tertahan (HELD -> VOIDED)
      await tx.ledgerEntry.updateMany({
        where: {
          jobId: j.id,
          status: "HELD",
        },
        data: { status: "VOIDED" },
      });
    });

    count++;
  }

  return count;
}

/**
 * 4. Langganan ACTIVE dan endsAt < now -> EXPIRED
 */
export async function expireEndedSubscriptions(now = new Date()): Promise<number> {
  const expiredSubs = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      endsAt: { lt: now },
    },
    include: {
      umkm: { select: { userId: true } },
      package: { select: { name: true } },
    },
  });

  let count = 0;

  for (const sub of expiredSubs) {
    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: sub.id },
        data: { status: "EXPIRED" },
      });

      await tx.notification.create({
        data: {
          userId: sub.umkm.userId,
          type: "SUBSCRIPTION_EXPIRED",
          title: "Masa Langganan Berakhir",
          body: `Masa aktif paket ${sub.package.name} telah berakhir. Perpanjang langganan untuk terus membuka lowongan tugas mikro.`,
          href: "/umkm/subscription",
        },
      });
    });

    count++;
  }

  return count;
}

/**
 * 5. Pengingat Waktu (Reminders) - Deadline H-24 jam, Review due H-24 jam
 */
export async function sendUpcomingReminders(now = new Date()): Promise<number> {
  let remindersSent = 0;
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // 5a. Deadline pengerjaan H-24 jam
  const jobsNearDeadline = await prisma.job.findMany({
    where: {
      status: { in: ["IN_PROGRESS", "REVISION_REQUESTED"] },
      deadlineAt: {
        gt: now,
        lte: in24h,
      },
    },
    include: {
      assignments: {
        where: { status: "ACTIVE" },
        include: { student: { select: { userId: true } } },
        take: 1,
      },
    },
  });

  for (const job of jobsNearDeadline) {
    const studentUserId = job.assignments[0]?.student.userId;
    if (!studentUserId) continue;

    // Cek duplikasi notifikasi sejenis dalam 24 jam terakhir
    const existingNotif = await prisma.notification.findFirst({
      where: {
        userId: studentUserId,
        type: "DEADLINE_REMINDER",
        href: `/student/my-jobs/${job.id}`,
        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    });

    if (!existingNotif) {
      await prisma.notification.create({
        data: {
          userId: studentUserId,
          type: "DEADLINE_REMINDER",
          title: "Pengingat: Tenggat Pekerjaan < 24 Jam",
          body: `Tenggat pengerjaan untuk tugas "${job.title}" tersisa kurang dari 24 jam. Segera kumpulkan hasil kerja Anda.`,
          href: `/student/my-jobs/${job.id}`,
        },
      });
      remindersSent++;
    }
  }

  return remindersSent;
}

/**
 * 6. (P1 / BR-C6): CLAIMED tanpa startedAt melewati 24 jam -> Auto-release
 */
export async function autoReleaseUnstartedClaimedJobs(now = new Date()): Promise<number> {
  const cutoff24hAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const unstartedClaimedJobs = await prisma.job.findMany({
    where: {
      status: "CLAIMED",
      assignments: {
        some: {
          status: "ACTIVE",
          startedAt: null,
          claimedAt: { lt: cutoff24hAgo },
        },
      },
    },
    include: {
      umkm: { select: { userId: true } },
      assignments: {
        where: {
          status: "ACTIVE",
          startedAt: null,
          claimedAt: { lt: cutoff24hAgo },
        },
        include: { student: { select: { userId: true } } },
        take: 1,
      },
    },
  });

  let count = 0;

  for (const job of unstartedClaimedJobs) {
    const assignment = job.assignments[0];
    if (!assignment) continue;

    await prisma.$transaction(async (tx) => {
      // 1. Kembalikan job ke OPEN
      await tx.job.update({
        where: { id: job.id },
        data: { status: "OPEN" },
      });

      // 2. Assignment menjadi WITHDRAWN
      await tx.jobAssignment.update({
        where: { id: assignment.id },
        data: {
          status: "WITHDRAWN",
          endedAt: now,
        },
      });

      // 3. Batalkan entri saldo (VOIDED)
      await tx.ledgerEntry.updateMany({
        where: {
          jobId: job.id,
          assignmentId: assignment.id,
          status: "RESERVED",
        },
        data: { status: "VOIDED" },
      });

      // 4. Notifikasi mahasiswa & UMKM
      await tx.notification.create({
        data: {
          userId: assignment.student.userId,
          type: "JOB_RELEASED",
          title: "Klaim Tugas Dibatalkan Otomatis",
          body: `Tugas "${job.title}" dilepaskan kembali ke publik karena Anda tidak memulai pengerjaan dalam 24 jam pertama.`,
          href: "/student/jobs",
        },
      });

      await tx.notification.create({
        data: {
          userId: job.umkm.userId,
          type: "JOB_RELEASED",
          title: "Tugas Dibuka Kembali untuk Pelamar Baru",
          body: `Pelamar sebelumnya tidak memulai pekerjaan dalam 24 jam. Tugas "${job.title}" telah otomatis dibuka kembali ke katalog.`,
          href: `/umkm/jobs/${job.id}`,
        },
      });
    });

    count++;
  }

  return count;
}

/**
 * 7. DeadlineChangeRequest PENDING > 3 hari -> DECLINED otomatis
 */
export async function autoDeclineExpiredDeadlineRequests(now = new Date()): Promise<number> {
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const res = await prisma.deadlineChangeRequest.updateMany({
    where: {
      status: "PENDING",
      createdAt: { lt: threeDaysAgo },
    },
    data: {
      status: "DECLINED",
      respondedAt: now,
    },
  });

  return res.count;
}

/**
 * 8. ImageAsset JOB_REFERENCE tanpa jobId dan usia > 24 jam -> Cleanup
 */
export async function cleanupOrphanJobReferenceImages(now = new Date()): Promise<number> {
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const res = await prisma.imageAsset.deleteMany({
    where: {
      purpose: "JOB_REFERENCE",
      jobId: null,
      createdAt: { lt: oneDayAgo },
    },
  });

  return res.count;
}

/**
 * Runner terpadu mengeksekusi ke-8 tugas aturan waktu KARTA secara idempoten
 */
export async function runTimeRulesTick(now = new Date()): Promise<TimeRulesResult> {
  const [
    expiredOpenJobs,
    autoAcceptedJobs,
    finalizedRejections,
    expiredSubscriptions,
    remindersSent,
    autoReleasedClaims,
    autoDeclinedDeadlineRequests,
    cleanedOrphanAssets,
  ] = await Promise.all([
    expireOpenJobsPastCutoff(now),
    autoAcceptReviewPastSla(now),
    finalizeRejectionsPastDispute(now),
    expireEndedSubscriptions(now),
    sendUpcomingReminders(now),
    autoReleaseUnstartedClaimedJobs(now),
    autoDeclineExpiredDeadlineRequests(now),
    cleanupOrphanJobReferenceImages(now),
  ]);

  return {
    expiredOpenJobs,
    autoAcceptedJobs,
    finalizedRejections,
    expiredSubscriptions,
    remindersSent,
    autoReleasedClaims,
    autoDeclinedDeadlineRequests,
    cleanedOrphanAssets,
  };
}

/**
 * Evaluasi lazy aturan waktu untuk sebuah pekerjaan saat dibuka di browser
 */
export async function evaluateJobTimeRules(jobId: string, now = new Date()): Promise<void> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      status: true,
      role: true,
      packageTier: true,
      deadlineAt: true,
      reviewDueAt: true,
      disputeUntil: true,
      rejectionFinalAt: true,
    },
  });

  if (!job) return;

  // 1. Jika OPEN dan lewat batas klaim cutoff
  if (job.status === "OPEN") {
    const minHours = getMinimumDeadlineHours(job.role, job.packageTier || "BASIC");
    const cutoff = new Date(job.deadlineAt.getTime() - minHours * 60 * 60 * 1000);
    if (now > cutoff) {
      await expireOpenJobsPastCutoff(now);
    }
  }

  // 2. Jika SUBMITTED dan lewat reviewDueAt
  if (job.status === "SUBMITTED" && job.reviewDueAt && now > job.reviewDueAt) {
    await autoAcceptReviewPastSla(now);
  }

  // 3. Jika REJECTED dan lewat disputeUntil
  if (job.status === "REJECTED" && job.disputeUntil && now > job.disputeUntil && !job.rejectionFinalAt) {
    await finalizeRejectionsPastDispute(now);
  }
}

