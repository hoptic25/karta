import { z } from "zod";

export const selectPackageSchema = z.object({
  packageId: z.string().min(1, "Paket wajib dipilih."),
});

export const markSubscriptionPaidSchema = z.object({
  subscriptionId: z.string().min(1, "ID langganan wajib disertakan."),
  paymentNote: z.string().max(255, "Catatan maksimal 255 karakter.").optional(),
});

export const adminCancelSubscriptionSchema = z.object({
  subscriptionId: z.string().min(1, "ID langganan wajib disertakan."),
  reason: z.string().min(5, "Alasan pembatalan minimal 5 karakter.").max(255),
});

export const updatePackageSchema = z.object({
  packageId: z.string().min(1, "ID paket wajib disertakan."),
  priceIdr: z.number().int().min(0, "Harga tidak boleh negatif.").optional(),
  jobQuota: z.number().int().min(1, "Kuota minimal 1.").optional(),
  allocationPerJobIdr: z.number().int().min(0, "Alokasi tidak boleh negatif.").optional(),
  isActive: z.boolean().optional(),
});

