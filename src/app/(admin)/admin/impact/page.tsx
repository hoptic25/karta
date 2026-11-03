import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { getDetailedImpactMetrics } from "@/features/platform/impact";
import { AdminImpactView } from "@/features/platform/components/admin-impact-view";

export const metadata = {
  title: "Impact Dashboard (SDG) — Admin KARTA",
};

export default async function AdminImpactPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const metrics = await getDetailedImpactMetrics();

  return (
    <AdminShell activePath="/admin/impact">
      <AdminImpactView metrics={metrics} />
    </AdminShell>
  );
}

