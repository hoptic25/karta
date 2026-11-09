import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../src/lib/db";
import {
  createNotification,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../src/features/notifications/notifications";

vi.mock("../src/lib/db", () => ({
  prisma: {
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

describe("Notifications System (PRD §Modul H-1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createNotification", () => {
    it("should create in-app notification with valid payload", async () => {
      vi.mocked(prisma.notification.create).mockResolvedValue({
        id: "notif-1",
        userId: "user-1",
        type: "JOB_ACCEPTED",
        title: "Tugas Diterima!",
        body: "UMKM menerima tugas Anda.",
        href: "/student/my-jobs/1",
        readAt: null,
        createdAt: new Date(),
      } as never);

      const notif = await createNotification("user-1", "JOB_ACCEPTED", {
        title: "Tugas Diterima!",
        body: "UMKM menerima tugas Anda.",
        href: "/student/my-jobs/1",
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          type: "JOB_ACCEPTED",
          title: "Tugas Diterima!",
          body: "UMKM menerima tugas Anda.",
          href: "/student/my-jobs/1",
        },
      });
      expect(notif.id).toBe("notif-1");
    });
  });

  describe("getUserNotifications", () => {
    it("should return notifications list, total, and unreadCount", async () => {
      const mockNotifs = [
        {
          id: "notif-1",
          userId: "user-1",
          type: "JOB_CLAIMED",
          title: "Tugas Diklaim",
          body: "Pekerjaan Anda telah diklaim.",
          href: "/umkm/jobs/1",
          readAt: null,
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.notification.findMany).mockResolvedValue(mockNotifs as never);
      vi.mocked(prisma.notification.count)
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(1); // unreadCount

      const res = await getUserNotifications("user-1", { limit: 10 });

      expect(res.notifications).toHaveLength(1);
      expect(res.total).toBe(1);
      expect(res.unreadCount).toBe(1);
    });
  });

  describe("getUnreadNotificationCount", () => {
    it("should return count of notifications with readAt null", async () => {
      vi.mocked(prisma.notification.count).mockResolvedValue(3);

      const count = await getUnreadNotificationCount("user-1");

      expect(count).toBe(3);
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          readAt: null,
        },
      });
    });
  });

  describe("markNotificationAsRead", () => {
    it("should update readAt if notification belongs to user", async () => {
      vi.mocked(prisma.notification.findUnique).mockResolvedValue({
        id: "notif-1",
        userId: "user-1",
        readAt: null,
      } as never);

      vi.mocked(prisma.notification.update).mockResolvedValue({
        id: "notif-1",
        userId: "user-1",
        readAt: new Date(),
      } as never);

      const res = await markNotificationAsRead("user-1", "notif-1");

      expect(res.success).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: "notif-1" },
        data: expect.objectContaining({ readAt: expect.any(Date) }),
      });
    });

    it("should fail if notification belongs to different user", async () => {
      vi.mocked(prisma.notification.findUnique).mockResolvedValue({
        id: "notif-1",
        userId: "user-2", // different user
        readAt: null,
      } as never);

      const res = await markNotificationAsRead("user-1", "notif-1");

      expect(res.success).toBe(false);
      expect(res.error).toBe("Notifikasi tidak ditemukan.");
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });
  });

  describe("markAllNotificationsAsRead", () => {
    it("should update all unread notifications of user to read", async () => {
      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 5 });

      const res = await markAllNotificationsAsRead("user-1");

      expect(res.success).toBe(true);
      expect(res.count).toBe(5);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          readAt: null,
        },
        data: expect.objectContaining({ readAt: expect.any(Date) }),
      });
    });
  });
});

