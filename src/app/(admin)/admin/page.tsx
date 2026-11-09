import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { getAdminDashboardSummary } from "@/features/platform/admin-overview";
import { AdminOverviewView } from "@/features/platform/components/admin-overview-view";

export const metadata = {
  title: "Ringkasan Admin — KARTA",
};

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const summary = await getAdminDashboardSummary();

  return (
    <AdminShell activePath="/admin">
      <AdminOverviewView summary={summary} />
    </AdminShell>
  );
}

