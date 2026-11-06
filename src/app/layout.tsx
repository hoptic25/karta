import type { Metadata } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Karta — Marketplace Tugas Mikro Kampus & UMKM",
    template: "%s | Karta",
  },
  description:
    "Menghubungkan UMKM dengan mahasiswa kampus mitra untuk menyelesaikan tugas mikro berkualitas, membangun reputasi terverifikasi dan dampak nyata.",
  icons: {
    icon: "/logo/karta.png",
    shortcut: "/logo/karta.png",
    apple: "/logo/karta.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${playfair.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-cream text-foreground selection:bg-peach selection:text-primary">
        {children}
      </body>
    </html>
  );
}
