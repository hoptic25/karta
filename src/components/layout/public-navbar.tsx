import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";

export async function PublicNavbar() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-beige bg-cream/95 backdrop-blur-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-heading text-2xl font-bold tracking-tight text-primary-brown">
            KARTA
          </span>
          <span className="hidden sm:inline-block text-xs font-medium text-primary-brown/60 tracking-wider uppercase border-l border-beige pl-2">
            Campus Marketplace
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-primary-brown">
          <Link
            href="#cara-kerja"
            className="transition-colors hover:text-primary-brown/70"
          >
            Cara Kerja
          </Link>
          <Link
            href="#paket"
            className="transition-colors hover:text-primary-brown/70"
          >
            Paket & Harga
          </Link>
          <Link
            href="#pembeda"
            className="transition-colors hover:text-primary-brown/70"
          >
            Keunggulan
          </Link>
          <Link
            href="#dampak"
            className="transition-colors hover:text-primary-brown/70"
          >
            Dampak Nyata
          </Link>
          <Link
            href="#faq"
            className="transition-colors hover:text-primary-brown/70"
          >
            FAQ
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {session?.user ? (
            <Link
              href={
                session.user.role === "STUDENT"
                  ? "/student"
                  : session.user.role === "UMKM"
                  ? "/umkm"
                  : session.user.role === "ADMIN"
                  ? "/admin"
                  : "/onboarding"
              }
            >
              <Button size="sm">Dashboard ({session.user.name?.split(" ")[0] || "Saya"})</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="secondary" size="sm">
                  Masuk
                </Button>
              </Link>
              <Link href="/login?as=student">
                <Button size="sm">Daftar</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

