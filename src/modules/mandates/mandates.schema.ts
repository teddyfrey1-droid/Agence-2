import { z } from "zod";

export const MANDATE_KINDS = [
  "SIMPLE",
  "EXCLUSIF",
  "SEMI_EXCLUSIF",
  "CO_MANDAT",
  "RECHERCHE",
] as const;

export const MANDATE_STATUSES = [
  "BROUILLON",
  "ENVOYE",
  "SIGNE",
  "EXPIRE",
  "ANNULE",
] as const;

export const createMandateSchema = z.object({
  kind: z.enum(MANDATE_KINDS).default("SIMPLE"),
  contactId: z.string().min(1, "Le client est obligatoire"),
  propertyId: z.string().optional().nullable(),
  startDate: z.string().min(1, "La date de début est obligatoire"),
  endDate: z.string().optional().nullable(),
  feesPercent: z.string().max(120).optional().nullable(),
  feesAmount: z.string().max(120).optional().nullable(),
  feesPayer: z.string().max(40).optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
});

export const updateMandateSchema = z.object({
  kind: z.enum(MANDATE_KINDS).optional(),
  status: z.enum(MANDATE_STATUSES).optional(),
  contactId: z.string().optional().nullable(),
  propertyId: z.string().optional().nullable(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  signedAt: z.string().optional().nullable(),
  feesPercent: z.string().max(120).optional().nullable(),
  feesAmount: z.string().max(120).optional().nullable(),
  feesPayer: z.string().max(40).optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
});

export type CreateMandateInput = z.infer<typeof createMandateSchema>;
export type UpdateMandateInput = z.infer<typeof updateMandateSchema>;
