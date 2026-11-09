"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { reportFailureAction } from "../actions";

interface UmkmFailureModalProps {
  jobId: string;
  jobTitle: string;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UmkmFailureModal({
  jobId,
  jobTitle,
  studentName,
  open,
  onOpenChange,
}: UmkmFailureModalProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (reason.trim().length < 30) {
      setError("Alasan pelaporan kendala wajib diisi minimal 30 karakter.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await reportFailureAction({
        jobId,
        reason: reason.trim(),
      });

      if (!res.ok) {
        setError(res.error.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        router.refresh();
      }, 1500);
    } catch {
      setError("Terjadi kesalahan saat melaporkan kendala.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold text-destructive flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Laporkan Kendala Pengerjaan
            </DialogTitle>
            <DialogDescription className="text-xs text-primary-brown/70">
              Gunakan formulir ini jika mahasiswa ({studentName}) tidak dapat dihubungi atau melewati batas tenggat tugas &quot;{jobTitle}&quot;.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <div className="font-bold text-base text-primary-brown">
                Laporan Berhasil Dikirimkan!
              </div>
              <p className="text-xs text-primary-brown/70">
                Laporan Anda telah tercatat dan tim admin KARTA akan meninjau kendala pengerjaan tugas ini.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-primary-brown">
                  Kronologi Kendala (Min. 30 Karakter)
                </label>
                <Textarea
                  rows={4}
                  placeholder="Ceritakan kendala komunikasi, tenggat yang terlewati, atau tidak adanya respon dari mahasiswa..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="text-xs"
                  required
                />
                <span className="text-[11px] text-primary-brown/60">
                  {reason.trim().length} / 30 karakter minimum
                </span>
              </div>
            </div>
          )}

          {!success && (
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || reason.trim().length < 30}
                className="bg-destructive hover:bg-destructive/90 text-white text-xs font-semibold"
              >
                {isSubmitting ? "Mengirim Laporan..." : "Kirim Laporan Kendala"}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

