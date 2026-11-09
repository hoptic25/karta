import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { getAllUsers } from "@/features/admin-users";
import { AdminUsersClientView } from "@/features/admin-users/components/admin-users-client-view";

export const metadata = {
  title: "Kelola Pengguna — Admin | Karta",
};

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const users = await getAllUsers();

  return (
    <AdminShell activePath="/admin/users">
      <Suspense fallback={<div>Loading...</div>}>
        <AdminUsersClientView
          initialUsers={users}
          currentUserId={session.user.id}
        />
      </Suspense>
    </AdminShell>
  );
}
