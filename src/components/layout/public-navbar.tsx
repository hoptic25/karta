import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/auth";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ArrowRight, LogIn, ChevronDown, GraduationCap, Briefcase } from "lucide-react";

async function NavbarAuthButtons() {
  const session = await auth();

  if (session?.user) {
    return (
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
        <Button size="sm" className="font-semibold text-xs h-9 px-4">
          Masuk ke Dashboard
          <ArrowRight className="size-3.5 ml-1.5" />
        </Button>
      </Link>
    );
  }

  return (
    <>
      <Link href="/login">
        <Button
          variant="outline"
          size="sm"
          className="font-semibold text-xs border-beige/90 text-primary-brown hover:bg-white h-9 px-4"
        >
          <LogIn className="size-3.5 mr-1" />
          Masuk
        </Button>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button size="sm" className="font-semibold text-xs h-9 px-4" />}
        >
          Daftar
          <ChevronDown className="size-3.5 ml-1" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <Link href="/register/student">
            <DropdownMenuItem className="cursor-pointer">
              <GraduationCap className="size-4 mr-2 text-earth-sage" />
              <div className="flex flex-col">
                <span className="font-semibold text-xs">Daftar sebagai Mahasiswa</span>
                <span className="text-[10px] text-muted-foreground">Kerjakan tugas mikro</span>
              </div>
            </DropdownMenuItem>
          </Link>
          <Link href="/register/umkm">
            <DropdownMenuItem className="cursor-pointer">
              <Briefcase className="size-4 mr-2 text-primary-brown" />
              <div className="flex flex-col">
                <span className="font-semibold text-xs">Daftar sebagai UMKM</span>
                <span className="text-[10px] text-muted-foreground">Publikasikan pekerjaan</span>
              </div>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-beige/80 bg-cream/95 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <BrandLogo size="md" priority />
          <span className="hidden sm:inline-block text-[11px] font-bold text-primary-brown/85 tracking-widest uppercase border-l border-beige/90 pl-3">
            Campus Marketplace
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-wide text-primary-brown">
          <Link
            href="#cara-kerja"
            className="transition-colors hover:text-earth-sage py-1"
          >
            Cara Kerja
          </Link>
          <Link
            href="#paket"
            className="transition-colors hover:text-earth-sage py-1"
          >
            Paket &amp; Harga
          </Link>
          <Link
            href="#pembeda"
            className="transition-colors hover:text-earth-sage py-1"
          >
            Keunggulan
          </Link>
          <Link
            href="#dampak"
            className="transition-colors hover:text-earth-sage py-1"
          >
            Dampak Nyata
          </Link>
          <Link
            href="#kampus"
            className="transition-colors hover:text-earth-sage py-1"
          >
            Kampus Mitra
          </Link>
          <Link
            href="#faq"
            className="transition-colors hover:text-earth-sage py-1"
          >
            FAQ
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 min-w-[140px] justify-end">
          <Suspense
            fallback={
              <div className="flex items-center gap-2">
                <div className="h-9 w-18 rounded-md bg-beige/40 animate-pulse" />
                <div className="h-9 w-20 rounded-md bg-beige/40 animate-pulse" />
              </div>
            }
          >
            <NavbarAuthButtons />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
