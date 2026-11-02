import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UmkmShell } from "@/components/layout/umkm-shell";
import { prisma } from "@/lib/db";
import { getUmkmJobs, JobListView } from "@/features/jobs";

export default async function UmkmJobsPage() {
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

  const jobs = await getUmkmJobs(umkm.id);

  return (
    <UmkmShell activePath="/umkm/jobs">
      <JobListView jobs={jobs} />
    </UmkmShell>
  );
}

