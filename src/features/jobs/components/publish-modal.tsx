"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { publishJobAction } from "../actions";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import type { Subscription, Package } from "@/generated/prisma/client";
import { CheckCircle2, AlertCircle, Sparkles, Send, X, Layers } from "lucide-react";

interface PublishModalProps {
  jobId: string;
  jobTitle: string;
  isOpen: boolean;
  onClose: () => void;
  availableSubscriptions: (Subscription & { package: Package })[];
}

export function PublishModal({
  jobId,
  jobTitle,
  isOpen,
  onClose,
  availableSubscriptions,
}: PublishModalProps) {
  const router = useRouter();
  const [selectedSubId, setSelectedSubId] = useState<string>(
    availableSubscriptions[0]?.id || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedSub = availableSubscriptions.find((s) => s.id === selectedSubId);
  const pkg = selectedSub?.package;
  const quotaRemaining = selectedSub ? selectedSub.quotaTotal - selectedSub.quotaUsed : 0;

  const handlePublish = async () => {
    if (!selectedSubId) {
      setErrorMessage("Silakan pilih sumber kuota paket langganan.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await publishJobAction({
      jobId,
      subscriptionId: selectedSubId,
    });

    setIsSubmitting(false);

    if (!res.ok) {
      setErrorMessage(res.error.message);
      return;
    }

    onClose();
    router.push(`/umkm/jobs/${jobId}`);
    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-beige bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-beige pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-earth-primary/10 text-earth-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-primary-brown">
                Publikasikan Pekerjaan
              </h2>
              <p className="text-xs text-primary-brown/70 font-sans">
                Pilih sumber kuota untuk menerbitkan tugas ke mahasiswa.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-primary-brown/60 hover:bg-cream hover:text-primary-brown transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="my-5 space-y-4">
          <div className="rounded-xl bg-cream/70 p-3.5 border border-beige/60">
            <div className="text-xs font-semibold text-primary-brown/60 uppercase tracking-wider">
              Judul Tugas
            </div>
            <div className="font-heading font-bold text-primary-brown text-base mt-0.5 line-clamp-2">
              {jobTitle}
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {availableSubscriptions.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-2">
              <div className="font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                Kuota Tidak Tersedia
              </div>
              <p className="text-xs leading-relaxed text-amber-800">
                Anda tidak memiliki paket langganan aktif dengan kuota yang tersisa. Silakan aktifkan paket di halaman Langganan terlebih dahulu.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-primary-brown/80">
                Pilih Sumber Kuota (BR-S7)
              </label>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {availableSubscriptions.map((sub) => {
                  const remaining = sub.quotaTotal - sub.quotaUsed;
                  const isSelected = selectedSubId === sub.id;

                  return (
                    <label
                      key={sub.id}
                      onClick={() => setSelectedSubId(sub.id)}
                      className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                        isSelected
                          ? "border-earth-primary bg-earth-cream/40 ring-1 ring-earth-primary"
                          : "border-beige/70 bg-white hover:bg-cream/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="subscriptionSelection"
                        checked={isSelected}
                        onChange={() => setSelectedSubId(sub.id)}
                        className="mt-1 text-earth-primary focus:ring-earth-primary"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-bold text-sm text-primary-brown flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-earth-primary" />
                            {sub.package.name}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-earth-sage/30 text-earth-coffee">
                            Sisa: {remaining} tugas
                          </span>
                        </div>
                        <div className="text-xs text-primary-brown/70 mt-1">
                          {sub.package.isPaidJobs ? (
                            <span>
                              Kompensasi Mahasiswa:{" "}
                              <strong className="text-earth-primary">
                                {formatRupiah(Math.floor((sub.package.allocationPerJobIdr * 60) / 100))}
                              </strong>{" "}
                              (Tier {sub.package.tier})
                            </span>
                          ) : (
                            <span className="text-amber-800 font-medium">
                              Proyek Relawan (Unpaid / Volunteer) — Mahasiswa mendapat poin penuh (+10)
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {pkg && (
            <div className="rounded-xl border border-earth-sand/30 bg-earth-cream/20 p-3.5 text-xs text-earth-coffee space-y-1.5">
              <div className="font-semibold text-earth-coffee flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-earth-sage" />
                Snapshot saat dipublikasikan (BR-J2):
              </div>
              <div className="flex justify-between text-xs">
                <span>Alokasi UMKM:</span>
                <span className="font-semibold">{formatRupiah(pkg.allocationPerJobIdr)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Imbalan Mahasiswa (60%):</span>
                <span className="font-semibold text-earth-primary">
                  {pkg.isPaidJobs
                    ? formatRupiah(Math.floor((pkg.allocationPerJobIdr * 60) / 100))
                    : "Rp 0 (Poin Pengalaman)"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Fee Layanan Platform (40%):</span>
                <span className="font-semibold">
                  {pkg.isPaidJobs
                    ? formatRupiah(
                        pkg.allocationPerJobIdr -
                          Math.floor((pkg.allocationPerJobIdr * 60) / 100)
                      )
                    : "Rp 0"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-beige pt-4">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={isSubmitting || availableSubscriptions.length === 0 || quotaRemaining <= 0}
            className="gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            {isSubmitting ? "Mempublikasikan..." : "Konfirmasi & Publikasi"}
          </Button>
        </div>
      </div>
    </div>
  );
}

