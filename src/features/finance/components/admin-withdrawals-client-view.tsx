"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Building2,
  GraduationCap,
} from "lucide-react";
import { formatRupiah, formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { processWithdrawalAction } from "../actions";
import type { getAdminWithdrawals } from "../queries";

interface AdminWithdrawalsClientViewProps {
  withdrawals: Awaited<ReturnType<typeof getAdminWithdrawals>>;
}

export function AdminWithdrawalsClientView({ withdrawals }: AdminWithdrawalsClientViewProps) {
  const router = useRouter();

  const [selectedWithdrawal, setSelectedWithdrawal] = useState<
    AdminWithdrawalsClientViewProps["withdrawals"][number] | null
  >(null);
  const [modalType, setModalType] = useState<"PAY" | "REJECT" | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const pendingWithdrawals = withdrawals.filter((w) => w.status === "REQUESTED");
  const processedWithdrawals = withdrawals.filter((w) => w.status !== "REQUESTED");

  const totalPendingAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amountIdr, 0);

  const handleOpenAction = (
    w: AdminWithdrawalsClientViewProps["withdrawals"][number],
    type: "PAY" | "REJECT"
  ) => {
    setSelectedWithdrawal(w);
    setModalType(type);
    setAdminNote("");
    setActionError(null);
  };

  const handleProcess = async () => {
    if (!selectedWithdrawal || !modalType) return;
    setActionError(null);

    if (modalType === "REJECT" && !adminNote.trim()) {
      setActionError("Alasan penolakan penarikan dana wajib dicantumkan.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await processWithdrawalAction({
        withdrawalId: selectedWithdrawal.id,
        action: modalType,
        adminNote: adminNote.trim() || undefined,
      });

      if (!res.ok) {
        setActionError(res.error.message);
        return;
      }

      setModalType(null);
      setSelectedWithdrawal(null);
      router.refresh();
    } catch {
      setActionError("Terjadi kesalahan saat memproses penarikan dana.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-beige bg-white shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Antrean Verifikasi
            </span>
            <CardTitle className="text-2xl font-bold text-primary-brown mt-1">
              {pendingWithdrawals.length} Pengajuan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-primary-brown/60">
              Membutuhkan transfer manual & konfirmasi admin.
            </p>
          </CardContent>
        </Card>

        <Card className="border-beige bg-white shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-earth-primary">
              Total Dana Menunggu
            </span>
            <CardTitle className="text-2xl font-bold text-primary-brown mt-1">
              {formatRupiah(totalPendingAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-primary-brown/60">
              Akumulasi saldo honor yang diajukan mahasiswa.
            </p>
          </CardContent>
        </Card>

        <Card className="border-beige bg-white shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Telah Diproses
            </span>
            <CardTitle className="text-2xl font-bold text-primary-brown mt-1">
              {processedWithdrawals.length} Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-primary-brown/60">
              Riwayat penarikan yang telah disetujui atau ditolak.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ANTREAN PENARIKAN (PENDING) */}
      <Card className="border-beige bg-white shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-primary-brown flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Antrean Penarikan Dana Mahasiswa
          </CardTitle>
          <CardDescription className="text-xs">
            Pastikan Anda telah melakukan transfer ke rekening bank mahasiswa sebelum menekan tombol setujui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingWithdrawals.length === 0 ? (
            <div className="py-8 text-center text-xs text-primary-brown/60">
              Tidak ada antrean penarikan dana saat ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-beige text-primary-brown/60 uppercase font-semibold">
                    <th className="pb-3 font-semibold">Mahasiswa</th>
                    <th className="pb-3 font-semibold">Rekening Tujuan</th>
                    <th className="pb-3 font-semibold">Nominal</th>
                    <th className="pb-3 font-semibold">Waktu Pengajuan</th>
                    <th className="pb-3 font-semibold text-right">Aksi Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige/50">
                  {pendingWithdrawals.map((w) => (
                    <tr key={w.id} className="text-primary-brown hover:bg-cream/40 transition-colors">
                      <td className="py-3">
                        <div className="font-bold">{w.student.user.name}</div>
                        <div className="text-[11px] text-primary-brown/60">
                          {w.student.user.email}
                        </div>
                        <div className="text-[11px] text-primary-brown/80 flex items-center gap-1 mt-0.5">
                          <GraduationCap className="w-3.5 h-3.5 text-earth-primary" />
                          <span>{w.student.campus?.name}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-primary-brown flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-primary-brown/60" />
                          {w.bankName}
                        </div>
                        <div className="font-mono font-bold text-sm text-primary-brown mt-0.5">
                          {w.bankAccountNumber}
                        </div>
                        <div className="text-[11px] text-primary-brown/70">
                          a.n. {w.bankAccountName}
                        </div>
                      </td>
                      <td className="py-3 font-bold text-base text-earth-primary">
                        {formatRupiah(w.amountIdr)}
                      </td>
                      <td className="py-3 text-[11px] text-primary-brown/70">
                        {formatDateTime(w.requestedAt)}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenAction(w, "REJECT")}
                            className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Tolak
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleOpenAction(w, "PAY")}
                            className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Setujui Transfer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RIWAYAT PENARIKAN (PROCESSED) */}
      <Card className="border-beige bg-white shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-primary-brown">
            Riwayat Penarikan yang Telah Diproses
          </CardTitle>
          <CardDescription className="text-xs">
            Catatan historis audit pengeluaran honor mahasiswa di platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {processedWithdrawals.length === 0 ? (
            <div className="py-8 text-center text-xs text-primary-brown/60">
              Belum ada riwayat penarikan yang diproses.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-beige text-primary-brown/60 uppercase font-semibold">
                    <th className="pb-3 font-semibold">Mahasiswa</th>
                    <th className="pb-3 font-semibold">Rekening Tujuan</th>
                    <th className="pb-3 font-semibold">Nominal</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Tanggal & Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige/50">
                  {processedWithdrawals.map((w) => (
                    <tr key={w.id} className="text-primary-brown hover:bg-cream/40 transition-colors">
                      <td className="py-3">
                        <div className="font-semibold">{w.student.user.name}</div>
                        <div className="text-[11px] text-primary-brown/60">
                          {w.student.user.email}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="font-medium">{w.bankName} - {w.bankAccountNumber}</div>
                        <div className="text-[11px] text-primary-brown/60">a.n. {w.bankAccountName}</div>
                      </td>
                      <td className="py-3 font-bold text-sm">
                        {formatRupiah(w.amountIdr)}
                      </td>
                      <td className="py-3">
                        {w.status === "PAID" && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                            Berhasil Ditransfer
                          </Badge>
                        )}
                        {w.status === "REJECTED" && (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                            Ditolak
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 text-[11px] text-primary-brown/70">
                        {w.processedAt && (
                          <div>Diproses: {formatDateTime(w.processedAt)}</div>
                        )}
                        {w.adminNote && (
                          <div className="italic text-primary-brown/85 mt-0.5">
                            &quot;{w.adminNote}&quot;
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DIALOG KONFIRMASI AKSI ADMIN */}
      <Dialog
        open={Boolean(modalType && selectedWithdrawal)}
        onOpenChange={(open) => {
          if (!open) {
            setModalType(null);
            setSelectedWithdrawal(null);
          }
        }}
      >
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold text-primary-brown">
              {modalType === "PAY" ? "Konfirmasi Transfer Dana" : "Tolak Pengajuan Penarikan"}
            </DialogTitle>
            <DialogDescription className="text-xs text-primary-brown/70">
              {modalType === "PAY"
                ? "Pastikan Anda telah mentransfer nominal dana berikut ke rekening tujuan mahasiswa."
                : "Saldo akan dikembalikan ke status PAYABLE mahasiswa dan mereka akan menerima notifikasi alasan penolakan."}
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {selectedWithdrawal && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-cream/60 border border-beige space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-primary-brown/60">Mahasiswa</span>
                  <span className="font-bold text-primary-brown">
                    {selectedWithdrawal.student.user.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-primary-brown/60">Nominal Penarikan</span>
                  <span className="text-base font-bold text-earth-primary">
                    {formatRupiah(selectedWithdrawal.amountIdr)}
                  </span>
                </div>
                <div className="border-t border-beige/60 pt-2 space-y-1">
                  <div className="text-primary-brown/60">Rekening Tujuan:</div>
                  <div className="font-bold text-primary-brown">
                    {selectedWithdrawal.bankName} - {selectedWithdrawal.bankAccountNumber}
                  </div>
                  <div className="text-primary-brown/70">
                    a.n. {selectedWithdrawal.bankAccountName}
                  </div>
                </div>
              </div>

              {modalType === "REJECT" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-primary-brown">
                    Alasan Penolakan (Wajib)
                  </label>
                  <Textarea
                    placeholder="Contoh: Nomor rekening tidak valid / nama tidak sesuai identitas..."
                    rows={3}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              )}

              {modalType === "PAY" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-primary-brown">
                    Catatan Transfer / No. Referensi Bank (Opsional)
                  </label>
                  <Textarea
                    placeholder="Contoh: No. Ref BCA 987654321..."
                    rows={2}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="text-xs"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalType(null);
                setSelectedWithdrawal(null);
              }}
              disabled={isProcessing}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleProcess}
              disabled={isProcessing}
              className={
                modalType === "PAY"
                  ? "bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
                  : "bg-destructive hover:bg-destructive/90 text-white text-xs font-semibold"
              }
            >
              {isProcessing
                ? "Memproses..."
                : modalType === "PAY"
                ? "Tandai Sudah Ditransfer"
                : "Tolak Penarikan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
