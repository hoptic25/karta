import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { getAuditLogs } from "@/features/platform/audit";
import { AdminAuditView } from "@/features/platform/components/admin-audit-view";

export const metadata = {
  title: "Audit Log — Admin KARTA",
};

export default async function AdminAuditPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const initialData = await getAuditLogs({ take: 100 });

  return (
    <AdminShell activePath="/admin/audit">
      <AdminAuditView initialData={initialData} />
    </AdminShell>
  );
}

