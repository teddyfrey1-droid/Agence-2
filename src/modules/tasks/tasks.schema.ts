import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z.string().optional(),
  priority: z.enum(["BASSE", "NORMALE", "HAUTE", "URGENTE"]).default("NORMALE"),
  dueDate: z.string().optional(),
  assignedToId: z.string().optional(),
  contactId: z.string().optional(),
  propertyId: z.string().optional(),
  searchRequestId: z.string().optional(),
  dealId: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(["A_FAIRE", "EN_COURS", "TERMINEE", "ANNULEE"]).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
