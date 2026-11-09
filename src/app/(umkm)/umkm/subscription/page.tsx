import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UmkmShell } from "@/components/layout/umkm-shell";
import { getUmkmSubscriptionPageData } from "@/features/subscription";
import { SubscriptionClientView } from "@/features/subscription/components/subscription-client-view";

export default async function UmkmSubscriptionPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?as=umkm");
  }

  const data = await getUmkmSubscriptionPageData(session.user.id);
  if (!data) {
    redirect("/onboarding/umkm");
  }

  return (
    <UmkmShell activePath="/umkm/subscription">
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary-brown">
            Langganan & Kuota Pekerjaan
          </h1>
          <p className="mt-1 text-xs text-primary-brown/70 font-sans">
            Kelola alokasi pekerjaan mikro, pantau sisa kuota, dan perpanjang paket usaha Anda.
          </p>
        </div>

        <SubscriptionClientView
          overview={data.overview}
          availablePackages={data.availablePackages}
        />
      </div>
    </UmkmShell>
  );
}

