import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StudentShell } from "@/components/layout/student-shell";
import { getUserNotifications, NotificationsClientView } from "@/features/notifications";

export const metadata = {
  title: "Notifikasi Mahasiswa — KARTA",
};

export default async function StudentNotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?as=student");
  }

  const { notifications, total, unreadCount } = await getUserNotifications(session.user.id, {
    limit: 50,
  });

  return (
    <StudentShell activePath="/student/notifications">
      <NotificationsClientView
        initialNotifications={notifications}
        total={total}
        initialUnreadCount={unreadCount}
      />
    </StudentShell>
  );
}

