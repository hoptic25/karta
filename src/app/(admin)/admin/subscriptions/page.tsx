import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { getAdminSubscriptionsData } from "@/features/subscription";
import { AdminSubscriptionClientView } from "@/features/subscription/components/admin-subscription-client-view";

export default async function AdminSubscriptionsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const data = await getAdminSubscriptionsData();

  return (
    <AdminShell activePath="/admin/subscriptions">
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary-brown">
            Verifikasi Pembayaran Langganan
          </h1>
          <p className="mt-1 text-xs text-primary-brown/70 font-sans">
            Tinjau bukti transfer manual UMKM dan aktifkan kuota paket langganan secara instan.
          </p>
        </div>

        <AdminSubscriptionClientView
          pendingQueue={data.pendingQueue}
          recentHistory={data.recentHistory}
        />
      </div>
    </AdminShell>
  );
}

