import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { getAllJobs } from "@/features/admin-jobs";
import { AdminJobsClientView } from "@/features/admin-jobs/components/admin-jobs-client-view";

export const metadata = {
  title: "Moderasi Pekerjaan — Admin | Karta",
};

export default async function AdminJobsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const jobs = await getAllJobs();

  return (
    <AdminShell activePath="/admin/jobs">
      <Suspense fallback={<div>Loading...</div>}>
        <AdminJobsClientView initialJobs={jobs} />
      </Suspense>
    </AdminShell>
  );
}
