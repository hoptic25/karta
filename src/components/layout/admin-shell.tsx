import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Package,
  Users,
  GraduationCap,
  KeyRound,
  Briefcase,
  Wallet,
  AlertTriangle,
  FileText,
  BarChart3,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { NotificationBell } from "@/features/notifications";

interface AdminShellProps {
  children: React.ReactNode;
  activePath?: string;
}

export async function AdminShell({ children, activePath }: AdminShellProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const navItems = [
    { label: "Ringkasan", href: "/admin", icon: LayoutDashboard },
    { label: "Verifikasi Pembayaran", href: "/admin/subscriptions", icon: CreditCard },
    { label: "Paket Langganan", href: "/admin/packages", icon: Package },
    { label: "Pengguna", href: "/admin/users", icon: Users },
    { label: "Kampus Mitra", href: "/admin/campuses", icon: GraduationCap },
    { label: "Kode Referral", href: "/admin/referrals", icon: KeyRound },
    { label: "Moderasi Pekerjaan", href: "/admin/jobs", icon: Briefcase },
    { label: "Penarikan Mahasiswa", href: "/admin/withdrawals", icon: Wallet },
    { label: "Sengketa & Laporan", href: "/admin/disputes", icon: AlertTriangle },
    { label: "Audit Log", href: "/admin/audit", icon: FileText },
    { label: "Impact Dashboard", href: "/admin/impact", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex bg-cream text-primary-brown">
      {/* SIDEBAR (Kiri) */}
      <aside className="w-64 border-r border-beige bg-white flex flex-col justify-between shrink-0 hidden lg:flex">
        <div>
          {/* Brand */}
          <div className="h-16 border-b border-beige px-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-heading text-2xl font-bold tracking-tight text-primary-brown">
                KARTA
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase bg-destructive text-white px-1.5 py-0.5 rounded">
                ADMIN
              </span>
            </Link>
          </div>

          {/* Nav items */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold tracking-wide transition-colors ${
                    isActive
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
              {session.user.name || "Administrator"}
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-beige bg-white/90 backdrop-blur-xs px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 lg:hidden">
            <Link href="/" className="font-heading text-xl font-bold text-primary-brown">
              KARTA
            </Link>
            <span className="text-[10px] font-semibold uppercase bg-destructive text-white px-1.5 py-0.5 rounded">
              ADMIN
            </span>
          </div>

          <div className="hidden sm:block">
            <p className="text-xs text-primary-brown/70 font-sans">
              Panel Pengawasan & Operasional Marketplace Karta
            </p>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell viewAllHref="/admin/notifications" />

            <Link
              href="/"
              target="_blank"
              className="p-2 rounded-md border border-beige hover:bg-cream text-primary-brown transition-colors flex items-center gap-1.5 text-xs font-semibold"
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
      </div>
    </div>
  );
}

