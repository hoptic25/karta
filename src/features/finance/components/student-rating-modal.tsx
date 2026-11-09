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
import { submitStudentRatingAction } from "../actions";
import type { StudentRatingDimensions } from "../ratings";

interface StudentRatingModalProps {
  jobId: string;
  umkmName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const DIMENSION_CONFIG = [
  {
    key: "clarity" as const,
    label: "Kejelasan Brief & Tugas",
    desc: "Instruksi dan kriteria tugas jelas dan mudah dipahami",
  },
  {
    key: "communication" as const,
    label: "Kemudahan Komunikasi",
    desc: "Respon cepat dan ramah dalam menjawab pertanyaan",
  },
  {
    key: "professionalism" as const,
    label: "Profesionalisme",
    desc: "Menghargai proses kerja dan bersikap kooperatif",
  },
  {
    key: "reviewSpeed" as const,
    label: "Kecepatan Review",
    desc: "Tepat waktu dalam meninjau hasil deliverable pekerjaan",
  },
];

export function StudentRatingModal({
  jobId,
  umkmName,
  open,
  onOpenChange,
  onSuccess,
}: StudentRatingModalProps) {
  const router = useRouter();
  const [dimensions, setDimensions] = useState<StudentRatingDimensions>({
    clarity: 5,
    communication: 5,
    professionalism: 5,
    reviewSpeed: 5,
  });
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const setDimScore = (key: keyof StudentRatingDimensions, val: number) => {
    setDimensions((prev) => ({ ...prev, [key]: val }));
  };

  const avgScore = (
    (dimensions.clarity +
      dimensions.communication +
      dimensions.professionalism +
      dimensions.reviewSpeed) /
    4
  ).toFixed(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await submitStudentRatingAction({
        jobId,
        dimensions,
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
      <DialogContent className="max-w-md bg-white max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold text-primary-brown">
              Ulas Pengalaman dengan UMKM
            </DialogTitle>
            <DialogDescription className="text-xs text-primary-brown/70">
              Bagikan penilaian Anda bekerja sama dengan {umkmName} untuk membantu sesama mahasiswa.
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
                Terima kasih telah berbagi pengalaman Anda bersama mitra UMKM.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Dimensions list */}
              {DIMENSION_CONFIG.map((dim) => {
                const currentVal = dimensions[dim.key];
                return (
                  <div
                    key={dim.key}
                    className="p-3 bg-cream/50 rounded-xl border border-beige/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-primary-brown">
                        {dim.label}
                      </div>
                      <div className="text-xs font-semibold text-earth-primary">
                        {currentVal} / 5
                      </div>
                    </div>
                    <p className="text-[11px] text-primary-brown/60">
                      {dim.desc}
                    </p>
                    <div className="flex items-center gap-1 pt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setDimScore(dim.key, s)}
                          className="p-1 text-base focus:outline-hidden hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              currentVal >= s
                                ? "fill-amber-400 text-amber-500"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Total avg badge */}
              <div className="text-center p-2 rounded-lg bg-earth-sand/20 text-xs font-semibold text-primary-brown">
                Nilai Rata-rata Penilaian: <span className="text-earth-primary font-bold">{avgScore} / 5.0</span>
              </div>

              {/* Comment text */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-primary-brown">
                  Masukan & Saran untuk UMKM (Opsional)
                </label>
                <Textarea
                  placeholder="Ceritakan pengalaman Anda, komunikasi, dan kejelasan tugas yang diberikan..."
                  rows={3}
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
                {isSubmitting ? "Menyimpan..." : "Kirim Penilaian"}
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

