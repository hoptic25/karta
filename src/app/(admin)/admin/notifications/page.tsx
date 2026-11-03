import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { getUserNotifications, NotificationsClientView } from "@/features/notifications";

export const metadata = {
  title: "Notifikasi Admin — KARTA",
};

export default async function AdminNotificationsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const { notifications, total, unreadCount } = await getUserNotifications(session.user.id, {
    limit: 50,
  });

  return (
    <AdminShell activePath="/admin/notifications">
      <NotificationsClientView
        initialNotifications={notifications}
        total={total}
        initialUnreadCount={unreadCount}
      />
    </AdminShell>
  );
}

