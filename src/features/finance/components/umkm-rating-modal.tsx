"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, AlertCircle, CheckCircle2 } from "lucide-react";
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
import { submitUmkmRatingAction } from "../actions";

interface UmkmRatingModalProps {
  jobId: string;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UmkmRatingModal({
  jobId,
  studentName,
  open,
  onOpenChange,
  onSuccess,
}: UmkmRatingModalProps) {
  const router = useRouter();
  const [score, setScore] = useState<number>(5);
  const [hoverScore, setHoverScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await submitUmkmRatingAction({
        jobId,
        score,
        comment: comment.trim() || undefined,
      });

      if (!res.ok) {
        setError(res.error.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        if (onSuccess) onSuccess();
        router.refresh();
      }, 1200);
    } catch {
      setError("Terjadi kesalahan saat menyimpan ulasan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold text-primary-brown">
              Beri Ulasan Mahasiswa
            </DialogTitle>
            <DialogDescription className="text-xs text-primary-brown/70">
              Bagikan penilaian Anda atas hasil kerja dan profesionalisme {studentName}.
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
                Ulasan Berhasil Disimpan!
              </div>
              <p className="text-xs text-primary-brown/70">
                Terima kasih atas apresiasi dan masukan yang Anda berikan.
              </p>
            </div>
          ) : (
            <div className="space-y-5 py-4">
              {/* Star Rating Selector */}
              <div className="text-center space-y-2">
                <div className="text-xs font-semibold text-primary-brown/70 uppercase tracking-wider">
                  Rating Kualitas Kerja
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverScore ?? score) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setScore(star)}
                        onMouseEnter={() => setHoverScore(star)}
                        onMouseLeave={() => setHoverScore(null)}
                        className="p-1 text-2xl transition-transform hover:scale-110 focus:outline-hidden"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            active
                              ? "fill-amber-400 text-amber-500"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs font-bold text-earth-primary">
                  {score === 5 && "Sangat Memuaskan (5 / 5)"}
                  {score === 4 && "Memuaskan (4 / 5)"}
                  {score === 3 && "Cukup Baik (3 / 5)"}
                  {score === 2 && "Perlu Ditingkatkan (2 / 5)"}
                  {score === 1 && "Kurang Memuaskan (1 / 5)"}
                </div>
                {score >= 4 && (
                  <p className="text-[11px] text-emerald-700 bg-emerald-50 py-1 px-3 rounded-full inline-block">
                    ★ Memberikan rating ≥ 4 akan memberi bonus +2 reputasi untuk mahasiswa!
                  </p>
                )}
              </div>

              {/* Comment text */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-primary-brown">
                  Komentar & Testimoni (Opsional)
                </label>
                <Textarea
                  placeholder="Ceritakan kepuasan Anda terhadap deliverables dan komunikasi mahasiswa..."
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="text-xs"
                />
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
                disabled={isSubmitting}
                className="bg-earth-primary hover:bg-earth-primary/90 text-white text-xs font-semibold"
              >
                {isSubmitting ? "Menyimpan..." : "Kirim Ulasan"}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

