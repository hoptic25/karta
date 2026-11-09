import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { getAllJobRoles } from "@/features/job-roles";
import { AdminJobRolesClientView } from "@/features/job-roles/components/admin-job-roles-client-view";

export const metadata = {
  title: "Jenis Pekerjaan — Admin | Karta",
};

export default async function AdminJobRolesPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const roles = await getAllJobRoles();

  return (
    <AdminShell activePath="/admin/job-roles">
      <Suspense fallback={<div>Loading...</div>}>
        <AdminJobRolesClientView initialRoles={roles} />
      </Suspense>
    </AdminShell>
  );
}
