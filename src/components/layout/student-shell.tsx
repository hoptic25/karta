import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
import {
  LayoutDashboard,
  Compass,
  Briefcase,
  Wallet,
  User as UserIcon,
  LogOut,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { NotificationBell } from "@/features/notifications";

interface StudentShellProps {
  children: React.ReactNode;
  activePath?: string;
}

export async function StudentShell({ children, activePath }: StudentShellProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?as=student");
  }

  if (session.user.role !== "STUDENT" && session.user.role !== "ADMIN") {
    redirect("/umkm");
  }

  const navItems = [
    { label: "Dashboard", href: "/student", icon: LayoutDashboard },
    { label: "Cari Lowongan", href: "/student/jobs", icon: Compass },
    { label: "Pekerjaan Saya", href: "/student/my-jobs", icon: Briefcase },
    { label: "Penghasilan", href: "/student/earnings", icon: Wallet },
    { label: "Profil Saya", href: "/student/profile", icon: UserIcon },
  ];

  return (
    <div className="min-h-screen flex bg-cream text-primary-brown">
      {/* SIDEBAR (Kiri Desktop) */}
      <aside className="w-64 border-r border-beige bg-white flex flex-col justify-between shrink-0 hidden md:flex">
        <div>
          {/* Brand */}
          <div className="h-16 border-b border-beige px-6 flex items-center justify-between">
            <BrandLogo
              size="sm"
              badge="Mahasiswa"
              badgeClassName="bg-earth-sage text-white font-semibold"
            />
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePath === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                    isActive
                      ? "bg-earth-primary text-white shadow-xs"
                      : "text-primary-brown/70 hover:bg-cream hover:text-primary-brown"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="p-4 border-t border-beige space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-earth-primary/10 text-earth-primary flex items-center justify-center font-bold text-sm shrink-0">
              {session.user.name?.charAt(0) || "M"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-primary-brown truncate">
                {session.user.name || "Mahasiswa"}
              </div>
              <div className="text-[10px] text-primary-brown/60 truncate">
                {session.user.email}
              </div>
            </div>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Keluar Akun
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Top bar mobile */}
        <header className="h-16 border-b border-beige bg-white flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <BrandLogo
              size="xs"
              badge="Mhs"
              badgeClassName="bg-earth-sage text-white font-semibold"
            />
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-primary-brown/60">
            <Sparkles className="w-4 h-4 text-earth-primary" />
            <span>Katalog Tugas Mikro Kampus & UMKM Indonesia</span>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell viewAllHref="/student/notifications" />

            <Link
              href="/"
              className="text-xs text-primary-brown/70 hover:text-earth-primary flex items-center gap-1 font-medium transition-colors"
            >
              <span>Beranda</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
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
