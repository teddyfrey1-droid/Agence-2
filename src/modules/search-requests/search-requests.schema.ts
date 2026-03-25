import { z } from "zod";

export const createSearchRequestSchema = z.object({
  contactId: z.string().optional(),
  assignedToId: z.string().optional(),
  propertyTypes: z.array(z.string()).min(1, "Sélectionnez au moins un type"),
  transactionType: z.enum(["VENTE", "LOCATION", "CESSION_BAIL", "SOUS_LOCATION"]),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  surfaceMin: z.number().positive().optional(),
  surfaceMax: z.number().positive().optional(),
  districts: z.array(z.string()).default([]),
  quarters: z.array(z.string()).default([]),
  cities: z.array(z.string()).default(["Paris"]),
  needsExtraction: z.boolean().optional(),
  needsTerrace: z.boolean().optional(),
  needsParking: z.boolean().optional(),
  needsLoadingDock: z.boolean().optional(),
  floorPreference: z.string().optional(),
  activity: z.string().optional(),
  description: z.string().optional(),
  urgency: z.string().optional(),
  notes: z.string().optional(),
});

export const updateSearchRequestSchema = createSearchRequestSchema.partial();

export const publicSearchRequestSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  company: z.string().optional(),
  activity: z.string().optional(),
  propertyTypes: z.array(z.string()).min(1, "Sélectionnez au moins un type"),
  transactionType: z.enum(["VENTE", "LOCATION", "CESSION_BAIL", "SOUS_LOCATION"]),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  surfaceMin: z.number().positive().optional(),
  surfaceMax: z.number().positive().optional(),
  districts: z.array(z.string()).default([]),
  description: z.string().optional(),
  honeypot: z.string().max(0).optional(),
});

export type CreateSearchRequestInput = z.infer<typeof createSearchRequestSchema>;
export type UpdateSearchRequestInput = z.infer<typeof updateSearchRequestSchema>;
export type PublicSearchRequestInput = z.infer<typeof publicSearchRequestSchema>;
