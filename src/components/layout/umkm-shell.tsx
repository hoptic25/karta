import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
import {
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  CreditCard,
  Building,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { NotificationBell } from "@/features/notifications";

interface UmkmShellProps {
  children: React.ReactNode;
  activePath?: string;
}

export async function UmkmShell({ children, activePath }: UmkmShellProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?as=umkm");
  }

  if (session.user.role !== "UMKM" && session.user.role !== "ADMIN") {
    redirect("/student");
  }

  const navItems = [
    { label: "Dashboard", href: "/umkm", icon: LayoutDashboard },
    { label: "Kelola Pekerjaan", href: "/umkm/jobs", icon: Briefcase },
    { label: "Buat Job Baru", href: "/umkm/jobs/new", icon: PlusCircle },
    { label: "Langganan & Kuota", href: "/umkm/subscription", icon: CreditCard },
    { label: "Profil Usaha", href: "/umkm/profile", icon: Building },
  ];

  return (
    <div className="min-h-screen flex bg-cream text-primary-brown">
      {/* SIDEBAR (Kiri) */}
      <aside className="w-64 border-r border-beige bg-white flex flex-col justify-between shrink-0 hidden md:flex">
        <div>
          {/* Brand */}
          <div className="h-16 border-b border-beige px-6 flex items-center justify-between">
            <BrandLogo
              size="sm"
              badge="UMKM"
              badgeClassName="bg-primary-brown text-white font-semibold"
            />
          </div>

          {/* Navigation items */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-semibold tracking-wide transition-colors ${isActive
                      ? "bg-primary-brown text-white"
                      : "text-primary-brown/80 hover:bg-cream hover:text-primary-brown"
                    }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-beige space-y-3">
          <div className="px-2 py-1">
            <p className="text-xs font-semibold text-primary-brown truncate">
              {session.user.name || "Pemilik UMKM"}
            </p>
            <p className="text-[11px] text-primary-brown/60 truncate font-sans">
              {session.user.email}
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            >
              <LogOut className="size-3.5" />
              <span>Keluar</span>
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTENT AREA (Kanan) */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-beige bg-white/90 backdrop-blur-xs px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 md:hidden">
            <BrandLogo
              size="xs"
              badge="UMKM"
              badgeClassName="bg-primary-brown text-white font-semibold"
            />
          </div>

          <div className="hidden sm:block">
            <p className="text-xs text-primary-brown/70 font-sans">
              Portal Manajemen Usaha & Pekerjaan Mikro
            </p>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell viewAllHref="/umkm/notifications" />

            <Link
              href="/"
              target="_blank"
              className="p-2 rounded-md border border-beige hover:bg-cream text-primary-brown transition-colors hidden sm:flex items-center gap-1 text-xs"
            >
              <ExternalLink className="size-3.5" />
              <span>Lihat Web</span>
            </Link>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Bottom Navigation (Mobile Only) */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-beige flex items-center justify-around py-2 px-1 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                  isActive ? "text-earth-primary font-bold" : "text-primary-brown/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

