"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Scale, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { openDisputeAction } from "../actions";

interface StudentDisputeModalProps {
  jobId: string;
  jobTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentDisputeModal({
  jobId,
  jobTitle,
  open,
  onOpenChange,
}: StudentDisputeModalProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (reason.trim().length < 30) {
      setError("Alasan sanggahan wajib diisi minimal 30 karakter.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await openDisputeAction({
        jobId,
        reason: reason.trim(),
        evidenceUrl: evidenceUrl.trim() || undefined,
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
      setError("Terjadi kesalahan saat mengajukan sanggahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold text-primary-brown flex items-center gap-2">
              <Scale className="w-5 h-5 text-earth-primary" />
              Ajukan Sanggahan Sengketa
            </DialogTitle>
            <DialogDescription className="text-xs text-primary-brown/70">
              Jika Anda merasa hasil kerja tugas &quot;{jobTitle}&quot; telah memenuhi kriteria brief namun ditolak secara tidak wajar, tim admin KARTA akan meninjau bukti kerja Anda.
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
                Sanggahan Berhasil Diajukan!
              </div>
              <p className="text-xs text-primary-brown/70">
                Status tugas kini beralih ke DISPUTED. Tim admin KARTA akan segera meninjau kriteria dan bukti karya Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-primary-brown">
                  Alasan Sanggahan Objektif (Min. 30 Karakter)
                </label>
                <Textarea
                  rows={4}
                  placeholder="Jelaskan bagian kriteria mana yang telah Anda penuhi dan sanggahan terhadap penolakan UMKM..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="text-xs"
                  required
                />
                <span className="text-[11px] text-primary-brown/60">
                  {reason.trim().length} / 30 karakter minimum
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-primary-brown">
                  Tautan Bukti Pekerjaan / Revisi (Opsional)
                </label>
                <Input
                  type="url"
                  placeholder="https://drive.google.com/... atau https://figma.com/..."
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  className="text-xs"
                />
                <p className="text-[11px] text-primary-brown/60">
                  Tautan Google Drive, Figma, GitHub, YouTube, Loom, Canva, atau Notion.
                </p>
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
                className="bg-earth-primary hover:bg-earth-primary/90 text-white text-xs font-semibold"
              >
                {isSubmitting ? "Mengajukan..." : "Kirim Sanggahan"}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

