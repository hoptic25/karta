import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { UmkmShell } from "@/components/layout/umkm-shell";
import { getUmkmProfileByUserId } from "@/features/auth";
import {
  getUmkmJobDetail,
  getJobPublishOptions,
  JobDetailView,
} from "@/features/jobs";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login?as=umkm");
  }

  const umkm = await getUmkmProfileByUserId(session.user.id);

  if (!umkm) {
    redirect("/onboarding/umkm");
  }

  const [job, availableSubscriptions] = await Promise.all([
    getUmkmJobDetail(id, umkm.id),
    getJobPublishOptions(umkm.id),
  ]);

  if (!job) {
    notFound();
  }

  return (
    <UmkmShell activePath="/umkm/jobs">
      <JobDetailView job={job} availableSubscriptions={availableSubscriptions} />
    </UmkmShell>
  );
}
