"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReferralCodeWithRelations } from "../queries";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  createReferralCodeAction,
  updateReferralCodeAction,
  deleteReferralCodeAction,
} from "../actions";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import type { Campus } from "@/generated/prisma/client";

type Props = {
  initialReferralCodes: ReferralCodeWithRelations[];
  campuses: Campus[];
};

export function AdminReferralClientView({
  initialReferralCodes,
  campuses,
}: Props) {
  const router = useRouter();
  const [referralCodes] =
    useState<ReferralCodeWithRelations[]>(initialReferralCodes);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCode, setSelectedCode] =
    useState<ReferralCodeWithRelations | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [campusId, setCampusId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [maxUses, setMaxUses] = useState("");

  const resetForm = () => {
    setCode("");
    setCampusId("");
    setIsActive(true);
    setExpiresAt("");
    setMaxUses("");
    setSelectedCode(null);
  };

  const handleCreate = async () => {
    if (!campusId) {
      toast.error("Error", {
        description: "Pilih kampus terlebih dahulu",
      });
      return;
    }

    setIsSubmitting(true);
    const result = await createReferralCodeAction({
      code: code.toUpperCase(),
      campusId,
      isActive,
      expiresAt: expiresAt || undefined,
      maxUses: maxUses ? parseInt(maxUses) : undefined,
    });

    setIsSubmitting(false);

    if (result.ok) {
      toast.success("Berhasil", {
        description: "Kode referral berhasil ditambahkan",
      });
      setIsCreateOpen(false);
      resetForm();
      router.refresh();
    } else {
      toast.error("Gagal", {
        description: result.error.message,
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedCode) return;

    setIsSubmitting(true);
    const result = await updateReferralCodeAction({
      id: selectedCode.id,
      code: code.toUpperCase(),
      campusId,
      isActive,
      expiresAt: expiresAt || null,
      maxUses: maxUses ? parseInt(maxUses) : null,
    });

    setIsSubmitting(false);

    if (result.ok) {
      toast.success("Berhasil", {
        description: "Kode referral berhasil diperbarui",
      });
      setIsEditOpen(false);
      resetForm();
      router.refresh();
    } else {
      toast.error("Gagal", {
        description: result.error.message,
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedCode) return;

    setIsSubmitting(true);
    const result = await deleteReferralCodeAction({ id: selectedCode.id });

    setIsSubmitting(false);

    if (result.ok) {
      toast.success("Berhasil", {
        description: "Kode referral berhasil dihapus",
      });
      setIsDeleteOpen(false);
      resetForm();
      router.refresh();
    } else {
      toast.error("Gagal", {
        description: result.error.message,
      });
    }
  };

  const openEditDialog = (referralCode: ReferralCodeWithRelations) => {
    setSelectedCode(referralCode);
    setCode(referralCode.code);
    setCampusId(referralCode.campusId);
    setIsActive(referralCode.isActive);
    setExpiresAt(
      referralCode.expiresAt
        ? new Date(referralCode.expiresAt).toISOString().split("T")[0]
        : ""
    );
    setMaxUses(referralCode.maxUses?.toString() ?? "");
    setIsEditOpen(true);
  };

  const openDeleteDialog = (referralCode: ReferralCodeWithRelations) => {
    setSelectedCode(referralCode);
    setIsDeleteOpen(true);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID");
  };

  const isExpired = (date: Date | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const isMaxUsesReached = (code: ReferralCodeWithRelations) => {
    if (!code.maxUses) return false;
    return code.usedCount >= code.maxUses;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kelola Kode Referral</h1>
          <p className="text-sm text-muted-foreground">
            Kelola kode referral untuk pendaftaran kampus
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Kode
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Kampus</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Digunakan</TableHead>
              <TableHead>Maks. Penggunaan</TableHead>
              <TableHead>Kadaluarsa</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referralCodes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  Belum ada kode referral
                </TableCell>
              </TableRow>
            ) : (
              referralCodes.map((referralCode) => (
                <TableRow key={referralCode.id}>
                  <TableCell className="font-mono font-medium">
                    {referralCode.code}
                  </TableCell>
                  <TableCell>{referralCode.campus.name}</TableCell>
                  <TableCell>
                    {!referralCode.isActive ? (
                      <Badge variant="secondary">Nonaktif</Badge>
                    ) : isExpired(referralCode.expiresAt) ? (
                      <Badge variant="destructive">Kadaluarsa</Badge>
                    ) : isMaxUsesReached(referralCode) ? (
                      <Badge variant="destructive">Penuh</Badge>
                    ) : (
                      <Badge variant="default">Aktif</Badge>
                    )}
                  </TableCell>
                  <TableCell>{referralCode.usedCount}</TableCell>
                  <TableCell>
                    {referralCode.maxUses ?? "Tidak terbatas"}
                  </TableCell>
                  <TableCell>{formatDate(referralCode.expiresAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(referralCode)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(referralCode)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kode Referral</DialogTitle>
            <DialogDescription>
              Tambahkan kode referral baru untuk kampus
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="code">Kode Referral</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))
                }
                placeholder="UI2024"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Hanya huruf besar, angka, underscore, dan dash
              </p>
            </div>
            <div>
              <Label htmlFor="campus">Kampus</Label>
              <Select value={campusId} onValueChange={(value) => setCampusId(value || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kampus" />
                </SelectTrigger>
                <SelectContent>
                  {campuses.map((campus) => (
                    <SelectItem key={campus.id} value={campus.id}>
                      {campus.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="maxUses">Maksimal Penggunaan (Opsional)</Label>
              <Input
                id="maxUses"
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Tidak terbatas"
              />
            </div>
            <div>
              <Label htmlFor="expiresAt">Tanggal Kadaluarsa (Opsional)</Label>
              <Input
                id="expiresAt"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive">Kode Aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                resetForm();
              }}
            >
              Batal
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kode Referral</DialogTitle>
            <DialogDescription>
              Perbarui informasi kode referral
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-code">Kode Referral</Label>
              <Input
                id="edit-code"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))
                }
                placeholder="UI2024"
                className="font-mono"
              />
            </div>
            <div>
              <Label htmlFor="edit-campus">Kampus</Label>
              <Select value={campusId} onValueChange={(value) => setCampusId(value || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kampus" />
                </SelectTrigger>
                <SelectContent>
                  {campuses.map((campus) => (
                    <SelectItem key={campus.id} value={campus.id}>
                      {campus.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-maxUses">
                Maksimal Penggunaan (Opsional)
              </Label>
              <Input
                id="edit-maxUses"
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Tidak terbatas"
              />
            </div>
            <div>
              <Label htmlFor="edit-expiresAt">
                Tanggal Kadaluarsa (Opsional)
              </Label>
              <Input
                id="edit-expiresAt"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="edit-isActive">Kode Aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                resetForm();
              }}
            >
              Batal
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Kode Referral</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kode &quot;{selectedCode?.code}&quot;?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteOpen(false);
                resetForm();
              }}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
