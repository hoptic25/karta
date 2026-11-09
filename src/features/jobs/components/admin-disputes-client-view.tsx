"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Building2,
  GraduationCap,
  Scale,
  ShieldAlert,
} from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resolveDisputeAction, resolveFailureAction } from "../actions";
import type { getAdminDisputes } from "../disputes";
import type { getAdminFailureReports } from "../failures";
import type { DisputeResolution } from "@/generated/prisma/client";

interface AdminDisputesClientViewProps {
  disputes: Awaited<ReturnType<typeof getAdminDisputes>>;
  failureReports: Awaited<ReturnType<typeof getAdminFailureReports>>;
}

export function AdminDisputesClientView({
  disputes,
  failureReports,
}: AdminDisputesClientViewProps) {
  const router = useRouter();

  // Dispute Decision Modal State
  const [selectedDispute, setSelectedDispute] = useState<
    AdminDisputesClientViewProps["disputes"][number] | null
  >(null);
  const [disputeDecision, setDisputeDecision] = useState<DisputeResolution>("ACCEPT_WORK");
  const [disputeAdminNote, setDisputeAdminNote] = useState("");
  const [isResolvingDispute, setIsResolvingDispute] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);

  // Failure Decision Modal State
  const [selectedFailure, setSelectedFailure] = useState<
    AdminDisputesClientViewProps["failureReports"][number] | null
  >(null);
  const [failureDecision, setFailureDecision] = useState<"CONFIRMED" | "DISMISSED">("CONFIRMED");
  const [failureAdminNote, setFailureAdminNote] = useState("");
  const [isResolvingFailure, setIsResolvingFailure] = useState(false);
  const [failureError, setFailureError] = useState<string | null>(null);

  const openDisputes = disputes.filter((d) => d.status === "OPEN");
  const openFailures = failureReports.filter((f) => f.status === "OPEN");

  const handleResolveDispute = async () => {
    if (!selectedDispute) return;
    setDisputeError(null);
    setIsResolvingDispute(true);

    try {
      const res = await resolveDisputeAction({
        disputeId: selectedDispute.id,
        decision: disputeDecision,
        adminNote: disputeAdminNote.trim() || undefined,
      });

      if (!res.ok) {
        setDisputeError(res.error.message);
        return;
      }

      setSelectedDispute(null);
      router.refresh();
    } catch {
      setDisputeError("Terjadi kesalahan saat memproses sengketa.");
    } finally {
      setIsResolvingDispute(false);
    }
  };

  const handleResolveFailure = async () => {
    if (!selectedFailure) return;
    setFailureError(null);

    if (failureDecision === "DISMISSED" && !failureAdminNote.trim()) {
      setFailureError("Catatan admin wajib disertakan bila menolak laporan kegagalan.");
      return;
    }

    setIsResolvingFailure(true);

    try {
      const res = await resolveFailureAction({
        failureReportId: selectedFailure.id,
        decision: failureDecision,
        adminNote: failureAdminNote.trim() || undefined,
      });

      if (!res.ok) {
        setFailureError(res.error.message);
        return;
      }

      setSelectedFailure(null);
      router.refresh();
    } catch {
      setFailureError("Terjadi kesalahan saat memproses laporan kendala.");
    } finally {
      setIsResolvingFailure(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-beige bg-white shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Sengketa Menunggu (Disputes)
            </span>
            <CardTitle className="text-2xl font-bold text-primary-brown mt-1">
              {openDisputes.length} Kasus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-primary-brown/60">
              Sanggahan mahasiswa atas penolakan hasil kerja UMKM.
            </p>
          </CardContent>
        </Card>

        <Card className="border-beige bg-white shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-destructive">
              Laporan Kendala (Failures)
            </span>
            <CardTitle className="text-2xl font-bold text-primary-brown mt-1">
              {openFailures.length} Laporan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-primary-brown/60">
              Pelaporan mahasiswa hilang / melewati deadline dari UMKM.
            </p>
          </CardContent>
        </Card>

        <Card className="border-beige bg-white shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Total Kasus Terselesaikan
            </span>
            <CardTitle className="text-2xl font-bold text-primary-brown mt-1">
              {disputes.length - openDisputes.length + (failureReports.length - openFailures.length)} Kasus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-primary-brown/60">
              Sengketa dan laporan kendala yang telah diputuskan admin.
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="disputes" className="space-y-4">
        <TabsList className="bg-cream border border-beige">
          <TabsTrigger value="disputes" className="text-xs font-bold gap-2">
            <Scale className="w-4 h-4" />
            Sengketa Mahasiswa ({openDisputes.length})
          </TabsTrigger>
          <TabsTrigger value="failures" className="text-xs font-bold gap-2">
            <ShieldAlert className="w-4 h-4" />
            Laporan Kendala UMKM ({openFailures.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SENGKETA MAHASISWA */}
        <TabsContent value="disputes" className="space-y-4">
          <Card className="border-beige bg-white shadow-xs">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-primary-brown flex items-center gap-2">
                <Scale className="w-5 h-5 text-earth-primary" />
                Daftar Sengketa Penolakan Tugas (Disputes)
              </CardTitle>
              <CardDescription className="text-xs">
                Tinjau bukti kerja dan putuskan apakah karya memenuhi kriteria penerimaan atau penolakan UMKM ditegakkan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {disputes.length === 0 ? (
                <div className="py-8 text-center text-xs text-primary-brown/60">
                  Belum ada catatan sengketa mahasiswa.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-beige text-primary-brown/60 uppercase font-semibold">
                        <th className="pb-3 font-semibold">Tugas & Klien</th>
                        <th className="pb-3 font-semibold">Mahasiswa</th>
                        <th className="pb-3 font-semibold">Alasan Sanggahan & Bukti</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-beige/50">
                      {disputes.map((d) => {
                        const student = d.job.assignments[0]?.student;
                        return (
                          <tr key={d.id} className="text-primary-brown hover:bg-cream/40 transition-colors">
                            <td className="py-3">
                              <div className="font-bold text-primary-brown">
                                {d.job.title}
                              </div>
                              <div className="text-[11px] text-primary-brown/70 flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3.5 h-3.5" />
                                <span>{d.job.umkm.businessName}</span>
                              </div>
                              <div className="text-[10px] text-primary-brown/50 mt-1">
                                Diajukan {formatDateTime(d.createdAt)}
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="font-semibold">{student?.user.name || "Mahasiswa"}</div>
                              <div className="text-[11px] text-primary-brown/60">
                                {student?.user.email}
                              </div>
                              <div className="text-[11px] text-primary-brown/80 flex items-center gap-1 mt-0.5">
                                <GraduationCap className="w-3.5 h-3.5 text-earth-primary" />
                                <span>{student?.campus?.name}</span>
                              </div>
                            </td>
                            <td className="py-3 max-w-xs">
                              <p className="line-clamp-2 text-primary-brown/85 italic">
                                &quot;{d.reason}&quot;
                              </p>
                              {d.evidenceUrl && (
                                <a
                                  href={d.evidenceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-earth-primary hover:underline font-semibold mt-1"
                                >
                                  <span>Buka Tautan Bukti</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </td>
                            <td className="py-3">
                              {d.status === "OPEN" ? (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                                  Menunggu Keputusan
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className={
                                    d.resolution === "ACCEPT_WORK"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                      : "bg-destructive/10 text-destructive border-destructive/30"
                                  }
                                >
                                  {d.resolution === "ACCEPT_WORK"
                                    ? "Karya Diterima"
                                    : "Penolakan Ditegakkan"}
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              {d.status === "OPEN" ? (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedDispute(d);
                                    setDisputeDecision("ACCEPT_WORK");
                                    setDisputeAdminNote("");
                                    setDisputeError(null);
                                  }}
                                  className="bg-earth-primary hover:bg-earth-primary/90 text-white text-xs font-semibold"
                                >
                                  Putuskan Sengketa
                                </Button>
                              ) : (
                                <span className="text-[11px] text-primary-brown/60">
                                  {d.resolvedAt ? formatDateTime(d.resolvedAt) : "-"}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: LAPORAN KENDALA UMKM */}
        <TabsContent value="failures" className="space-y-4">
          <Card className="border-beige bg-white shadow-xs">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-primary-brown flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-destructive" />
                Laporan Kendala Pengerjaan Tugas (Failure Reports)
              </CardTitle>
              <CardDescription className="text-xs">
                Laporan dari UMKM ketika mahasiswa tidak ada kabar atau melewati batas waktu pengerjaan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {failureReports.length === 0 ? (
                <div className="py-8 text-center text-xs text-primary-brown/60">
                  Belum ada laporan kendala pengerjaan tugas.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-beige text-primary-brown/60 uppercase font-semibold">
                        <th className="pb-3 font-semibold">Tugas & Pelapor</th>
                        <th className="pb-3 font-semibold">Mahasiswa Terlapor</th>
                        <th className="pb-3 font-semibold">Alasan & Tanggapan Mhs</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-beige/50">
                      {failureReports.map((f) => {
                        const student = f.assignment.student;
                        return (
                          <tr key={f.id} className="text-primary-brown hover:bg-cream/40 transition-colors">
                            <td className="py-3">
                              <div className="font-bold text-primary-brown">
                                {f.job.title}
                              </div>
                              <div className="text-[11px] text-primary-brown/70 flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3.5 h-3.5" />
                                <span>{f.job.umkm.businessName}</span>
                              </div>
                              <div className="text-[10px] text-primary-brown/50 mt-1">
                                Dilaporkan {formatDateTime(f.createdAt)}
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="font-semibold">{student.user.name}</div>
                              <div className="text-[11px] text-primary-brown/60">
                                {student.user.email}
                              </div>
                              <div className="text-[11px] text-primary-brown/80 flex items-center gap-1 mt-0.5">
                                <GraduationCap className="w-3.5 h-3.5 text-earth-primary" />
                                <span>{student.campus?.name}</span>
                              </div>
                            </td>
                            <td className="py-3 max-w-xs space-y-1">
                              <div>
                                <span className="font-semibold text-primary-brown/70">UMKM: </span>
                                <span className="italic">&quot;{f.reason}&quot;</span>
                              </div>
                              {f.studentResponse && (
                                <div className="text-emerald-800 bg-emerald-50 p-1.5 rounded-sm border border-emerald-200">
                                  <span className="font-semibold">Mhs: </span>
                                  <span>{f.studentResponse}</span>
                                </div>
                              )}
                              {!f.studentResponse && (
                                <span className="text-[10px] text-primary-brown/50">
                                  (Mahasiswa belum memberi tanggapan)
                                </span>
                              )}
                            </td>
                            <td className="py-3">
                              {f.status === "OPEN" && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                                  Menunggu Keputusan
                                </Badge>
                              )}
                              {f.status === "CONFIRMED" && (
                                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                                  Dikonfirmasi (-15 pts)
                                </Badge>
                              )}
                              {f.status === "DISMISSED" && (
                                <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                                  Ditolak (Lanjut)
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              {f.status === "OPEN" ? (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedFailure(f);
                                    setFailureDecision("CONFIRMED");
                                    setFailureAdminNote("");
                                    setFailureError(null);
                                  }}
                                  className="bg-earth-primary hover:bg-earth-primary/90 text-white text-xs font-semibold"
                                >
                                  Tinjau & Putuskan
                                </Button>
                              ) : (
                                <span className="text-[11px] text-primary-brown/60">
                                  {f.resolvedAt ? formatDateTime(f.resolvedAt) : "-"}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG KEPUTUSAN SENGKETA (DISPUTE) */}
      <Dialog
        open={Boolean(selectedDispute)}
        onOpenChange={(open) => {
          if (!open) setSelectedDispute(null);
        }}
      >
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold text-primary-brown flex items-center gap-2">
              <Scale className="w-5 h-5 text-earth-primary" />
              Keputusan Sengketa
            </DialogTitle>
            <DialogDescription className="text-xs text-primary-brown/70">
              Putuskan resolusi sengketa penolakan tugas secara objektif sesuai kriteria penerimaan.
            </DialogDescription>
          </DialogHeader>

          {disputeError && (
            <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{disputeError}</span>
            </div>
          )}

          {selectedDispute && (
            <div className="space-y-4 py-2">
              <div className="bg-cream/60 rounded-xl p-3 border border-beige space-y-2 text-xs">
                <div className="font-bold text-primary-brown">
                  {selectedDispute.job.title}
                </div>
                <div>
                  <span className="text-primary-brown/60">Alasan Sanggahan Mahasiswa: </span>
                  <p className="mt-0.5 text-primary-brown/90 italic">
                    &quot;{selectedDispute.reason}&quot;
                  </p>
                </div>
                {selectedDispute.evidenceUrl && (
                  <div className="pt-1">
                    <a
                      href={selectedDispute.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-earth-primary hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>Periksa Tautan Bukti Pekerjaan</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              {/* Opsi Keputusan */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-primary-brown">
                  Pilih Keputusan Admin
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDisputeDecision("ACCEPT_WORK")}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                      disputeDecision === "ACCEPT_WORK"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600"
                        : "border-beige bg-white text-primary-brown/70 hover:bg-cream"
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4" />
                      Terima Karya
                    </div>
                    <p className="text-[10px] text-primary-brown/60 mt-1">
                      Karya dinilai memenuhi kriteria. Saldo dialokasikan dan reputasi bertambah.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDisputeDecision("UPHOLD_REJECTION")}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                      disputeDecision === "UPHOLD_REJECTION"
                        ? "border-destructive bg-destructive/10 text-destructive ring-1 ring-destructive"
                        : "border-beige bg-white text-primary-brown/70 hover:bg-cream"
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 text-destructive">
                      <XCircle className="w-4 h-4" />
                      Tegakkan Penolakan
                    </div>
                    <p className="text-[10px] text-primary-brown/60 mt-1">
                      Karya tidak memenuhi kriteria. Penolakan UMKM sah dan saldo dibatalkan.
                    </p>
                  </button>
                </div>
              </div>

              {/* Catatan Admin */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-primary-brown">
                  Catatan Pertimbangan Admin (Opsional)
                </label>
                <Textarea
                  placeholder="Jelaskan alasan objektif keputusan admin..."
                  rows={3}
                  value={disputeAdminNote}
                  onChange={(e) => setDisputeAdminNote(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedDispute(null)}
              disabled={isResolvingDispute}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleResolveDispute}
              disabled={isResolvingDispute}
              className="bg-earth-primary hover:bg-earth-primary/90 text-white text-xs font-semibold"
            >
              {isResolvingDispute ? "Menyimpan..." : "Simpan Keputusan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG KEPUTUSAN KENDALA (FAILURE) */}
      <Dialog
        open={Boolean(selectedFailure)}
        onOpenChange={(open) => {
          if (!open) setSelectedFailure(null);
        }}
      >
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold text-primary-brown flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              Keputusan Laporan Kendala
            </DialogTitle>
            <DialogDescription className="text-xs text-primary-brown/70">
              Putuskan apakah penugasan dihentikan karena kegagalan atau laporan ditolak.
            </DialogDescription>
          </DialogHeader>

          {failureError && (
            <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{failureError}</span>
            </div>
          )}

          {selectedFailure && (
            <div className="space-y-4 py-2">
              <div className="bg-cream/60 rounded-xl p-3 border border-beige space-y-2 text-xs">
                <div className="font-bold text-primary-brown">
                  {selectedFailure.job.title}
                </div>
                <div>
                  <span className="text-primary-brown/60">Alasan Pelaporan UMKM: </span>
                  <p className="mt-0.5 text-primary-brown/90 italic">
                    &quot;{selectedFailure.reason}&quot;
                  </p>
                </div>
                {selectedFailure.studentResponse && (
                  <div className="bg-white p-2 rounded-lg border border-beige">
                    <span className="text-emerald-800 font-semibold block text-[11px]">
                      Klarifikasi Mahasiswa:
                    </span>
                    <p className="text-primary-brown text-[11px] mt-0.5">
                      {selectedFailure.studentResponse}
                    </p>
                  </div>
                )}
              </div>

              {/* Opsi Keputusan */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-primary-brown">
                  Pilih Keputusan Admin
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFailureDecision("CONFIRMED")}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                      failureDecision === "CONFIRMED"
                        ? "border-destructive bg-destructive/10 text-destructive ring-1 ring-destructive"
                        : "border-beige bg-white text-primary-brown/70 hover:bg-cream"
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                      Konfirmasi Gagal
                    </div>
                    <p className="text-[10px] text-primary-brown/60 mt-1">
                      Mahasiswa disanksi −15 poin. Tugas dibuka kembali untuk pelamar baru.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFailureDecision("DISMISSED")}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                      failureDecision === "DISMISSED"
                        ? "border-earth-primary bg-earth-sand/30 text-primary-brown ring-1 ring-earth-primary"
                        : "border-beige bg-white text-primary-brown/70 hover:bg-cream"
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 text-earth-primary">
                      <CheckCircle2 className="w-4 h-4" />
                      Tolak Laporan
                    </div>
                    <p className="text-[10px] text-primary-brown/60 mt-1">
                      Laporan ditolak. Mahasiswa tetap melanjutkan pengerjaan tugas.
                    </p>
                  </button>
                </div>
              </div>

              {/* Catatan Admin */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-primary-brown">
                  Catatan Admin {failureDecision === "DISMISSED" ? "(Wajib)" : "(Opsional)"}
                </label>
                <Textarea
                  placeholder="Tuliskan alasan pertimbangan keputusan admin..."
                  rows={3}
                  value={failureAdminNote}
                  onChange={(e) => setFailureAdminNote(e.target.value)}
                  className="text-xs"
                  required={failureDecision === "DISMISSED"}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedFailure(null)}
              disabled={isResolvingFailure}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleResolveFailure}
              disabled={isResolvingFailure}
              className="bg-earth-primary hover:bg-earth-primary/90 text-white text-xs font-semibold"
            >
              {isResolvingFailure ? "Menyimpan..." : "Simpan Keputusan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

