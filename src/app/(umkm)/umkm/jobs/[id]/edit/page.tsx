import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { UmkmShell } from "@/components/layout/umkm-shell";
import { getUmkmProfileByUserId } from "@/features/auth";
import { getJobForEdit, JobForm } from "@/features/jobs";

interface JobEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobEditPage({ params }: JobEditPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login?as=umkm");
  }

  const umkm = await getUmkmProfileByUserId(session.user.id);

  if (!umkm) {
    redirect("/onboarding/umkm");
  }

  const job = await getJobForEdit(id, umkm.id);

  if (!job) {
    notFound();
  }

  if (job.status !== "DRAFT" && job.status !== "OPEN") {
    redirect(`/umkm/jobs/${job.id}`);
  }

  const mode = job.status === "OPEN" ? "EDIT_OPEN" : "EDIT_DRAFT";

  return (
    <UmkmShell activePath="/umkm/jobs">
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary-brown">
            {mode === "EDIT_OPEN" ? "Ubah Konten & Tenggat Pekerjaan" : "Ubah Draf Pekerjaan"}
          </h1>
          <p className="mt-1 text-xs text-primary-brown/70 font-sans">
            {mode === "EDIT_OPEN"
              ? "Pekerjaan berstatus OPEN hanya dapat diubah judul, deskripsi, checklist, dan tenggat waktu."
              : "Lengkapi brief pekerjaan mikro sebelum dipublikasikan ke mahasiswa mitra."}
          </p>
        </div>

        <JobForm mode={mode} initialJob={job} />
      </div>
    </UmkmShell>
  );
}
