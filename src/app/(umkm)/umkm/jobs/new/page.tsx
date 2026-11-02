import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UmkmShell } from "@/components/layout/umkm-shell";
import { prisma } from "@/lib/db";
import { JobForm } from "@/features/jobs";

export default async function NewJobPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?as=umkm");
  }

  const umkm = await prisma.umkmProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!umkm) {
    redirect("/onboarding/umkm");
  }

  return (
    <UmkmShell activePath="/umkm/jobs/new">
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary-brown">
            Buat Tugas Mikro Baru
          </h1>
          <p className="mt-1 text-xs text-primary-brown/70 font-sans">
            Tentukan kriteria tugas yang jelas untuk dikerjakan oleh mahasiswa universitas mitra KARTA.
          </p>
        </div>

        <JobForm mode="CREATE" />
      </div>
    </UmkmShell>
  );
}

