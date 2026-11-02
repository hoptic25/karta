import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import {
  getAdminDisputes,
  getAdminFailureReports,
  AdminDisputesClientView,
} from "@/features/jobs";

export const metadata = {
  title: "Sengketa & Laporan Kendala | Admin KARTA",
  description: "Moderasi dan resolusi sengketa pekerjaan mikro mahasiswa dan UMKM",
};

export default async function AdminDisputesPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const [disputes, failureReports] = await Promise.all([
    getAdminDisputes(),
    getAdminFailureReports(),
  ]);

  return (
    <AdminShell activePath="/admin/disputes">
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary-brown">
            Sengketa & Laporan Kendala
          </h1>
          <p className="mt-1 text-xs text-primary-brown/70">
            Pusat moderasi objektif untuk menyelesaikan sanggahan penolakan tugas (Disputes) dan pelaporan kegagalan pengerjaan (Failure Reports).
          </p>
        </div>

        <AdminDisputesClientView
          disputes={disputes}
          failureReports={failureReports}
        />
      </div>
    </AdminShell>
  );
}

