import { z } from "zod";

export const createDealSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  stage: z.enum([
    "PROSPECT", "DECOUVERTE", "VISITE", "NEGOCIATION",
    "OFFRE", "COMPROMIS", "ACTE", "CLOTURE", "PERDU",
  ]).default("PROSPECT"),
  propertyId: z.string().optional(),
  contactId: z.string().optional(),
  searchRequestId: z.string().optional(),
  assignedToId: z.string().optional(),
  estimatedValue: z.number().positive().optional(),
  commission: z.number().positive().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  expectedCloseAt: z.string().optional(),
  propertyFoundById: z.string().optional(),
  dealClosedById: z.string().optional(),
  finderCommissionPct: z.number().min(0).max(100).optional(),
  closerCommissionPct: z.number().min(0).max(100).optional(),
});

export const updateDealSchema = createDealSchema.partial().extend({
  status: z.enum(["OUVERT", "EN_COURS", "GAGNE", "PERDU", "ANNULE"]).optional(),
  finalValue: z.number().positive().optional(),
  lostReason: z.string().optional(),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
