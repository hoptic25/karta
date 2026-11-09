import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UmkmShell } from "@/components/layout/umkm-shell";
import { getUserNotifications, NotificationsClientView } from "@/features/notifications";

export const metadata = {
  title: "Notifikasi UMKM — KARTA",
};

export default async function UmkmNotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?as=umkm");
  }

  const { notifications, total, unreadCount } = await getUserNotifications(session.user.id, {
    limit: 50,
  });

  return (
    <UmkmShell activePath="/umkm/notifications">
      <NotificationsClientView
        initialNotifications={notifications}
        total={total}
        initialUnreadCount={unreadCount}
      />
    </UmkmShell>
  );
}

