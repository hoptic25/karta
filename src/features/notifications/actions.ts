"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "./notifications";

export async function fetchNotificationsAction(options?: {
  limit?: number;
  unreadOnly?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Tidak terautentikasi." };
  }

  try {
    const data = await getUserNotifications(session.user.id, options);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memuat notifikasi.",
    };
  }
}

export async function fetchUnreadCountAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, unreadCount: 0 };
  }

  try {
    const unreadCount = await getUnreadNotificationCount(session.user.id);
    return { success: true, unreadCount };
  } catch {
    return { success: false, unreadCount: 0 };
  }
}

export async function markAsReadAction(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Tidak terautentikasi." };
  }

  try {
    const res = await markNotificationAsRead(session.user.id, notificationId);
    revalidatePath("/student/notifications");
    revalidatePath("/umkm/notifications");
    revalidatePath("/admin/notifications");
    return res;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menandai notifikasi.",
    };
  }
}

export async function markAllAsReadAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Tidak terautentikasi." };
  }

  try {
    const res = await markAllNotificationsAsRead(session.user.id);
    revalidatePath("/student/notifications");
    revalidatePath("/umkm/notifications");
    revalidatePath("/admin/notifications");
    return res;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menandai seluruh notifikasi.",
    };
  }
}

