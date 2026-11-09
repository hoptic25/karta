import { z } from "zod";

export const createJobSchema = z.object({
  umkmId: z.string().uuid("UMKM ID tidak valid"),
  title: z.string().min(5, "Judul minimal 5 karakter").max(120),
  description: z.string().min(20, "Deskripsi minimal 20 karakter"),
  instructions: z.string().min(20, "Instruksi minimal 20 karakter"),
  jobRoleId: z.string().min(1, "Pilih peran pekerjaan"),
  deliverableType: z.string().min(1),
  deadlineAt: z.string(),
  minLevel: z.enum(["NEWCOMER", "RELIABLE", "TRUSTED", "EXPERT"]).default("NEWCOMER"),
  beginnerFriendly: z.boolean().default(false),
  isPaid: z.boolean().default(false),
  allocationIdr: z.number().int().min(0).default(0),
});

export const updateJobSchema = z.object({
  id: z.string().uuid("Job ID tidak valid"),
  title: z.string().min(5).max(120).optional(),
  description: z.string().min(20).optional(),
  instructions: z.string().min(20).optional(),
  jobRoleId: z.string().min(1).optional(),
  deliverableType: z.string().optional(),
  deadlineAt: z.string().optional(),
  minLevel: z.enum(["NEWCOMER", "RELIABLE", "TRUSTED", "EXPERT"]).optional(),
  beginnerFriendly: z.boolean().optional(),
  isPaid: z.boolean().optional(),
  allocationIdr: z.number().int().min(0).optional(),
});

export const deleteJobSchema = z.object({
  id: z.string().uuid("Job ID tidak valid"),
});

export const updateJobStatusSchema = z.object({
  jobId: z.string().uuid("Job ID tidak valid"),
  status: z.enum([
    "DRAFT",
    "OPEN",
    "CLAIMED",
    "IN_PROGRESS",
    "SUBMITTED",
    "REVISION_REQUESTED",
    "ACCEPTED",
    "REJECTED",
    "DISPUTED",
    "CANCELLED",
    "EXPIRED",
  ]),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type DeleteJobInput = z.infer<typeof deleteJobSchema>;
export type UpdateJobStatusInput = z.infer<typeof updateJobStatusSchema>;
