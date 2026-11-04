import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Mail, ArrowUpRight } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-beige bg-cream text-primary-brown">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand info */}
          <div className="md:col-span-5 space-y-4">
            <BrandLogo size="md" />
            <p className="max-w-sm text-sm text-primary-brown/70 leading-relaxed font-sans">
              Platform B2B2C Campus-Based Micro Job Marketplace yang menghubungkan
              UMKM dengan talenta mahasiswa kampus mitra. Bangun reputasi
              terverifikasi dan capai pertumbuhan inklusif.
            </p>
            <p className="text-xs text-primary-brown/50 leading-relaxed">
              Mendukung SDG 8 (Pertumbuhan Ekonomi &amp; Pekerjaan Layak)
              dan SDG 10 (Mengurangi Ketimpangan).
            </p>
          </div>

          {/* Platform Links */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="font-heading text-sm font-bold text-primary-brown uppercase tracking-wide">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-primary-brown/70 font-sans">
              <li>
                <Link href="#cara-kerja" className="hover:text-primary-brown transition-colors inline-flex items-center gap-1">
                  Cara Kerja
                </Link>
              </li>
              <li>
                <Link href="#paket" className="hover:text-primary-brown transition-colors inline-flex items-center gap-1">
                  Paket Langganan
                </Link>
              </li>
              <li>
                <Link href="#dampak" className="hover:text-primary-brown transition-colors inline-flex items-center gap-1">
                  Impact Dashboard
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-primary-brown transition-colors inline-flex items-center gap-1">
                  Masuk Akun
                  <ArrowUpRight className="size-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Contacts */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="font-heading text-sm font-bold text-primary-brown uppercase tracking-wide">
              Informasi &amp; Kebijakan
            </h4>
            <ul className="space-y-2.5 text-sm text-primary-brown/70 font-sans">
              <li>
                <Link href="/privacy" className="hover:text-primary-brown transition-colors">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary-brown transition-colors">
                  Syarat &amp; Ketentuan
                </Link>
              </li>
              <li className="pt-2 flex items-center gap-2 text-primary-brown/70">
                <Mail className="size-3.5 shrink-0" />
                <a
                  href="mailto:support@karta.id"
                  className="hover:text-primary-brown transition-colors font-medium"
                >
                  support@karta.id
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-beige/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-primary-brown/50">
          <p>&copy; {new Date().getFullYear()} KARTA. Hak cipta dilindungi.</p>
          <p className="font-serif italic">
            Membangun masa depan generasi muda dan UMKM Indonesia.
          </p>
        </div>
      </div>
    </footer>
  );
}
