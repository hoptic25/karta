import { z } from "zod";

export const jobRolesEnum = [
  "DATA_ENTRY",
  "CONTENT_WRITER",
  "GRAPHIC_DESIGNER",
  "VIDEO_EDITOR",
  "SOCIAL_MEDIA",
  "FRONTEND_DEV",
  "UIUX_DESIGNER",
] as const;

export const studentOnboardingSchema = z.object({
  fullName: z
    .string()
    .min(2, "Nama minimal 2 karakter.")
    .max(100, "Nama maksimal 100 karakter.")
    .optional()
    .or(z.literal("")),
  referralCode: z
    .string()
    .min(3, "Kode referral minimal 3 karakter.")
    .max(30, "Kode referral maksimal 30 karakter."),
  studyProgram: z
    .string()
    .min(2, "Program studi minimal 2 karakter.")
    .max(100, "Program studi maksimal 100 karakter."),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter.")
    .max(30, "Username maksimal 30 karakter.")
    .regex(
      /^[a-z0-9-]+$/,
      "Username hanya boleh huruf kecil, angka, dan tanda hubung (-)."
    ),
  roles: z
    .array(z.enum(jobRolesEnum))
    .min(1, "Pilih minimal 1 keahlian/peran pekerjaan."),
  bio: z.string().max(500, "Bio maksimal 500 karakter.").optional(),
  skills: z.array(z.string()).optional(),
  avatarUrl: z.string().url("URL foto tidak valid.").optional().or(z.literal("")),
});

export type StudentOnboardingInput = z.infer<typeof studentOnboardingSchema>;

export const umkmOnboardingSchema = z.object({
  businessName: z
    .string()
    .min(2, "Nama usaha minimal 2 karakter.")
    .max(120, "Nama usaha maksimal 120 karakter."),
  category: z
    .string()
    .min(2, "Kategori usaha minimal 2 karakter.")
    .max(60, "Kategori usaha maksimal 60 karakter."),
  province: z
    .string()
    .min(2, "Provinsi minimal 2 karakter.")
    .max(60, "Provinsi maksimal 60 karakter."),
  city: z
    .string()
    .min(2, "Kota/Kabupaten minimal 2 karakter.")
    .max(60, "Kota/Kabupaten maksimal 60 karakter."),
  description: z
    .string()
    .max(1000, "Deskripsi usaha maksimal 1000 karakter.")
    .optional(),
  phone: z
    .string()
    .max(20, "Nomor telepon maksimal 20 digit.")
    .optional(),
  logoUrl: z.string().url("URL logo tidak valid.").optional().or(z.literal("")),
});

export type UmkmOnboardingInput = z.infer<typeof umkmOnboardingSchema>;
