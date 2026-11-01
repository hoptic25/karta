import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { GraduationCap, Briefcase, ArrowRight } from "lucide-react";

export default async function OnboardingHubPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "STUDENT") redirect("/student");
  if (session.user.role === "UMKM") redirect("/umkm");
  if (session.user.role === "ADMIN") redirect("/admin");

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-cream px-4 py-12">
      <div className="w-full max-w-xl space-y-8">
        <div className="text-center">
          <span className="font-heading text-3xl font-bold tracking-tight text-primary-brown">
            KARTA
          </span>
          <h1 className="mt-3 font-heading text-2xl sm:text-3xl font-semibold text-primary-brown">
            Pilih Peran Anda di Karta
          </h1>
          <p className="mt-2 text-sm text-primary-brown/75 font-sans">
            Halo, <strong className="text-primary-brown">{session.user.name || session.user.email}</strong>. Silakan pilih bagaimana Anda ingin menggunakan platform ini. Pilihan peran bersifat permanen untuk akun ini.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Card Mahasiswa */}
          <Link
            href="/onboarding/student"
            className="group border border-beige bg-white p-6 rounded-lg hover:border-primary-brown transition-all flex flex-col justify-between"
          >
            <div>
              <div className="p-3 w-fit rounded-md bg-cream text-primary-brown mb-4 group-hover:bg-primary-brown group-hover:text-white transition-colors">
                <GraduationCap className="size-6" />
              </div>
              <h2 className="font-heading text-xl font-semibold text-primary-brown">
                Mahasiswa Kampus
              </h2>
              <p className="mt-2 text-xs text-primary-brown/80 font-sans leading-relaxed">
                Ambil tugas mikro dari UMKM, peroleh imbalan terlindungi, dan bangun portofolio keahlian terverifikasi. Membutuhkan kode referral dari universitas mitra.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold uppercase text-primary-brown tracking-wider">
              <span>Lanjut Daftar</span>
              <ArrowRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Card UMKM */}
          <Link
            href="/onboarding/umkm"
            className="group border border-beige bg-white p-6 rounded-lg hover:border-primary-brown transition-all flex flex-col justify-between"
          >
            <div>
              <div className="p-3 w-fit rounded-md bg-cream text-primary-brown mb-4 group-hover:bg-primary-brown group-hover:text-white transition-colors">
                <Briefcase className="size-6" />
              </div>
              <h2 className="font-heading text-xl font-semibold text-primary-brown">
                Pemilik UMKM
              </h2>
              <p className="mt-2 text-xs text-primary-brown/80 font-sans leading-relaxed">
                Publikasikan tugas operasional bisnis, tetapkan kriteria keberhasilan yang jelas, dan dapatkan hasil kerja cepat dari talenta kampus terbaik.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs font-semibold uppercase text-primary-brown tracking-wider">
              <span>Lanjut Daftar</span>
              <ArrowRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

