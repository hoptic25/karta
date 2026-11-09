"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JobRole } from "@/generated/prisma/client";
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
import { Textarea } from "@/components/ui/textarea";
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
  createJobRoleAction,
  updateJobRoleAction,
  deleteJobRoleAction,
} from "../actions";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

type Props = {
  initialRoles: JobRole[];
};

export function AdminJobRolesClientView({ initialRoles }: Props) {
  const router = useRouter();
  const [roles] = useState<JobRole[]>(initialRoles);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<JobRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  const resetForm = () => {
    setLabel("");
    setDescription("");
    setIsActive(true);
    setSortOrder(0);
    setSelectedRole(null);
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    const result = await createJobRoleAction({
      label,
      description,
      sortOrder,
    });

    setIsSubmitting(false);

    if (result.ok) {
      toast.success("Berhasil", {
        description: "Jenis pekerjaan berhasil ditambahkan",
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
    if (!selectedRole) return;

    setIsSubmitting(true);
    const result = await updateJobRoleAction({
      id: selectedRole.id,
      label,
      description,
      isActive,
    });

    setIsSubmitting(false);

    if (result.ok) {
      toast.success("Berhasil", {
        description: "Jenis pekerjaan berhasil diperbarui",
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
    if (!selectedRole) return;

    setIsSubmitting(true);
    const result = await deleteJobRoleAction({ id: selectedRole.id });

    setIsSubmitting(false);

    if (result.ok) {
      toast.success("Berhasil", {
        description: "Jenis pekerjaan berhasil dinonaktifkan",
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

  const openEditDialog = (role: JobRole) => {
    setSelectedRole(role);
    setLabel(role.label);
    setDescription(role.description || "");
    setIsActive(role.isActive);
    setIsEditOpen(true);
  };

  const openDeleteDialog = (role: JobRole) => {
    setSelectedRole(role);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kelola Jenis Pekerjaan</h1>
          <p className="text-sm text-muted-foreground">
            Kelola kategori/role pekerjaan yang tersedia di platform
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Jenis Pekerjaan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Jenis</p>
          <p className="text-2xl font-bold">{roles.length}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Aktif</p>
          <p className="text-2xl font-bold">
            {roles.filter((r) => r.isActive).length}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Nonaktif</p>
          <p className="text-2xl font-bold">
            {roles.filter((r) => !r.isActive).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  Belum ada jenis pekerjaan
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-mono font-medium">
                    {role.key}
                  </TableCell>
                  <TableCell className="font-medium">{role.label}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {role.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.isActive ? "default" : "secondary"}>
                      {role.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(role)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {role.isActive && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(role)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
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
            <DialogTitle>Tambah Jenis Pekerjaan</DialogTitle>
            <DialogDescription>
              Tambahkan kategori/role pekerjaan baru
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="label">Label *</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Content Creator"
              />
            </div>
            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Pekerjaan pembuatan konten..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive">Aktif</Label>
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
            <DialogTitle>Edit Jenis Pekerjaan</DialogTitle>
            <DialogDescription>
              Perbarui informasi jenis pekerjaan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Kode (Auto-generate, tidak dapat diubah)</Label>
              <Input 
                value={selectedRole?.key || "(akan di-generate otomatis)"} 
                disabled 
                className="font-mono" 
              />
            </div>
            <div>
              <Label htmlFor="edit-label">Label</Label>
              <Input
                id="edit-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Deskripsi</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="edit-isActive">Aktif</Label>
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
            <DialogTitle>Nonaktifkan Jenis Pekerjaan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menonaktifkan &quot;{selectedRole?.label}&quot;?
              Role ini tidak akan bisa dipilih untuk pekerjaan baru.
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
              {isSubmitting ? "Menonaktifkan..." : "Nonaktifkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
