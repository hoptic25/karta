import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { getAdminWithdrawals, AdminWithdrawalsClientView } from "@/features/finance";

export const metadata = {
  title: "Penarikan Dana Mahasiswa | Admin KARTA",
  description: "Verifikasi dan audit penarikan dana honor mahasiswa",
};

export default async function AdminWithdrawalsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const withdrawals = await getAdminWithdrawals();

  return (
    <AdminShell activePath="/admin/withdrawals">
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary-brown">
            Penarikan Dana Mahasiswa
          </h1>
          <p className="mt-1 text-xs text-primary-brown/70">
            Tinjau pengajuan pencairan saldo honor mahasiswa, lakukan transfer manual per bank, dan konfirmasi bukti transaksi.
          </p>
        </div>

        <AdminWithdrawalsClientView withdrawals={withdrawals} />
      </div>
    </AdminShell>
  );
}

