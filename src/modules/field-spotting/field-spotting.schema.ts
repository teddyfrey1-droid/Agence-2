import { z } from "zod";

export const createFieldSpottingSchema = z.object({
  address: z.string().min(3, "L'adresse est requise"),
  city: z.string().default("Paris"),
  zipCode: z.string().optional(),
  district: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  photoUrl: z.string().optional(),
  notes: z.string().optional(),
  propertyType: z.enum([
    "BOUTIQUE", "BUREAU", "LOCAL_COMMERCIAL", "LOCAL_ACTIVITE",
    "RESTAURANT", "HOTEL", "ENTREPOT", "PARKING", "TERRAIN", "IMMEUBLE", "AUTRE",
  ]).optional(),
  surface: z.number().positive().optional(),
  assignedToId: z.string().optional(),
});

export const updateFieldSpottingSchema = createFieldSpottingSchema.partial().extend({
  status: z.enum(["REPERE", "A_QUALIFIER", "QUALIFIE", "CONVERTI", "REJETE"]).optional(),
});

export type CreateFieldSpottingInput = z.infer<typeof createFieldSpottingSchema>;
export type UpdateFieldSpottingInput = z.infer<typeof updateFieldSpottingSchema>;
