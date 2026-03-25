import { z } from "zod";

export const createContactSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  type: z.enum([
    "PROPRIETAIRE", "LOCATAIRE", "ACQUEREUR", "BAILLEUR",
    "APPORTEUR", "ENSEIGNE", "MANDATAIRE", "NOTAIRE", "ARCHITECTE", "AUTRE",
  ]).default("AUTRE"),
  source: z.enum([
    "SITE_WEB", "TELEPHONE", "EMAIL", "RECOMMANDATION",
    "PROSPECTION", "RESEAU", "ANNONCE", "AUTRE",
  ]).default("AUTRE"),
  company: z.string().optional(),
  position: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
});

export const updateContactSchema = createContactSchema.partial();

// Public form schema (site web)
export const publicContactFormSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
  honeypot: z.string().max(0).optional(), // Anti-spam
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type PublicContactFormInput = z.infer<typeof publicContactFormSchema>;
