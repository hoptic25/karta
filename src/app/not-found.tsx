import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-beige shadow-lg text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-earth-primary/10 text-earth-primary flex items-center justify-center mx-auto">
          <Compass className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-4xl font-heading font-extrabold text-primary-brown">
            404
          </span>
          <h1 className="font-heading text-xl font-bold text-primary-brown">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs text-primary-brown/70 leading-relaxed font-sans">
            Halaman yang Anda tuju mungkin telah dipindahkan, dihapus, atau tautan yang Anda masukkan salah.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/">
            <Button className="bg-earth-primary hover:bg-earth-primary/90 text-white flex items-center gap-2 mx-auto cursor-pointer">
              <Home className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

