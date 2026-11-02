import { z } from "zod";

export const jobRoleEnum = z.enum([
  "DATA_ENTRY",
  "CONTENT_WRITER",
  "GRAPHIC_DESIGNER",
  "VIDEO_EDITOR",
  "SOCIAL_MEDIA",
  "FRONTEND_DEV",
  "UIUX_DESIGNER",
]);

export const studentLevelEnum = z.enum([
  "NEWCOMER",
  "RELIABLE",
  "TRUSTED",
  "EXPERT",
]);

export const deliverableTypeEnum = z.enum([
  "DRIVE",
  "DOCS",
  "FIGMA",
  "GITHUB",
  "CANVA",
  "NOTION",
  "OTHER",
]);

export const saveJobDraftSchema = z.object({
  id: z.string().optional(),
  title: z
    .string()
    .min(5, "Judul pekerjaan minimal 5 karakter.")
    .max(120, "Judul pekerjaan maksimal 120 karakter."),
  description: z.string().min(20, "Deskripsi pekerjaan minimal 20 karakter."),
  instructions: z.string().min(20, "Instruksi pengerjaan minimal 20 karakter."),
  role: jobRoleEnum,
  deliverableType: deliverableTypeEnum,
  deadlineAt: z.coerce.date(),
  minLevel: studentLevelEnum.default("NEWCOMER"),
  beginnerFriendly: z.boolean().default(false),
  criteria: z
    .array(z.string().trim().min(3, "Setiap kriteria minimal 3 karakter."))
    .min(1, "Wajib memiliki minimal 1 kriteria penerimaan.")
    .max(7, "Maksimal 7 kriteria penerimaan."),
});

export type SaveJobDraftInput = z.infer<typeof saveJobDraftSchema>;

export const publishJobSchema = z.object({
  jobId: z.string().min(1, "ID pekerjaan wajib disertakan."),
  subscriptionId: z.string().min(1, "Pilihan paket kuota langganan wajib dipilih."),
});

export type PublishJobInput = z.infer<typeof publishJobSchema>;

export const updateOpenJobSchema = z.object({
  jobId: z.string().min(1, "ID pekerjaan wajib disertakan."),
  title: z
    .string()
    .min(5, "Judul pekerjaan minimal 5 karakter.")
    .max(120, "Judul pekerjaan maksimal 120 karakter."),
  description: z.string().min(20, "Deskripsi pekerjaan minimal 20 karakter."),
  instructions: z.string().min(20, "Instruksi pengerjaan minimal 20 karakter."),
  deliverableType: deliverableTypeEnum,
  deadlineAt: z.coerce.date(),
  criteria: z
    .array(z.string().trim().min(3, "Setiap kriteria minimal 3 karakter."))
    .min(1, "Wajib memiliki minimal 1 kriteria penerimaan.")
    .max(7, "Maksimal 7 kriteria penerimaan."),
});

export type UpdateOpenJobInput = z.infer<typeof updateOpenJobSchema>;

export const cancelJobSchema = z.object({
  jobId: z.string().min(1, "ID pekerjaan wajib disertakan."),
  reason: z.string().max(255, "Alasan maksimal 255 karakter.").optional(),
});

export type CancelJobInput = z.infer<typeof cancelJobSchema>;

export const requestDeadlineChangeSchema = z.object({
  jobId: z.string().min(1, "ID pekerjaan wajib disertakan."),
  newDeadlineAt: z.coerce.date(),
  reason: z.string().min(10, "Alasan perpanjangan minimal 10 karakter.").max(255),
});

export type RequestDeadlineChangeInput = z.infer<typeof requestDeadlineChangeSchema>;

export const respondDeadlineChangeSchema = z.object({
  requestId: z.string().min(1, "ID permintaan wajib disertakan."),
  action: z.enum(["APPROVE", "DECLINE"]),
});

export type RespondDeadlineChangeInput = z.infer<typeof respondDeadlineChangeSchema>;

