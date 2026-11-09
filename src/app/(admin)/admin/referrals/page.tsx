import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { getAllReferralCodes } from "@/features/referral";
import { AdminReferralClientView } from "@/features/referral/components/admin-referral-client-view";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Kode Referral — Admin | Karta",
};

export default async function AdminReferralsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const referralCodes = await getAllReferralCodes();
  const campuses = await prisma.campus.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <AdminShell activePath="/admin/referrals">
      <Suspense fallback={<div>Loading...</div>}>
        <AdminReferralClientView
          initialReferralCodes={referralCodes}
          campuses={campuses}
        />
      </Suspense>
    </AdminShell>
  );
}
