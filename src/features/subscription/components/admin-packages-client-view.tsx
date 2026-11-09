"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePackageAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/format";
import type { Package } from "@/generated/prisma/client";
import { CheckCircle2, AlertCircle, Edit2, X, Save, Layers } from "lucide-react";

interface AdminPackagesClientViewProps {
  packages: Package[];
}

export function AdminPackagesClientView({ packages }: AdminPackagesClientViewProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    priceIdr: number;
    jobQuota: number;
    allocationPerJobIdr: number;
    isActive: boolean;
  } | null>(null);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const startEditing = (pkg: Package) => {
    setEditingId(pkg.id);
    setEditForm({
      priceIdr: pkg.priceIdr,
      jobQuota: pkg.jobQuota,
      allocationPerJobIdr: pkg.allocationPerJobIdr,
      isActive: pkg.isActive,
    });
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSave = async (packageId: string) => {
    if (!editForm) return;

    setSavingId(packageId);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await updatePackageAction({
      packageId,
      priceIdr: Number(editForm.priceIdr),
      jobQuota: Number(editForm.jobQuota),
      allocationPerJobIdr: Number(editForm.allocationPerJobIdr),
      isActive: editForm.isActive,
    });

    setSavingId(null);
    if (!res.ok) {
      setErrorMessage(res.error.message);
      return;
    }

    setSuccessMessage("Paket berhasil diperbarui.");
    setEditingId(null);
    setEditForm(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>{successMessage}</div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-earth-sand/30 bg-white shadow-sm">
        <table className="w-full text-left text-sm text-earth-coffee">
          <thead className="border-b border-earth-sand/20 bg-earth-cream/40 font-heading text-xs uppercase tracking-wider text-earth-coffee/70">
            <tr>
              <th className="px-6 py-4">Kode & Nama</th>
              <th className="px-6 py-4">Harga (IDR)</th>
              <th className="px-6 py-4">Kuota Job</th>
              <th className="px-6 py-4">Alokasi / Job</th>
              <th className="px-6 py-4">Masa Berlaku</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-earth-sand/20">
            {packages.map((pkg) => {
              const isEditing = editingId === pkg.id;

              return (
                <tr key={pkg.id} className="hover:bg-earth-cream/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-earth-primary shrink-0" />
                      <div>
                        <div className="font-heading font-bold text-earth-coffee">
                          {pkg.name}
                        </div>
                        <div className="text-xs text-earth-coffee/60 font-mono">
                          {pkg.code}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {isEditing && editForm ? (
                      <Input
                        type="number"
                        min="0"
                        value={editForm.priceIdr}
                        onChange={(e) =>
                          setEditForm({ ...editForm, priceIdr: parseInt(e.target.value) || 0 })
                        }
                        className="w-32 text-sm"
                      />
                    ) : (
                      <span className="font-semibold text-earth-primary">
                        {pkg.priceIdr === 0 ? "Gratis" : formatRupiah(pkg.priceIdr)}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {isEditing && editForm ? (
                      <Input
                        type="number"
                        min="1"
                        value={editForm.jobQuota}
                        onChange={(e) =>
                          setEditForm({ ...editForm, jobQuota: parseInt(e.target.value) || 1 })
                        }
                        className="w-20 text-sm"
                      />
                    ) : (
                      <span>{pkg.jobQuota} tugas</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {isEditing && editForm ? (
                      <Input
                        type="number"
                        min="0"
                        value={editForm.allocationPerJobIdr}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            allocationPerJobIdr: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-32 text-sm"
                      />
                    ) : (
                      <span>{formatRupiah(pkg.allocationPerJobIdr)}</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-xs text-earth-coffee/70">
                    {pkg.durationDays} hari
                  </td>

                  <td className="px-6 py-4">
                    {isEditing && editForm ? (
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={editForm.isActive}
                          onChange={(e) =>
                            setEditForm({ ...editForm, isActive: e.target.checked })
                          }
                          className="rounded border-earth-sand text-earth-primary focus:ring-earth-primary"
                        />
                        <span>Aktif</span>
                      </label>
                    ) : pkg.isActive ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700">
                        Nonaktif
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditing}
                          disabled={savingId === pkg.id}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSave(pkg.id)}
                          disabled={savingId === pkg.id}
                          className="gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Simpan
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEditing(pkg)}
                        className="gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Ubah
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

