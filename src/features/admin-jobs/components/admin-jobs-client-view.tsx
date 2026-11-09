"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { JobWithRelations } from "../queries";
import { JobStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { updateJobStatusAction } from "../actions";
import { toast } from "sonner";
import { Search, RefreshCw } from "lucide-react";

type Props = {
  initialJobs: JobWithRelations[];
};

export function AdminJobsClientView({ initialJobs }: Props) {
  const router = useRouter();
  const [jobs] = useState<JobWithRelations[]>(initialJobs);
  const [filteredJobs, setFilteredJobs] = useState<JobWithRelations[]>(initialJobs);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog states
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  
  const [selectedJob, setSelectedJob] = useState<JobWithRelations | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [newStatus, setNewStatus] = useState<JobStatus>(JobStatus.OPEN);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredJobs(jobs);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(lowerQuery) ||
        job.umkm.businessName.toLowerCase().includes(lowerQuery)
    );
    setFilteredJobs(filtered);
  };

  const handleUpdateStatus = async () => {
    if (!selectedJob) return;

    setIsSubmitting(true);
    const result = await updateJobStatusAction({
      jobId: selectedJob.id,
      status: newStatus,
    });

    setIsSubmitting(false);

    if (result.ok) {
      toast.success("Berhasil", {
        description: `Status pekerjaan berhasil diubah menjadi ${getStatusLabel(newStatus)}`,
      });
      setIsStatusDialogOpen(false);
      setSelectedJob(null);
      router.refresh();
    } else {
      toast.error("Gagal", { description: result.error.message });
    }
  };

  const openStatusDialog = (job: JobWithRelations) => {
    setSelectedJob(job);
    setNewStatus(job.status);
    setIsStatusDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "DRAFT": return "secondary";
      case "OPEN": return "default";
      case "CLAIMED":
      case "IN_PROGRESS": return "outline";
      case "SUBMITTED":
      case "REVISION_REQUESTED": return "outline";
      case "ACCEPTED": return "default";
      case "REJECTED":
      case "DISPUTED":
      case "CANCELLED":
      case "EXPIRED": return "destructive";
      default: return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      DRAFT: "Draft",
      OPEN: "Terbuka",
      CLAIMED: "Diklaim",
      IN_PROGRESS: "Berlangsung",
      SUBMITTED: "Dikirim",
      REVISION_REQUESTED: "Revisi",
      ACCEPTED: "Diterima",
      REJECTED: "Ditolak",
      DISPUTED: "Disengketakan",
      CANCELLED: "Dibatalkan",
      EXPIRED: "Kedaluwarsa",
    };
    return statusMap[status] || status;
  };

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      DATA_ENTRY: "Data Entry",
      CONTENT_WRITER: "Content Writer",
      GRAPHIC_DESIGNER: "Graphic Designer",
      VIDEO_EDITOR: "Video Editor",
      SOCIAL_MEDIA: "Social Media",
      FRONTEND_DEV: "Frontend Dev",
      UIUX_DESIGNER: "UI/UX Designer",
    };
    return roleMap[role] || role;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Moderasi Pekerjaan</h1>
        <p className="text-sm text-muted-foreground">
          Monitor dan moderasi status pekerjaan yang dibuat oleh UMKM
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari berdasarkan judul atau nama UMKM..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Pekerjaan</p>
          <p className="text-2xl font-bold">{jobs.length}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Terbuka</p>
          <p className="text-2xl font-bold">
            {jobs.filter((j) => j.status === JobStatus.OPEN).length}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Berlangsung</p>
          <p className="text-2xl font-bold">
            {jobs.filter((j) => j.status === JobStatus.IN_PROGRESS).length}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Selesai</p>
          <p className="text-2xl font-bold">
            {jobs.filter((j) => j.status === JobStatus.ACCEPTED).length}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Berbayar</p>
          <p className="text-2xl font-bold">
            {jobs.filter((j) => j.isPaid).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>UMKM</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {searchQuery ? "Tidak ada hasil pencarian" : "Belum ada pekerjaan"}
                </TableCell>
              </TableRow>
            ) : (
              filteredJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium max-w-xs truncate">{job.title}</TableCell>
                  <TableCell>{job.umkm.businessName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{job.jobRole?.label || "Unknown"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(job.status)}>
                      {getStatusLabel(job.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(job.deadlineAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openStatusDialog(job)}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Ubah Status
                    </Button>
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
            <DialogTitle>Ubah Status Pekerjaan</DialogTitle>
            <DialogDescription>
              Ubah status untuk pekerjaan <strong>{selectedJob?.title}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status Baru</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as JobStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="OPEN">Terbuka</SelectItem>
                  <SelectItem value="CLAIMED">Diklaim</SelectItem>
                  <SelectItem value="IN_PROGRESS">Berlangsung</SelectItem>
                  <SelectItem value="SUBMITTED">Dikirim</SelectItem>
                  <SelectItem value="REVISION_REQUESTED">Revisi Diminta</SelectItem>
                  <SelectItem value="ACCEPTED">Diterima</SelectItem>
                  <SelectItem value="REJECTED">Ditolak</SelectItem>
                  <SelectItem value="DISPUTED">Disengketakan</SelectItem>
                  <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                  <SelectItem value="EXPIRED">Kedaluarsa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsStatusDialogOpen(false); setSelectedJob(null); }}>
              Batal
            </Button>
            <Button onClick={handleUpdateStatus} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
