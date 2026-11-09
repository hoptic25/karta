import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { getAllCampuses } from "@/features/campus";
import { AdminCampusClientView } from "@/features/campus/components/admin-campus-client-view";

export const metadata = {
  title: "Kampus Mitra — Admin | Karta",
};

export default async function AdminCampusesPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const campuses = await getAllCampuses();

  return (
    <AdminShell activePath="/admin/campuses">
      <Suspense fallback={<div>Loading...</div>}>
        <AdminCampusClientView initialCampuses={campuses} />
      </Suspense>
    </AdminShell>
  );
}
