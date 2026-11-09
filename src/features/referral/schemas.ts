import { z } from "zod";

export const createReferralCodeSchema = z.object({
  code: z
    .string()
    .min(3, "Kode minimal 3 karakter")
    .max(50, "Kode maksimal 50 karakter")
    .regex(/^[A-Z0-9_-]+$/, "Kode hanya boleh huruf besar, angka, underscore, dan dash"),
  campusId: z.string().uuid("Campus ID tidak valid"),
  isActive: z.boolean().default(true),
  expiresAt: z.string().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
});

export const updateReferralCodeSchema = z.object({
  id: z.string().uuid("ID tidak valid"),
  code: z
    .string()
    .min(3, "Kode minimal 3 karakter")
    .max(50, "Kode maksimal 50 karakter")
    .regex(/^[A-Z0-9_-]+$/, "Kode hanya boleh huruf besar, angka, underscore, dan dash")
    .optional(),
  campusId: z.string().uuid("Campus ID tidak valid").optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
});

export const deleteReferralCodeSchema = z.object({
  id: z.string().uuid("ID tidak valid"),
});

export type CreateReferralCodeInput = z.infer<typeof createReferralCodeSchema>;
export type UpdateReferralCodeInput = z.infer<typeof updateReferralCodeSchema>;
export type DeleteReferralCodeInput = z.infer<typeof deleteReferralCodeSchema>;
