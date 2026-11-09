import { z } from "zod";

export const createCampusSchema = z.object({
  name: z.string().min(1, "Nama kampus harus diisi").max(255),
  city: z.string().min(1, "Kota harus diisi").max(100),
  province: z.string().min(1, "Provinsi harus diisi").max(100),
  isActive: z.boolean().default(true),
});

export const updateCampusSchema = z.object({
  id: z.string().uuid("ID kampus tidak valid"),
  name: z.string().min(1, "Nama kampus harus diisi").max(255).optional(),
  city: z.string().min(1, "Kota harus diisi").max(100).optional(),
  province: z.string().min(1, "Provinsi harus diisi").max(100).optional(),
  isActive: z.boolean().optional(),
});

export const deleteCampusSchema = z.object({
  id: z.string().uuid("ID kampus tidak valid"),
});

export type CreateCampusInput = z.infer<typeof createCampusSchema>;
export type UpdateCampusInput = z.infer<typeof updateCampusSchema>;
export type DeleteCampusInput = z.infer<typeof deleteCampusSchema>;
