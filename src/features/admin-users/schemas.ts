import { z } from "zod";

export const updateUserStatusSchema = z.object({
  userId: z.string().uuid("User ID tidak valid"),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().uuid("User ID tidak valid"),
  role: z.enum(["STUDENT", "UMKM", "ADMIN"]),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
