"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserWithProfiles } from "../queries";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import { Input } from "@/components/ui/input";
import {
  updateUserStatusAction,
  updateUserRoleAction,
} from "../actions";
import { toast } from "sonner";
import { Ban, UserCog, Search } from "lucide-react";

type Props = {
  initialUsers: UserWithProfiles[];
  currentUserId: string;
};

export function AdminUsersClientView({ initialUsers, currentUserId }: Props) {
  const router = useRouter();
  const [users] = useState<UserWithProfiles[]>(initialUsers);
  const [filteredUsers, setFilteredUsers] = useState<UserWithProfiles[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithProfiles | null>(
    null
  );
  const [newStatus, setNewStatus] = useState<"ACTIVE" | "SUSPENDED">("ACTIVE");
  const [newRole, setNewRole] = useState<"STUDENT" | "UMKM" | "ADMIN">(
    "STUDENT"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredUsers(users);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.email.toLowerCase().includes(lowerQuery) ||
        user.name?.toLowerCase().includes(lowerQuery)
    );
    setFilteredUsers(filtered);
  };

  const openStatusDialog = (user: UserWithProfiles) => {
    setSelectedUser(user);
    setNewStatus(user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE");
    setIsStatusDialogOpen(true);
  };

  const openRoleDialog = (user: UserWithProfiles) => {
    setSelectedUser(user);
    setNewRole(user.role ?? "STUDENT");
    setIsRoleDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    const result = await updateUserStatusAction({
      userId: selectedUser.id,
      status: newStatus,
    });

    setIsSubmitting(false);

    if (result.ok) {
      toast.success("Berhasil", {
        description: `Status user berhasil diubah menjadi ${newStatus}`,
      });
      setIsStatusDialogOpen(false);
      setSelectedUser(null);
      router.refresh();
    } else {
      toast.error("Gagal", {
        description: result.error.message,
      });
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    const result = await updateUserRoleAction({
      userId: selectedUser.id,
      role: newRole,
    });

    setIsSubmitting(false);

    if (result.ok) {
      toast.success("Berhasil", {
        description: `Role user berhasil diubah menjadi ${newRole}`,
      });
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
      router.refresh();
    } else {
      toast.error("Gagal", {
        description: result.error.message,
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "UMKM":
        return "default";
      case "STUDENT":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "UMKM":
        return "UMKM";
      case "STUDENT":
        return "Mahasiswa";
      default:
        return role;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kelola Pengguna</h1>
          <p className="text-sm text-muted-foreground">
            Kelola akun pengguna platform Karta
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari berdasarkan email atau nama..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Pengguna</p>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Mahasiswa</p>
          <p className="text-2xl font-bold">
            {users.filter((u) => u.role === "STUDENT").length}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">UMKM</p>
          <p className="text-2xl font-bold">
            {users.filter((u) => u.role === "UMKM").length}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Suspended</p>
          <p className="text-2xl font-bold">
            {users.filter((u) => u.status === "SUSPENDED").length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email Kampus</TableHead>
              <TableHead>Terdaftar</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  {searchQuery ? "Tidak ada hasil pencarian" : "Belum ada pengguna"}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.name ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role ?? "")}>
                      {getRoleLabel(user.role ?? "")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.status === "ACTIVE" ? "default" : "destructive"
                      }
                    >
                      {user.status === "ACTIVE" ? "Aktif" : "Suspended"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.isCampusEmail ? (
                      <Badge variant="outline">Ya</Badge>
                    ) : (
                      <Badge variant="secondary">Tidak</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openRoleDialog(user)}
                        disabled={user.id === currentUserId}
                      >
                        <UserCog className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openStatusDialog(user)}
                        disabled={user.id === currentUserId}
                      >
                        <Ban
                          className={`h-4 w-4 ${
                            user.status === "SUSPENDED"
                              ? "text-green-600"
                              : "text-destructive"
                          }`}
                        />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Status Pengguna</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin{" "}
              {newStatus === "SUSPENDED" ? "suspend" : "mengaktifkan kembali"}{" "}
              akun <strong>{selectedUser?.email}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsStatusDialogOpen(false);
                setSelectedUser(null);
              }}
            >
              Batal
            </Button>
            <Button
              variant={newStatus === "SUSPENDED" ? "destructive" : "default"}
              onClick={handleUpdateStatus}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Memproses..." : "Konfirmasi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Role Pengguna</DialogTitle>
            <DialogDescription>
              Ubah role untuk <strong>{selectedUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">Role Baru</Label>
              <Select
                value={newRole}
                onValueChange={(value) =>
                  setNewRole(value as "STUDENT" | "UMKM" | "ADMIN")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Mahasiswa</SelectItem>
                  <SelectItem value="UMKM">UMKM</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRoleDialogOpen(false);
                setSelectedUser(null);
              }}
            >
              Batal
            </Button>
            <Button onClick={handleUpdateRole} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
