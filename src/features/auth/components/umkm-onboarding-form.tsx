"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  umkmOnboardingSchema,
  type UmkmOnboardingInput,
} from "../schemas";
import { completeUmkmOnboardingAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";

export function UmkmOnboardingForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UmkmOnboardingInput>({
    resolver: zodResolver(umkmOnboardingSchema),
    defaultValues: {
      businessName: "",
      category: "",
      province: "",
      city: "",
      phone: "",
      description: "",
      logoUrl: "",
    },
  });

  const onSubmit = async (data: UmkmOnboardingInput) => {
    setServerError(null);
    const res = await completeUmkmOnboardingAction(data);
    if (!res.ok) {
      setServerError(res.error.message);
      return;
    }
    router.push("/umkm");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="p-4 rounded-md border border-destructive/40 bg-destructive/10 text-destructive text-sm flex items-start gap-2">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="border border-beige p-6 rounded-lg bg-white space-y-5">
        <div>
          <h2 className="font-heading text-lg font-semibold text-primary-brown">
            Profil Pelaku Usaha / UMKM
          </h2>
          <p className="text-xs text-primary-brown/70 font-sans mt-0.5">
            Informasi ini akan ditampilkan kepada mahasiswa yang melihat brief pekerjaan Anda.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="businessName">Nama Usaha / Bisnis</Label>
            <Input
              id="businessName"
              {...register("businessName")}
              placeholder="Contoh: Kopi Nusantara / Batik Lestari"
              className="mt-1.5"
            />
            {errors.businessName && (
              <p className="text-xs text-destructive mt-1">
                {errors.businessName.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="category">Kategori Usaha</Label>
            <Input
              id="category"
              {...register("category")}
              placeholder="Contoh: Makanan & Minuman / Fashion / Kerajinan"
              className="mt-1.5"
            />
            {errors.category && (
              <p className="text-xs text-destructive mt-1">
                {errors.category.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="province">Provinsi</Label>
              <Input
                id="province"
                {...register("province")}
                placeholder="Contoh: Jawa Barat"
                className="mt-1.5"
              />
              {errors.province && (
                <p className="text-xs text-destructive mt-1">
                  {errors.province.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="city">Kota / Kabupaten</Label>
              <Input
                id="city"
                {...register("city")}
                placeholder="Contoh: Kota Bandung"
                className="mt-1.5"
              />
              {errors.city && (
                <p className="text-xs text-destructive mt-1">
                  {errors.city.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Nomor Telepon / WhatsApp (Opsional)</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="081234567890"
              className="mt-1.5"
            />
            {errors.phone && (
              <p className="text-xs text-destructive mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Deskripsi Singkat Usaha (Opsional)</Label>
            <Textarea
              id="description"
              {...register("description")}
              rows={3}
              placeholder="Ceritakan produk, visi, atau bidang usaha Anda..."
              className="mt-1.5 resize-none text-xs"
            />
            {errors.description && (
              <p className="text-xs text-destructive mt-1">
                {errors.description.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-md bg-sage-green/15 border border-sage-green/40 text-xs text-primary-brown leading-relaxed">
        <strong>Benefit Langsung:</strong> Setelah menyelesaikan registrasi, Anda akan langsung mendapatkan <strong>3 kuota pekerjaan sukarela (Volunteer Project) gratis</strong> untuk bulan ini.
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 text-sm font-semibold tracking-wider"
      >
        {isSubmitting ? "Menyimpan Profil..." : "Selesaikan & Buka Dashboard UMKM"}
      </Button>
    </form>
  );
}

