import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-cream px-4 py-12">
      <div className="w-full max-w-md text-center space-y-6">
        <span className="font-heading text-3xl font-bold tracking-tight text-primary-brown">
          KARTA
        </span>

        <div className="border border-destructive/40 bg-white p-8 rounded-lg space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertCircle className="size-6" />
          </div>

          <h1 className="font-heading text-2xl font-semibold text-primary-brown">
            Akun Dinonaktifkan
          </h1>

          <p className="text-xs text-primary-brown/80 font-sans leading-relaxed">
            Akun Anda saat ini ditangguhkan oleh tim administrator Karta karena adanya indikasi pelanggaran aturan integritas platform.
          </p>

          <p className="text-xs text-primary-brown/60 font-sans">
            Jika Anda merasa ini adalah kekeliruan, silakan hubungi tim dukungan kami melalui email di{" "}
            <a
              href="mailto:support@karta.id"
              className="text-primary-brown underline font-medium"
            >
              support@karta.id
            </a>
            .
          </p>

          <div className="pt-4 border-t border-beige">
            <Link href="/">
              <Button variant="secondary" size="sm" className="w-full">
                Kembali ke Beranda
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

