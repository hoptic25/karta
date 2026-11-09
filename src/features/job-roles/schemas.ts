import { z } from "zod";

// Key is auto-generated from label, no longer user input
export const createJobRoleSchema = z.object({
  label: z.string().min(3, "Label minimal 3 karakter").max(100),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateJobRoleSchema = z.object({
  id: z.string().cuid("ID tidak valid"),
  label: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const deleteJobRoleSchema = z.object({
  id: z.string().cuid("ID tidak valid"),
});

export type CreateJobRoleInput = z.infer<typeof createJobRoleSchema>;
export type UpdateJobRoleInput = z.infer<typeof updateJobRoleSchema>;
export type DeleteJobRoleInput = z.infer<typeof deleteJobRoleSchema>;
