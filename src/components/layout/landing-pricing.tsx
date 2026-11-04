"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Sparkles,
  Globe,
  Building2,
  Users2,
  ArrowRight,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import type { Package } from "@/generated/prisma/client";

interface LandingPricingProps {
  packages: Package[];
}

export function LandingPricing({ packages }: LandingPricingProps) {
  const [selectedSegment, setSelectedSegment] = useState<"PARTNER" | "NON_PARTNER">("PARTNER");
  const [showFullTable, setShowFullTable] = useState(false);

  const freePackage = packages.find((p) => p.segment === "FREE");
  const filteredPackages = packages.filter((p) => p.segment === selectedSegment);

  return (
    <section id="paket" className="border-b border-beige py-24 bg-white/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream border border-beige text-xs font-semibold text-primary-brown mb-4">
            <Sparkles className="size-3.5 text-earth-primary" />
            <span>Pricelist Resmi KARTA</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-primary-brown">
            Paket Langganan Transparan untuk Segala Skala Usaha
          </h2>
          <p className="mt-4 text-sm sm:text-base text-primary-brown/80 font-sans leading-relaxed">
            Dapatkan hasil kerja tugas mikro terverifikasi dari talenta kampus mitra. Sistem alokasi transparan: 
            <strong> 60% langsung untuk mahasiswa pelaksana</strong> dan <strong>40% untuk operasional platform</strong>.
          </p>

          {/* Segment Toggle Switcher */}
          <div className="mt-8 flex justify-center">
            <div className="inline-flex p-1.5 rounded-xl bg-cream border border-beige">
              <button
                type="button"
                onClick={() => setSelectedSegment("PARTNER")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedSegment === "PARTNER"
                    ? "bg-primary-brown text-white shadow-xs"
                    : "text-primary-brown/70 hover:text-primary-brown"
                }`}
              >
                <Building2 className="size-4" />
                <span>Mitra Binaan Kampus (Subsidi)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSegment("NON_PARTNER")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedSegment === "NON_PARTNER"
                    ? "bg-primary-brown text-white shadow-xs"
                    : "text-primary-brown/70 hover:text-primary-brown"
                }`}
              >
                <Users2 className="size-4" />
                <span>UMKM Umum / Reguler</span>
              </button>
            </div>
          </div>

          <p className="mt-3 text-xs text-primary-brown/60 flex items-center justify-center gap-1.5">
            {selectedSegment === "PARTNER" ? (
              <>
                <Sparkles className="size-3.5 text-earth-primary shrink-0" />
                <span>Harga subsidi khusus UMKM yang terafiliasi atau dibina oleh perguruan tinggi mitra KARTA.</span>
              </>
            ) : (
              <>
                <Globe className="size-3.5 text-earth-primary shrink-0" />
                <span>Akses terbuka untuk seluruh pemilik usaha &amp; UMKM di Indonesia tanpa syarat kemitraan.</span>
              </>
            )}
          </p>
        </div>

        {/* Free Tier Notice */}
        {freePackage && (
          <div className="mb-10 p-6 rounded-xl border border-earth-sage/30 bg-earth-sage/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase bg-earth-sage text-white px-2 py-0.5 rounded">
                  Gratis Bulanan
                </span>
                <h3 className="font-heading text-lg font-bold text-primary-brown">
                  {freePackage.name} (Volunteer Project)
                </h3>
              </div>
              <p className="text-xs text-primary-brown/80 font-sans leading-relaxed">
                Setiap UMKM berhak atas <strong>3 kuota pekerjaan sukarela gratis</strong> setiap bulan (Rp 0). 
                Mahasiswa pelaksana tetap mendapatkan poin reputasi penuh (+10 poin) dan portofolio terverifikasi.
              </p>
            </div>
            <Link href="/login?as=umkm" className="shrink-0">
              <Button variant="outline" size="sm" className="border-earth-sage text-earth-sage hover:bg-earth-sage hover:text-white">
                Coba Paket Gratis
              </Button>
            </Link>
          </div>
        )}

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredPackages.map((pkg) => {
            const isPopular = pkg.tier === "PROFESSIONAL";
            const studentReward = Math.floor((pkg.allocationPerJobIdr * 60) / 100);
            const platformFee = pkg.allocationPerJobIdr - studentReward;

            return (
              <div
                key={pkg.id}
                className={`relative rounded-2xl p-7 flex flex-col justify-between transition-all duration-200 border ${
                  isPopular
                    ? "border-primary-brown bg-white shadow-md ring-1 ring-primary-brown"
                    : "border-beige bg-white hover:border-primary-brown/40 shadow-xs"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-brown text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                    Paling Diminati
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-2xl font-bold text-primary-brown">
                      {pkg.name}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary-brown/60 bg-cream px-2 py-1 rounded">
                      {pkg.tier}
                    </span>
                  </div>

                  <p className="text-xs text-primary-brown/70 font-sans mt-2">
                    {pkg.tier === "BASIC" && "Cocok untuk UMKM yang baru mulai mendelegasikan tugas mikro."}
                    {pkg.tier === "PROFESSIONAL" && "Pilihan ideal untuk akselerasi operasional harian bisnis secara konsisten."}
                    {pkg.tier === "PREMIUM" && "Kapasitas terbesar untuk UMKM dengan kebutuhan tugas mikro multi-disiplin."}
                  </p>

                  <div className="mt-6 mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="font-heading text-3xl font-extrabold text-primary-brown">
                        {formatCurrency(pkg.priceIdr)}
                      </span>
                      <span className="text-xs text-primary-brown/70">/ bulan</span>
                    </div>
                    <p className="text-[11px] text-earth-primary font-medium mt-1">
                      Efektif {formatCurrency(Math.round(pkg.priceIdr / pkg.jobQuota))} per tugas mikro
                    </p>
                  </div>

                  <ul className="space-y-3.5 text-xs text-primary-brown/85 border-t border-beige pt-5 font-sans">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-4 text-earth-sage shrink-0" />
                      <span><strong>{pkg.jobQuota} kuota posting</strong> pekerjaan mikro</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-4 text-earth-sage shrink-0" />
                      <span>Alokasi <strong>{formatCurrency(pkg.allocationPerJobIdr)}</strong> / pekerjaan</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-4 text-earth-sage shrink-0" />
                      <span>Imbalan Mahasiswa: <strong>{formatCurrency(studentReward)}</strong> (60%)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-4 text-earth-sage shrink-0" />
                      <span>Biaya Platform: <strong>{formatCurrency(platformFee)}</strong> (40%)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-4 text-earth-sage shrink-0" />
                      <span>Garansi SLA Review 3 hari (auto-accept)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-4 text-earth-sage shrink-0" />
                      <span>Masa aktif kuota 30 hari</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <Link href="/login?as=umkm" className="block">
                    <Button
                      variant={isPopular ? "default" : "outline"}
                      className="w-full text-xs font-semibold py-2.5"
                    >
                      Pilih {pkg.name}
                      <ArrowRight className="size-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* View Full Pricing / Perbandingan Button */}
        <div className="mt-12 text-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFullTable((prev) => !prev)}
            className="border-beige bg-white hover:bg-cream text-primary-brown text-xs font-semibold inline-flex items-center gap-2 px-6 py-2.5"
          >
            <TableIcon className="size-4 text-earth-primary" />
            <span>
              {showFullTable ? "Sembunyikan Tabel Pricelist Lengkap" : "Bandingkan Seluruh 7 Paket (Full Pricelist)"}
            </span>
            {showFullTable ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </div>

        {/* Comprehensive Full Pricing Table */}
        {showFullTable && (
          <div className="mt-8 border border-beige bg-white rounded-2xl p-6 shadow-sm overflow-hidden space-y-4 animate-in fade-in-50 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-beige pb-4">
              <div>
                <h3 className="font-heading text-lg font-bold text-primary-brown flex items-center gap-2">
                  <TableIcon className="size-5 text-earth-primary" />
                  Matriks Perbandingan Lengkap Seluruh Paket KARTA
                </h3>
                <p className="text-xs text-primary-brown/70 font-sans mt-0.5">
                  Daftar lengkap harga, kuota, pembagian hasil, dan hak akses operasional (PRD §15.1).
                </p>
              </div>
              <div className="text-[11px] text-primary-brown/60 flex items-center gap-1 bg-cream px-3 py-1.5 rounded-lg border border-beige">
                <Info className="size-3.5" />
                <span>Masa aktif seluruh paket berbayar: 30 hari</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-primary-brown border-collapse">
                <thead>
                  <tr className="bg-cream/60 border-b border-beige text-[11px] font-bold uppercase tracking-wider text-primary-brown/80">
                    <th className="py-3 px-4">Paket</th>
                    <th className="py-3 px-3">Segmen</th>
                    <th className="py-3 px-3">Tier</th>
                    <th className="py-3 px-4">Harga / Bulan</th>
                    <th className="py-3 px-3 text-center">Kuota Job</th>
                    <th className="py-3 px-4">Alokasi / Job</th>
                    <th className="py-3 px-4">Imbalan Mhs (60%)</th>
                    <th className="py-3 px-4">Fee Platform (40%)</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige/70 font-sans">
                  {packages.map((pkg) => {
                    const studentReward = Math.floor((pkg.allocationPerJobIdr * 60) / 100);
                    const platformFee = pkg.allocationPerJobIdr - studentReward;
                    const isFree = pkg.segment === "FREE";

                    return (
                      <tr
                        key={pkg.id}
                        className={`hover:bg-cream/40 transition-colors ${
                          pkg.tier === "PREMIUM" ? "bg-amber-50/20" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4 font-semibold text-primary-brown">
                          {pkg.name}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              pkg.segment === "PARTNER"
                                ? "bg-emerald-100 text-emerald-800"
                                : pkg.segment === "NON_PARTNER"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-neutral-100 text-neutral-800"
                            }`}
                          >
                            {pkg.segment === "PARTNER" ? "Mitra Kampus" : pkg.segment === "NON_PARTNER" ? "Umum" : "Gratis"}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-medium">
                          {pkg.tier}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-primary-brown">
                          {isFree ? "Gratis (Rp 0)" : formatCurrency(pkg.priceIdr)}
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold">
                          {pkg.jobQuota}
                        </td>
                        <td className="py-3.5 px-4">
                          {isFree ? "Rp 0 (Poin)" : formatCurrency(pkg.allocationPerJobIdr)}
                        </td>
                        <td className="py-3.5 px-4 text-earth-primary font-semibold">
                          {isFree ? "0 (+10 Poin)" : formatCurrency(studentReward)}
                        </td>
                        <td className="py-3.5 px-4 text-primary-brown/70">
                          {isFree ? "Rp 0" : formatCurrency(platformFee)}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <Link href="/login?as=umkm">
                            <Button size="sm" variant="outline" className="text-[11px] h-7 px-3">
                              Pilih
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-primary-brown/65 gap-2 border-t border-beige/60">
              <p>
                *Sesuai ketentuan PRD §15.1, harga UMKM Non-Mitra dihitung dengan subsidi kemitraan 20%.
              </p>
              <Link href="/login?as=umkm" className="font-semibold text-earth-primary hover:underline">
                Daftar Sebagai UMKM & Mulai Pasang Job &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

