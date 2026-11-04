import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";

export function PublicFooter() {
  return (
    <footer className="border-t border-beige bg-cream text-primary-brown">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-4 md:col-span-2">
            <BrandLogo size="md" />
            <p className="max-w-md text-sm text-primary-brown/80 leading-relaxed font-sans">
              Platform B2B2C Campus-Based Micro Job Marketplace yang menghubungkan
              UMKM dengan talenta mahasiswa kampus mitra. Bangun reputasi
              terverifikasi, percepat pekerjaan UMKM, dan capai pertumbuhan inklusif.
            </p>
            <p className="text-xs text-primary-brown/60">
              Mendukung Tujuan Pembangunan Berkelanjutan (SDG 8: Pertumbuhan Ekonomi & Pekerjaan Layak, SDG 10: Mengurangi Ketimpangan).
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="font-heading text-base font-semibold text-primary-brown">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-primary-brown/80 font-sans">
              <li>
                <Link href="#cara-kerja" className="hover:text-primary-brown">
                  Cara Kerja
                </Link>
              </li>
              <li>
                <Link href="#paket" className="hover:text-primary-brown">
                  Paket Langganan
                </Link>
              </li>
              <li>
                <Link href="#dampak" className="hover:text-primary-brown">
                  Impact Dashboard
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-primary-brown">
                  Masuk Akun
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Contacts */}
          <div className="space-y-3">
            <h4 className="font-heading text-base font-semibold text-primary-brown">
              Informasi & Kebijakan
            </h4>
            <ul className="space-y-2 text-sm text-primary-brown/80 font-sans">
              <li>
                <Link href="/privacy" className="hover:text-primary-brown">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary-brown">
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <span className="text-xs text-primary-brown/60 block mt-2">
                  Hubungi Dukungan:
                </span>
                <a
                  href="mailto:support@karta.id"
                  className="hover:text-primary-brown text-sm font-medium"
                >
                  support@karta.id
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-beige/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-primary-brown/60">
          <p>© {new Date().getFullYear()} KARTA. Hak cipta dilindungi.</p>
          <p className="mt-2 sm:mt-0 font-serif italic">
            Membangun masa depan generasi muda dan UMKM Indonesia.
          </p>
        </div>
      </div>
    </footer>
  );
}

