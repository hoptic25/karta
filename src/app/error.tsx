"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("KARTA Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-beige shadow-lg text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold text-primary-brown">
            Terjadi Kendala Sistem
          </h1>
          <p className="text-xs text-primary-brown/70 leading-relaxed font-sans">
            Maaf, kami mengalami kendala teknis saat memproses permintaan Anda.
            Silakan coba muat ulang atau kembali ke halaman beranda.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-earth-primary hover:bg-earth-primary/90 text-white flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Coba Lagi</span>
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-beige flex items-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Beranda</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

