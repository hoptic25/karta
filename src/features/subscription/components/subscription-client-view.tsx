"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  selectPackageAction,
  cancelPendingSubscriptionAction,
} from "../actions";
import { Button } from "@/components/ui/button";
import { formatRupiah, formatDateTime, formatDateOnly } from "@/lib/format";
import type { Package, Subscription, QuotaLedger } from "@/generated/prisma/client";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  History,
  XCircle,
} from "lucide-react";

interface SubscriptionClientViewProps {
  overview: {
    activePaidSub: (Subscription & { package: Package }) | null;
    activeFreeSub: (Subscription & { package: Package }) | null;
    pendingSub: (Subscription & { package: Package }) | null;
    history: (Subscription & { package: Package })[];
    quotaHistory: (QuotaLedger & {
      subscription: { package: Package };
    })[];
    isCampusPartner: boolean;
    paymentInstructions: string;
  };
  availablePackages: Package[];
}

export function SubscriptionClientView({
  overview,
  availablePackages,
}: SubscriptionClientViewProps) {
  const router = useRouter();
  const [loadingPkgId, setLoadingPkgId] = useState<string | null>(null);
  const [cancellingPending, setCancellingPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    activePaidSub,
    activeFreeSub,
    pendingSub,
    history,
    quotaHistory,
    isCampusPartner,
    paymentInstructions,
  } = overview;

  const handleSelectPackage = async (packageId: string) => {
    setActionError(null);
    setLoadingPkgId(packageId);

    const res = await selectPackageAction({ packageId });
    setLoadingPkgId(null);

    if (!res.ok) {
      setActionError(res.error.message);
      return;
    }

    router.refresh();
  };

  const handleCancelPending = async (subscriptionId: string) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan pesanan langganan ini?")) {
      return;
    }

    setCancellingPending(true);
    setActionError(null);

    const res = await cancelPendingSubscriptionAction(subscriptionId);
    setCancellingPending(false);

    if (!res.ok) {
      setActionError(res.error.message);
      return;
    }

    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Error Banner */}
      {actionError && (
        <div className="p-4 rounded-md border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-start gap-2">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {/* PENDING PAYMENT NOTICE (B-1) */}
      {pendingSub && (
        <div className="border-2 border-primary-brown bg-white p-6 rounded-lg space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-beige pb-3">
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-primary-brown animate-pulse" />
              <h3 className="font-heading text-lg font-semibold text-primary-brown">
                Menunggu Konfirmasi Pembayaran
              </h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cream border border-beige text-primary-brown uppercase">
              {pendingSub.package.name}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-primary-brown/85 font-sans">
            <div>
              <p className="text-primary-brown/60">Total yang harus dibayar:</p>
              <p className="font-heading text-2xl font-bold text-primary-brown mt-0.5">
                {formatRupiah(pendingSub.package.priceIdr)}
              </p>
              <p className="text-[11px] text-primary-brown/60 mt-1">
                Kuota yang akan didapatkan: {pendingSub.package.jobQuota} pekerjaan
              </p>
            </div>

            <div className="p-3.5 rounded-md bg-cream border border-beige space-y-1">
              <p className="font-semibold text-primary-brown flex items-center gap-1">
                <CreditCard className="size-3.5" />
                Instruksi Transfer Manual:
              </p>
              <p className="text-[11px] leading-relaxed text-primary-brown/80">
                {paymentInstructions}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-beige text-xs">
            <span className="text-primary-brown/60">
              Dipesan pada: {formatDateTime(pendingSub.createdAt)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCancelPending(pendingSub.id)}
              disabled={cancellingPending}
              className="text-destructive border-destructive/40 hover:bg-destructive/10"
            >
              <XCircle className="size-3.5 mr-1" />
              {cancellingPending ? "Membatalkan..." : "Batalkan Pesanan"}
            </Button>
          </div>
        </div>
      )}

      {/* STATUS KUOTA & PAKET AKTIF */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Paket Berbayar Aktif */}
        <div className="border border-beige bg-white p-6 rounded-lg space-y-4">
          <div className="flex items-center justify-between border-b border-beige pb-3">
            <h3 className="font-heading text-base font-semibold text-primary-brown">
              Paket Berbayar Aktif
            </h3>
            {activePaidSub ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-sage-green/20 text-primary-brown border border-sage-green/40">
                AKTIF
              </span>
            ) : (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-cream text-primary-brown/60 border border-beige">
                TIDAK ADA
              </span>
            )}
          </div>

          {activePaidSub ? (
            <div className="space-y-3 font-sans">
              <div>
                <h4 className="font-heading text-xl font-bold text-primary-brown">
                  {activePaidSub.package.name}
                </h4>
                <p className="text-xs text-primary-brown/70 mt-0.5">
                  Berlaku hingga: <strong>{formatDateOnly(activePaidSub.endsAt)}</strong>
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Sisa Kuota Pekerjaan:</span>
                  <span>
                    {activePaidSub.quotaTotal - activePaidSub.quotaUsed} / {activePaidSub.quotaTotal}
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-cream overflow-hidden border border-beige">
                  <div
                    className="h-full bg-primary-brown transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (activePaidSub.quotaUsed / activePaidSub.quotaTotal) * 100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-primary-brown/60">
                  {activePaidSub.quotaUsed} kuota telah dipublikasikan.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center space-y-2">
              <p className="text-xs text-primary-brown/70">
                Anda belum memiliki paket langganan berbayar aktif.
              </p>
              <p className="text-[11px] text-primary-brown/60">
                Pilih salah satu paket di bawah untuk mulai mempublikasikan pekerjaan dengan imbalan bagi mahasiswa.
              </p>
            </div>
          )}
        </div>

        {/* Card 2: Paket Gratis Bulanan (BR-S1) */}
        <div className="border border-beige bg-white p-6 rounded-lg space-y-4">
          <div className="flex items-center justify-between border-b border-beige pb-3">
            <h3 className="font-heading text-base font-semibold text-primary-brown">
              Kuota Gratis Bulanan (Volunteer)
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-sage-green/20 text-primary-brown border border-sage-green/40">
              AKTIF
            </span>
          </div>

          <div className="space-y-3 font-sans">
            <div>
              <h4 className="font-heading text-xl font-bold text-primary-brown">
                Volunteer Project
              </h4>
              <p className="text-xs text-primary-brown/70 mt-0.5">
                Hak kuota bulanan gratis reset setiap awal bulan kalender.
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-semibold">
                <span>Sisa Kuota Bulan Ini:</span>
                <span>
                  {activeFreeSub ? activeFreeSub.quotaTotal - activeFreeSub.quotaUsed : 3} / 3
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-cream overflow-hidden border border-beige">
                <div
                  className="h-full bg-sage-green transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (((activeFreeSub?.quotaUsed || 0) / 3) * 100)
                    )}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-primary-brown/60">
                Pekerjaan gratis memberikan poin reputasi penuh bagi mahasiswa.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PILIH PAKET LANGGANAN (B-1) */}
      <div className="border border-beige bg-white p-6 sm:p-8 rounded-lg space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-semibold text-primary-brown">
              Pilihan Paket Langganan
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-cream border border-beige text-primary-brown">
              Segmen: {isCampusPartner ? "Mitra Kampus (Bersubsidi)" : "UMKM Reguler"}
            </span>
          </div>
          <p className="text-xs text-primary-brown/70 font-sans mt-1">
            Pilih paket kuota sesuai kapasitas dan kebutuhan tugas operasional bisnis Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availablePackages.map((pkg) => {
            const isCurrentActive = activePaidSub?.packageId === pkg.id;
            const isPendingThis = pendingSub?.packageId === pkg.id;

            return (
              <div
                key={pkg.id}
                className={`border rounded-lg p-5 flex flex-col justify-between ${
                  pkg.tier === "PREMIUM"
                    ? "border-primary-brown bg-[#c9b9a7]/20"
                    : "border-beige bg-white"
                }`}
              >
                <div>
                  <h3 className="font-heading text-xl font-semibold text-primary-brown">
                    {pkg.name}
                  </h3>
                  <div className="mt-3 mb-4">
                    <span className="font-heading text-2xl font-bold text-primary-brown">
                      {formatRupiah(pkg.priceIdr)}
                    </span>
                    <span className="text-xs text-primary-brown/70 ml-1">/ bulan</span>
                  </div>

                  <ul className="space-y-2 text-xs text-primary-brown/80 border-t border-beige pt-3 font-sans">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-sage-green shrink-0" />
                      <span><strong>{pkg.jobQuota}</strong> Kuota Tugas Mikro</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-sage-green shrink-0" />
                      <span>Alokasi <strong>{formatRupiah(pkg.allocationPerJobIdr)}</strong> / tugas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-sage-green shrink-0" />
                      <span>Imbalan Mahasiswa: <strong>{formatRupiah(Math.floor((pkg.allocationPerJobIdr * 60) / 100))}</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-sage-green shrink-0" />
                      <span>Durasi 30 Hari</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-3">
                  <Button
                    onClick={() => handleSelectPackage(pkg.id)}
                    disabled={loadingPkgId === pkg.id || isCurrentActive || isPendingThis}
                    className="w-full"
                    variant={pkg.tier === "PREMIUM" ? "default" : "outline"}
                  >
                    {loadingPkgId === pkg.id
                      ? "Memproses..."
                      : isCurrentActive
                      ? "Paket Sedang Aktif"
                      : isPendingThis
                      ? "Menunggu Konfirmasi"
                      : "Pilih Paket Ini"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIWAYAT PENGGUNAAN KUOTA & LANGGANAN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Riwayat Kuota */}
        <div className="border border-beige bg-white p-6 rounded-lg space-y-4">
          <h3 className="font-heading text-base font-semibold text-primary-brown flex items-center gap-2">
            <History className="size-4" />
            Riwayat Aktivitas Kuota (Quota Ledger)
          </h3>

          {quotaHistory.length === 0 ? (
            <p className="text-xs text-primary-brown/60 py-4 text-center">
              Belum ada riwayat penggunaan kuota pekerjaan.
            </p>
          ) : (
            <div className="divide-y divide-beige text-xs font-sans max-h-80 overflow-y-auto pr-1">
              {quotaHistory.map((q) => (
                <div key={q.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-primary-brown">{q.reason}</p>
                    <p className="text-[11px] text-primary-brown/60">
                      {formatDateTime(q.createdAt)} · {q.subscription.package.name}
                    </p>
                  </div>
                  <span
                    className={`font-semibold font-mono ${
                      q.delta > 0 ? "text-sage-green" : "text-destructive"
                    }`}
                  >
                    {q.delta > 0 ? `+${q.delta}` : q.delta} kuota
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Riwayat Langganan */}
        <div className="border border-beige bg-white p-6 rounded-lg space-y-4">
          <h3 className="font-heading text-base font-semibold text-primary-brown flex items-center gap-2">
            <CreditCard className="size-4" />
            Riwayat Langganan
          </h3>

          {history.length === 0 ? (
            <p className="text-xs text-primary-brown/60 py-4 text-center">
              Belum ada riwayat pesanan paket.
            </p>
          ) : (
            <div className="divide-y divide-beige text-xs font-sans max-h-80 overflow-y-auto pr-1">
              {history.map((sub) => (
                <div key={sub.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-primary-brown">
                      {sub.package.name}
                    </p>
                    <p className="text-[11px] text-primary-brown/60">
                      {formatDateTime(sub.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                      sub.status === "ACTIVE"
                        ? "bg-sage-green/20 text-primary-brown border border-sage-green/40"
                        : sub.status === "PENDING_PAYMENT"
                        ? "bg-cream text-primary-brown border border-beige"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {sub.status === "PENDING_PAYMENT"
                      ? "Menunggu Bayar"
                      : sub.status === "ACTIVE"
                      ? "Aktif"
                      : sub.status === "CANCELLED"
                      ? "Batal"
                      : "Kedaluwarsa"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

