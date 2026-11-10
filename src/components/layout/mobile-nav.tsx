"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { BrandLogo } from "@/components/layout/brand-logo";
import {
  Menu,
  Briefcase,
  GraduationCap,
  ArrowRight,
  LogIn,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Building2,
  TrendingUp,
} from "lucide-react";

interface MobileNavProps {
  isLoggedIn?: boolean;
  dashboardHref?: string;
}

const navLinks = [
  { href: "#cara-kerja", label: "Cara Kerja", icon: CheckCircle2 },
  { href: "#paket", label: "Paket & Harga", icon: Sparkles },
  { href: "#pembeda", label: "Keunggulan", icon: Sparkles },
  { href: "#dampak", label: "Dampak Nyata", icon: TrendingUp },
  { href: "#kampus", label: "Kampus Mitra", icon: Building2 },
  { href: "#faq", label: "FAQ", icon: HelpCircle },
];

export function MobileNav({ isLoggedIn = false, dashboardHref = "/onboarding" }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 text-primary-brown hover:bg-beige/40 cursor-pointer"
            aria-label="Buka menu navigasi"
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[300px] sm:w-[360px] bg-cream p-6 flex flex-col justify-between border-l border-beige"
      >
        <div className="space-y-6">
          <SheetHeader className="text-left pb-4 border-b border-beige/80">
            <div className="flex items-center gap-2.5">
              <BrandLogo size="md" />
              <div>
                <p className="font-heading text-base font-bold text-primary-brown">KARTA</p>
                <p className="text-[10px] font-semibold tracking-wider uppercase text-primary-brown/60">
                  Campus Marketplace
                </p>
              </div>
            </div>
            <SheetTitle className="sr-only">Navigasi Utama KARTA</SheetTitle>
            <SheetDescription className="sr-only">
              Menu navigasi mobile untuk menuju section halaman
            </SheetDescription>
          </SheetHeader>

          {/* Nav Links */}
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-primary-brown/85 hover:text-primary-brown hover:bg-beige/40 transition-colors"
              >
                <link.icon className="size-4 text-earth-sage shrink-0" />
                <span>{link.label}</span>
              </a>
            ))}
          </nav>
        </div>

        {/* Action Buttons in Drawer */}
        <div className="pt-6 border-t border-beige/80 space-y-3">
          {isLoggedIn ? (
            <Link href={dashboardHref} onClick={() => setOpen(false)} className="w-full block">
              <Button className="w-full font-semibold text-xs h-10 shadow-sm">
                Masuk ke Dashboard
                <ArrowRight className="size-3.5 ml-1.5" />
              </Button>
            </Link>
          ) : (
            <>
              <div className="space-y-2">
                <Link
                  href="/register/student"
                  onClick={() => setOpen(false)}
                  className="w-full block"
                >
                  <Button
                    variant="default"
                    className="w-full font-semibold text-xs h-10 justify-start px-3 shadow-xs"
                  >
                    <GraduationCap className="size-4 mr-2 text-earth-sand shrink-0" />
                    Daftar Mahasiswa
                  </Button>
                </Link>
                <Link
                  href="/register/umkm"
                  onClick={() => setOpen(false)}
                  className="w-full block"
                >
                  <Button
                    variant="outline"
                    className="w-full font-semibold text-xs h-10 justify-start px-3 border-beige/90 bg-white/70 hover:bg-white text-primary-brown"
                  >
                    <Briefcase className="size-4 mr-2 text-primary-brown shrink-0" />
                    Daftar UMKM
                  </Button>
                </Link>
              </div>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-brown hover:underline"
                >
                  <LogIn className="size-3.5" />
                  Sudah punya akun? Masuk
                </Link>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
