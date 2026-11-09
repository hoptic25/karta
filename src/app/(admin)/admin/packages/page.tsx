import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { getAdminPackagesData, AdminPackagesClientView } from "@/features/subscription";

export default async function AdminPackagesPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const packages = await getAdminPackagesData();

  return (
    <AdminShell activePath="/admin/packages">
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary-brown">
            Manajemen Paket Langganan
          </h1>
          <p className="mt-1 text-xs text-primary-brown/70 font-sans">
            Konfigurasi kuota, harga, dan alokasi kompensasi mahasiswa per tugas mikro UMKM (G-5).
          </p>
        </div>

        <AdminPackagesClientView packages={packages} />
      </div>
    </AdminShell>
  );
}

