import "server-only";

import { prisma } from "@/lib/db";

export interface CreateNotificationInput {
  title: string;
  body: string;
  href?: string;
}

/**
 * H-1: Membuat notifikasi in-app
 */
export async function createNotification(
  userId: string,
  type: string,
  payload: CreateNotificationInput
) {
  return await prisma.notification.create({
    data: {
      userId,
      type,
      title: payload.title,
      body: payload.body,
      href: payload.href || null,
    },
  });
}

/**
 * Mengambil daftar notifikasi pengguna
 */
export async function getUserNotifications(
  userId: string,
  options: {
    limit?: number;
    unreadOnly?: boolean;
    skip?: number;
  } = {}
) {
  const { limit = 20, unreadOnly = false, skip = 0 } = options;

  const where = {
    userId,
    ...(unreadOnly ? { readAt: null } : {}),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId, readAt: null },
    }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
  };
}

/**
 * Mengambil jumlah notifikasi belum dibaca
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return await prisma.notification.count({
    where: {
      userId,
      readAt: null,
    },
  });
}

/**
 * Menandai satu notifikasi sebagai telah dibaca
 */
export async function markNotificationAsRead(userId: string, notificationId: string) {
  const notif = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notif || notif.userId !== userId) {
    return { success: false, error: "Notifikasi tidak ditemukan." };
  }

  if (notif.readAt) {
    return { success: true, notification: notif };
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });

  return { success: true, notification: updated };
}

/**
 * Menandai semua notifikasi pengguna sebagai telah dibaca
 */
export async function markAllNotificationsAsRead(userId: string) {
  const res = await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  return { success: true, count: res.count };
}

