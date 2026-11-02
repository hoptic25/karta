"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ArrowUpRight,
  Clock,
  AlertCircle,
  Building2,
  CheckCircle2,
  XCircle,
  Edit2,
  HelpCircle,
  ArrowDownLeft,
} from "lucide-react";
import { formatRupiah, formatDateTime, maskBankAccount } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateBankDetailsAction,
  requestWithdrawalAction,
} from "../actions";
import type { EarningsSummary } from "../service";

const POPULAR_BANKS = [
  "BCA",
  "Mandiri",
  "BNI",
  "BRI",
  "BSI (Bank Syariah Indonesia)",
  "CIMB Niaga",
  "Bank Jago",
  "Seabank",
  "Permata",
  "BTPN / Jenius",
  "Bank Danamon",
  "Lainnya",
];

interface EarningsViewProps {
  summary: EarningsSummary;
}

export function EarningsView({ summary }: EarningsViewProps) {
  const router = useRouter();

  // Bank details state
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankName, setBankName] = useState(summary.bankDetails.bankName || "");
  const [bankAccountName, setBankAccountName] = useState(summary.bankDetails.bankAccountName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(summary.bankDetails.bankAccountNumber || "");
  const [isUpdatingBank, setIsUpdatingBank] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);

  // Withdrawal state
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const hasBankDetails =
    Boolean(summary.bankDetails.bankName) &&
    Boolean(summary.bankDetails.bankAccountNumber) &&
    Boolean(summary.bankDetails.bankAccountName);

  const canWithdraw =
    summary.availableBalance >= 50000 &&
    hasBankDetails &&
    !summary.activeWithdrawal;

  const handleUpdateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankError(null);

    if (!bankName.trim() || !bankAccountName.trim() || !bankAccountNumber.trim()) {
      setBankError("Semua bidang data rekening wajib diisi.");
      return;
    }

    setIsUpdatingBank(true);
    try {
      const res = await updateBankDetailsAction({
        bankName: bankName.trim(),
        bankAccountName: bankAccountName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
      });

      if (!res.ok) {
        setBankError(res.error.message);
        return;
      }

      setBankModalOpen(false);
      router.refresh();
    } catch {
      setBankError("Terjadi kesalahan saat menyimpan rekening.");
    } finally {
      setIsUpdatingBank(false);
    }
  };

  const handleConfirmWithdrawal = async () => {
    setWithdrawError(null);
    setIsWithdrawing(true);

    try {
      const res = await requestWithdrawalAction();
      if (!res.ok) {
        setWithdrawError(res.error.message);
        return;
      }

      setWithdrawSuccess(true);
      setTimeout(() => {
        setWithdrawModalOpen(false);
        setWithdrawSuccess(false);
        router.refresh();
      }, 1500);
    } catch {
      setWithdrawError("Terjadi kesalahan saat mengajukan penarikan dana.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-primary-brown">
          Penghasilan & Dompet
        </h1>
        <p className="text-sm text-primary-brown/70 mt-1">
          Pantau saldo honor pekerjaan, riwayat transaksi ledger, dan cairkan dana langsung ke rekening bank Anda.
        </p>
      </div>

      {/* Saldo Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Tersedia */}
        <Card className="border-earth-primary/30 bg-white shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-earth-primary">
                Saldo Tersedia
              </span>
              <div className="h-8 w-8 rounded-full bg-earth-primary/10 flex items-center justify-center text-earth-primary">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-primary-brown mt-1">
              {formatRupiah(summary.availableBalance)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-primary-brown/60">
              Dapat dicairkan langsung ke rekening bank (Min. Rp50.000).
            </p>
          </CardContent>
        </Card>

        {/* Saldo Pending (Dalam Pengerjaan) */}
        <Card className="border-beige bg-white shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-brown/70">
                Dalam Proses
              </span>
              <div className="h-8 w-8 rounded-full bg-earth-sand/30 flex items-center justify-center text-primary-brown">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-primary-brown mt-1">
              {formatRupiah(summary.reservedBalance)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-primary-brown/60">
              Honor dari tugas yang sedang dikerjakan atau diulas UMKM.
            </p>
          </CardContent>
        </Card>

        {/* Saldo Tertahan (Sengketa / Revisi) */}
        <Card className="border-beige bg-white shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-brown/70">
                Tertahan
              </span>
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-primary-brown mt-1">
              {formatRupiah(summary.heldBalance)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-primary-brown/60">
              Honor dari tugas yang ditolak atau sedang dalam sengketa.
            </p>
          </CardContent>
        </Card>

        {/* Total Dicairkan */}
        <Card className="border-beige bg-white shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-brown/70">
                Telah Dicairkan
              </span>
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-primary-brown mt-1">
              {formatRupiah(summary.paidBalance)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-primary-brown/60">
              Total akumulasi dana yang berhasil masuk ke rekening Anda.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Row: Withdrawal & Bank Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Rekening Bank */}
        <Card className="border-beige bg-white shadow-xs md:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-primary-brown flex items-center gap-2">
                <Building2 className="w-4 h-4 text-earth-primary" />
                Rekening Pencairan
              </CardTitle>
              {hasBankDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBankModalOpen(true)}
                  className="h-8 px-2 text-xs text-earth-primary hover:text-earth-primary/80"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  Ubah
                </Button>
              )}
            </div>
            <CardDescription className="text-xs">
              Rekening bank tujuan untuk transfer honor pekerjaan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasBankDetails ? (
              <div className="bg-cream/60 rounded-xl p-4 border border-beige/60 space-y-2">
                <div className="text-xs font-semibold text-primary-brown uppercase tracking-wider">
                  {summary.bankDetails.bankName}
                </div>
                <div className="font-mono text-base font-bold text-primary-brown">
                  {maskBankAccount(summary.bankDetails.bankAccountNumber)}
                </div>
                <div className="text-xs text-primary-brown/70">
                  a.n. {summary.bankDetails.bankAccountName}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-beige p-5 text-center space-y-3">
                <p className="text-xs text-primary-brown/70">
                  Anda belum mendaftarkan nomor rekening pencairan.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBankModalOpen(true)}
                  className="w-full text-xs"
                >
                  Atur Rekening Sekarang
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card Penarikan Dana */}
        <Card className="border-beige bg-white shadow-xs md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-primary-brown flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-earth-primary" />
              Pencairan Saldo
            </CardTitle>
            <CardDescription className="text-xs">
              Tarik seluruh saldo yang tersedia langsung ke rekening bank yang terdaftar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.activeWithdrawal ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-sm">
                    Pengajuan Penarikan Sedang Diproses
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Pengajuan penarikan sebesar{" "}
                    <strong>{formatRupiah(summary.activeWithdrawal.amountIdr)}</strong> pada{" "}
                    {formatDateTime(summary.activeWithdrawal.requestedAt)} sedang diverifikasi oleh admin.
                    Proses transfer memakan waktu maksimal 1-3 hari kerja.
                  </p>
                  <div className="pt-1 text-[11px] text-amber-700">
                    Tujuan: {summary.activeWithdrawal.bankName} - {maskBankAccount(summary.activeWithdrawal.bankAccountNumber)} (a.n. {summary.activeWithdrawal.bankAccountName})
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-cream/50 border border-beige/60">
                <div>
                  <div className="text-xs text-primary-brown/60 uppercase font-semibold">
                    Jumlah yang dapat ditarik
                  </div>
                  <div className="text-2xl font-bold text-primary-brown mt-0.5">
                    {formatRupiah(summary.availableBalance)}
                  </div>
                  <div className="text-[11px] text-primary-brown/60 mt-1 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Penarikan mencakup seluruh saldo yang telah berstatus selesai (PAYABLE).
                  </div>
                </div>

                <Button
                  onClick={() => setWithdrawModalOpen(true)}
                  disabled={!canWithdraw}
                  className="w-full sm:w-auto bg-earth-primary hover:bg-earth-primary/90 text-white font-semibold px-6 shrink-0"
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Tarik Seluruh Saldo
                </Button>
              </div>
            )}

            {!canWithdraw && !summary.activeWithdrawal && (
              <div className="text-xs text-primary-brown/60 space-y-1 pl-1">
                {!hasBankDetails && (
                  <p className="text-amber-700 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Harap lengkapi nomor rekening bank Anda terlebih dahulu.
                  </p>
                )}
                {hasBankDetails && summary.availableBalance < 50000 && (
                  <p className="text-primary-brown/60 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Batas minimum penarikan dana adalah Rp50.000. Selesaikan lebih banyak tugas untuk mencairkan saldo.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Riwayat Penarikan Dana */}
      <Card className="border-beige bg-white shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-primary-brown">
            Riwayat Penarikan Dana
          </CardTitle>
          <CardDescription className="text-xs">
            Daftar pengajuan penarikan dana ke rekening bank beserta status pencairan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary.withdrawalHistory.length === 0 ? (
            <div className="text-center py-8 text-primary-brown/50 text-xs">
              Belum ada riwayat penarikan dana.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-beige text-primary-brown/60 uppercase font-semibold">
                    <th className="pb-3 font-semibold">Tanggal Pengajuan</th>
                    <th className="pb-3 font-semibold">Rekening Tujuan</th>
                    <th className="pb-3 font-semibold">Jumlah</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Catatan / Tanggal Diproses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige/50">
                  {summary.withdrawalHistory.map((w) => (
                    <tr key={w.id} className="text-primary-brown hover:bg-cream/40 transition-colors">
                      <td className="py-3 font-medium">
                        {formatDateTime(w.requestedAt)}
                      </td>
                      <td className="py-3">
                        <div className="font-semibold">{w.bankName}</div>
                        <div className="text-[11px] text-primary-brown/60">
                          {maskBankAccount(w.bankAccountNumber)} a.n. {w.bankAccountName}
                        </div>
                      </td>
                      <td className="py-3 font-bold text-sm">
                        {formatRupiah(w.amountIdr)}
                      </td>
                      <td className="py-3">
                        {w.status === "REQUESTED" && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                            Menunggu Transfer
                          </Badge>
                        )}
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
                          <div className="italic text-primary-brown/90 mt-0.5">
                            &quot;{w.adminNote}&quot;
                          </div>
                        )}
                        {!w.processedAt && !w.adminNote && "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Riwayat Mutasi Saldo (Ledger) */}
      <Card className="border-beige bg-white shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-primary-brown">
            Mutasi Saldo Pekerjaan
          </CardTitle>
          <CardDescription className="text-xs">
            Catatan pembukuan honor tugas mikro yang Anda kerjakan di platform KARTA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary.ledgerHistory.length === 0 ? (
            <div className="text-center py-8 text-primary-brown/50 text-xs">
              Belum ada mutasi saldo tercatat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-beige text-primary-brown/60 uppercase font-semibold">
                    <th className="pb-3 font-semibold">Tanggal</th>
                    <th className="pb-3 font-semibold">Keterangan Tugas</th>
                    <th className="pb-3 font-semibold">Status Saldo</th>
                    <th className="pb-3 font-semibold text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige/50">
                  {summary.ledgerHistory.map((entry) => {
                    const isDebit = entry.status === "PAID";
                    return (
                      <tr key={entry.id} className="text-primary-brown hover:bg-cream/40 transition-colors">
                        <td className="py-3 font-medium">
                          {formatDateTime(entry.createdAt)}
                        </td>
                        <td className="py-3">
                          <div className="font-semibold text-primary-brown">
                            {entry.assignment?.job?.title || "Honor Tugas Mikro"}
                          </div>
                          <div className="text-[11px] text-primary-brown/60 font-mono">
                            Ref: {entry.id.slice(0, 8)}
                          </div>
                        </td>
                        <td className="py-3">
                          {entry.status === "PAYABLE" && (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                              Tersedia (Selesai)
                            </Badge>
                          )}
                          {entry.status === "RESERVED" && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                              Dalam Proses
                            </Badge>
                          )}
                          {entry.status === "HELD" && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                              Tertahan
                            </Badge>
                          )}
                          {entry.status === "PAID" && (
                            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                              Sudah Dicairkan
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 text-right font-bold text-sm">
                          {isDebit ? (
                            <span className="text-primary-brown/60 flex items-center justify-end gap-1">
                              <ArrowUpRight className="w-3.5 h-3.5 text-primary-brown/40" />
                              -{formatRupiah(entry.amountIdr)}
                            </span>
                          ) : (
                            <span className="text-emerald-700 flex items-center justify-end gap-1">
                              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                              +{formatRupiah(entry.amountIdr)}
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

      {/* DIALOG: Ubah Rekening Bank */}
      <Dialog open={bankModalOpen} onOpenChange={setBankModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <form onSubmit={handleUpdateBank}>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl font-bold text-primary-brown">
                Atur Rekening Pencairan
              </DialogTitle>
              <DialogDescription className="text-xs text-primary-brown/70">
                Pastikan nama pemilik rekening sesuai dengan nama akun Anda untuk kelancaran verifikasi penarikan.
              </DialogDescription>
            </DialogHeader>

            {bankError && (
              <div className="mt-4 p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bankError}</span>
              </div>
            )}

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="bankName" className="text-xs font-semibold">
                  Nama Bank / E-Wallet
                </Label>
                <Select value={bankName} onValueChange={(val) => setBankName(val || "")}>
                  <SelectTrigger id="bankName" className="w-full">
                    <SelectValue placeholder="Pilih Bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULAR_BANKS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {bankName === "Lainnya" && (
                  <Input
                    placeholder="Ketikkan nama bank Anda"
                    onChange={(e) => setBankName(e.target.value)}
                    className="mt-2 text-xs"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccountNumber" className="text-xs font-semibold">
                  Nomor Rekening
                </Label>
                <Input
                  id="bankAccountNumber"
                  type="text"
                  placeholder="Contoh: 1234567890"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value.replace(/[^0-9]/g, ""))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccountName" className="text-xs font-semibold">
                  Nama Pemilik Rekening
                </Label>
                <Input
                  id="bankAccountName"
                  type="text"
                  placeholder="Sesuai buku tabungan"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBankModalOpen(false)}
                disabled={isUpdatingBank}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isUpdatingBank}
                className="bg-earth-primary hover:bg-earth-primary/90 text-white text-xs font-semibold"
              >
                {isUpdatingBank ? "Menyimpan..." : "Simpan Rekening"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Konfirmasi Penarikan Dana */}
      <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold text-primary-brown">
              Konfirmasi Penarikan Dana
            </DialogTitle>
            <DialogDescription className="text-xs text-primary-brown/70">
              Periksa kembali rincian penarikan saldo Anda sebelum mengajukan.
            </DialogDescription>
          </DialogHeader>

          {withdrawError && (
            <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{withdrawError}</span>
            </div>
          )}

          {withdrawSuccess ? (
            <div className="py-6 text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <div className="font-bold text-base text-primary-brown">
                Pengajuan Penarikan Berhasil!
              </div>
              <p className="text-xs text-primary-brown/70">
                Permintaan Anda telah tercatat dan akan diproses oleh admin KARTA.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="bg-cream/60 rounded-xl p-4 border border-beige space-y-3">
                <div className="flex justify-between items-center text-xs text-primary-brown/70">
                  <span>Jumlah Penarikan</span>
                  <span className="text-base font-bold text-primary-brown">
                    {formatRupiah(summary.availableBalance)}
                  </span>
                </div>
                <div className="border-t border-beige/60 pt-2 flex justify-between items-center text-xs text-primary-brown/70">
                  <span>Biaya Penarikan</span>
                  <span className="font-semibold text-emerald-700">Rp 0 (Gratis)</span>
                </div>
                <div className="border-t border-beige/60 pt-2 space-y-1 text-xs">
                  <div className="text-primary-brown/60">Rekening Tujuan:</div>
                  <div className="font-bold text-primary-brown">
                    {summary.bankDetails.bankName} - {summary.bankDetails.bankAccountNumber}
                  </div>
                  <div className="text-primary-brown/70">
                    a.n. {summary.bankDetails.bankAccountName}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Admin akan memverifikasi dan mengirimkan transfer manual ke rekening Anda dalam waktu 1-3 hari kerja.
                </span>
              </div>
            </div>
          )}

          {!withdrawSuccess && (
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setWithdrawModalOpen(false)}
                disabled={isWithdrawing}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleConfirmWithdrawal}
                disabled={isWithdrawing}
                className="bg-earth-primary hover:bg-earth-primary/90 text-white text-xs font-semibold"
              >
                {isWithdrawing ? "Memproses..." : "Ajukan Penarikan Sekarang"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
