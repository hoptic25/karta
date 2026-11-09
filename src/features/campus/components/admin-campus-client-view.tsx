"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CampusWithRelations } from "../queries";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  createCampusAction,
  updateCampusAction,
  deleteCampusAction,
} from "../actions";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

type Props = {
  initialCampuses: CampusWithRelations[];
};

export function AdminCampusClientView({ initialCampuses }: Props) {
  const router = useRouter();
  const [campuses] = useState<CampusWithRelations[]>(initialCampuses);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCampus, setSelectedCampus] =
    useState<CampusWithRelations | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setName("");
    setCity("");
    setProvince("");
    setIsActive(true);
    setSelectedCampus(null);
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    const result = await createCampusAction({
      name,
      city,
      province,
      isActive,
    });

    setIsSubmitting(false);

    if (result.ok) {
      toast.success("Berhasil", {
        description: "Kampus berhasil ditambahkan",
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
    if (!selectedCampus) return;

    setIsSubmitting(true);
    const result = await updateCampusAction({
      id: selectedCampus.id,
      name,
      city,
      province,
      isActive,
    });

    setIsSubmitting(false);

    if (result.ok) {
      toast.success("Berhasil", {
        description: "Kampus berhasil diperbarui",
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
    if (!selectedCampus) return;

    setIsSubmitting(true);
    const result = await deleteCampusAction({ id: selectedCampus.id });

    setIsSubmitting(false);

    if (result.ok) {
      toast.success("Berhasil", {
        description: "Kampus berhasil dihapus",
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

  const openEditDialog = (campus: CampusWithRelations) => {
    setSelectedCampus(campus);
    setName(campus.name);
    setCity(campus.city);
    setProvince(campus.province);
    setIsActive(campus.isActive);
    setIsEditOpen(true);
  };

  const openDeleteDialog = (campus: CampusWithRelations) => {
    setSelectedCampus(campus);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kelola Kampus</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data kampus di platform Karta
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Kampus
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Kampus</TableHead>
              <TableHead>Kota</TableHead>
              <TableHead>Provinsi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Mahasiswa</TableHead>
              <TableHead>UMKM</TableHead>
              <TableHead>Kode Referral</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campuses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Belum ada data kampus
                </TableCell>
              </TableRow>
            ) : (
              campuses.map((campus) => (
                <TableRow key={campus.id}>
                  <TableCell className="font-medium">{campus.name}</TableCell>
                  <TableCell>{campus.city}</TableCell>
                  <TableCell>{campus.province}</TableCell>
                  <TableCell>
                    <Badge variant={campus.isActive ? "default" : "secondary"}>
                      {campus.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>{campus._count.students}</TableCell>
                  <TableCell>{campus._count.partnerUmkms}</TableCell>
                  <TableCell>{campus._count.referralCodes}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(campus)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(campus)}
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
            <DialogTitle>Tambah Kampus</DialogTitle>
            <DialogDescription>
              Tambahkan kampus baru ke dalam sistem
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nama Kampus</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Universitas Indonesia"
              />
            </div>
            <div>
              <Label htmlFor="city">Kota</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Jakarta"
              />
            </div>
            <div>
              <Label htmlFor="province">Provinsi</Label>
              <Input
                id="province"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="DKI Jakarta"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive">Kampus Aktif</Label>
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
            <DialogTitle>Edit Kampus</DialogTitle>
            <DialogDescription>
              Perbarui informasi kampus
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nama Kampus</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Universitas Indonesia"
              />
            </div>
            <div>
              <Label htmlFor="edit-city">Kota</Label>
              <Input
                id="edit-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Jakarta"
              />
            </div>
            <div>
              <Label htmlFor="edit-province">Provinsi</Label>
              <Input
                id="edit-province"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="DKI Jakarta"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="edit-isActive">Kampus Aktif</Label>
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
            <DialogTitle>Hapus Kampus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kampus &quot;{selectedCampus?.name}&quot;?
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
