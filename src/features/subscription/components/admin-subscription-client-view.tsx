"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  markSubscriptionPaidAction,
  adminCancelSubscriptionAction,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRupiah, formatDateTime, formatDateOnly } from "@/lib/format";
import type { Subscription, Package, UmkmProfile } from "@/generated/prisma/client";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
} from "lucide-react";

interface AdminSubscriptionClientViewProps {
  pendingQueue: (Subscription & {
    package: Package;
    umkm: UmkmProfile;
  })[];
  recentHistory: (Subscription & {
    package: Package;
    umkm: UmkmProfile;
  })[];
}

export function AdminSubscriptionClientView({
  pendingQueue,
  recentHistory,
}: AdminSubscriptionClientViewProps) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [paymentNoteMap, setPaymentNoteMap] = useState<Record<string, string>>({});

  const handleMarkPaid = async (subscriptionId: string) => {
    setActionError(null);
    setProcessingId(subscriptionId);

    const paymentNote = paymentNoteMap[subscriptionId] || "Transfer terverifikasi admin.";
    const res = await markSubscriptionPaidAction({
      subscriptionId,
      paymentNote,
    });

    setProcessingId(null);
    if (!res.ok) {
      setActionError(res.error.message);
      return;
    }

    router.refresh();
  };

  const handleCancel = async (subscriptionId: string) => {
    const reason = prompt("Masukkan alasan pembatalan pesanan langganan:");
    if (!reason || reason.trim().length < 5) {
      alert("Alasan pembatalan minimal 5 karakter.");
      return;
    }

    setActionError(null);
    setProcessingId(subscriptionId);

    const res = await adminCancelSubscriptionAction({
      subscriptionId,
      reason,
    });

    setProcessingId(null);
    if (!res.ok) {
      setActionError(res.error.message);
      return;
    }

    router.refresh();
  };

  return (
    <div className="space-y-8">
      {actionError && (
        <div className="p-4 rounded-md border border-destructive/40 bg-destructive/10 text-destructive text-xs flex items-start gap-2">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {/* ANTREAN PENDING PAYMENT (B-2) */}
      <div className="border border-beige bg-white p-6 rounded-lg space-y-4">
        <div className="flex items-center justify-between border-b border-beige pb-3">
          <h2 className="font-heading text-lg font-semibold text-primary-brown flex items-center gap-2">
            <Clock className="size-5 text-primary-brown" />
            Antrean Menunggu Konfirmasi Pembayaran ({pendingQueue.length})
          </h2>
          <span className="text-xs text-primary-brown/60 font-sans">
            Konfirmasi aktivasi kuota UMKM
          </span>
        </div>

        {pendingQueue.length === 0 ? (
          <div className="py-8 text-center text-xs text-primary-brown/60 font-sans">
            Tidak ada antrean pembayaran yang menunggu saat ini.
          </div>
        ) : (
          <div className="divide-y divide-beige font-sans">
            {pendingQueue.map((item) => (
              <div
                key={item.id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-base font-bold text-primary-brown">
                      {item.umkm.businessName}
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-cream border border-beige text-primary-brown">
                      {item.package.name}
                    </span>
                  </div>
                  <p className="text-xs text-primary-brown/70 flex items-center gap-2">
                    <span>Nominal: <strong>{formatRupiah(item.package.priceIdr)}</strong></span>
                    <span>·</span>
                    <span>Kuota: <strong>{item.package.jobQuota} pekerjaan</strong></span>
                    <span>·</span>
                    <span>Dipesan: {formatDateTime(item.createdAt)}</span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Input
                    placeholder="Catatan verifikasi (opsional)"
                    value={paymentNoteMap[item.id] || ""}
                    onChange={(e) =>
                      setPaymentNoteMap({
                        ...paymentNoteMap,
                        [item.id]: e.target.value,
                      })
                    }
                    className="text-xs h-8 sm:w-56"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleMarkPaid(item.id)}
                      disabled={processingId === item.id}
                    >
                      <CheckCircle2 className="size-3.5 mr-1" />
                      {processingId === item.id ? "Memproses..." : "Tandai Sudah Bayar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancel(item.id)}
                      disabled={processingId === item.id}
                      className="text-destructive border-destructive/40 hover:bg-destructive/10"
                    >
                      <XCircle className="size-3.5 mr-1" />
                      Batalkan
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIWAYAT LANGGANAN DIPROSES */}
      <div className="border border-beige bg-white p-6 rounded-lg space-y-4">
        <h2 className="font-heading text-lg font-semibold text-primary-brown flex items-center gap-2 border-b border-beige pb-3">
          <Calendar className="size-5 text-primary-brown" />
          Riwayat Langganan Diproses
        </h2>

        {recentHistory.length === 0 ? (
          <div className="py-8 text-center text-xs text-primary-brown/60 font-sans">
            Belum ada riwayat langganan yang tercatat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="border-b border-beige text-primary-brown/70 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">UMKM</th>
                  <th className="py-2.5 px-3">Paket</th>
                  <th className="py-2.5 px-3">Harga</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Masa Berlaku</th>
                  <th className="py-2.5 px-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige text-primary-brown/85">
                {recentHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-cream/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold">
                      {item.umkm.businessName}
                    </td>
                    <td className="py-2.5 px-3">
                      {item.package.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {formatRupiah(item.package.priceIdr)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                          item.status === "ACTIVE"
                            ? "bg-sage-green/20 text-primary-brown border border-sage-green/40"
                            : item.status === "CANCELLED"
                            ? "bg-destructive/10 text-destructive border border-destructive/30"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {item.startsAt && item.endsAt
                        ? `${formatDateOnly(item.startsAt)} - ${formatDateOnly(item.endsAt)}`
                        : "-"}
                    </td>
                    <td className="py-2.5 px-3 text-primary-brown/60 max-w-xs truncate">
                      {item.paymentNote || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

