import type { Metadata } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Karta",
    template: "%s | Karta",
  },
  description:
    "Menghubungkan UMKM dengan mahasiswa kampus mitra untuk menyelesaikan tugas mikro berkualitas, membangun reputasi terverifikasi dan dampak nyata.",
  icons: {
    icon: "/logo/Logo-Secondary-preview.webp",
    shortcut: "/logo/Logo-Secondary-preview.webp",
    apple: "/logo/Logo-Secondary-preview.webp",
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
