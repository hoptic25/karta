import { z } from "zod";

// Student onboarding schema
// Job roles are validated against database, not hardcoded enum
export const studentOnboardingSchema = z.object({
  fullName: z.string().min(1, "Nama lengkap wajib diisi."),
  referralCode: z
    .string()
    .min(1, "Kode referral kampus wajib diisi.")
    .toUpperCase(),
  studyProgram: z.string().min(1, "Program studi wajib diisi."),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter.")
    .max(30, "Username maksimal 30 karakter.")
    .regex(
      /^[a-z0-9-]+$/,
      "Username hanya boleh huruf kecil, angka, dan tanda hubung (-)."
    ),
  jobRoleIds: z
    .array(z.string())
    .min(1, "Pilih minimal 1 keahlian/peran pekerjaan."),
  bio: z.string().max(500, "Bio maksimal 500 karakter.").optional(),
  skills: z.array(z.string()).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export type StudentOnboardingInput = z.infer<typeof studentOnboardingSchema>;

// UMKM onboarding schema
export const umkmOnboardingSchema = z.object({
  businessName: z.string().min(1, "Nama usaha wajib diisi."),
  category: z.string().min(1, "Kategori usaha wajib diisi."),
  province: z.string().min(1, "Provinsi wajib diisi."),
  city: z.string().min(1, "Kota wajib diisi."),
  phone: z.string().optional(),
  description: z.string().max(1000).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

export type UmkmOnboardingInput = z.infer<typeof umkmOnboardingSchema>;
