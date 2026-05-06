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

// Public form schema (site web).
// firstName/lastName are optional — the reduced inline form on the home
// page only collects email + message + consent. The agent qualifies
// identity on the first call. When missing, the service derives a
// placeholder from the email prefix.
export const publicContactFormSchema = z.object({
  firstName: z.string().min(1).optional().or(z.literal("")),
  lastName: z.string().min(1).optional().or(z.literal("")),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
  /** Where on the site the form was submitted from — for analytics */
  source: z.enum(["contact-page", "home-inline", "biens-detail", "footer"]).optional(),
  honeypot: z.string().max(0).optional(), // Anti-spam
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type PublicContactFormInput = z.infer<typeof publicContactFormSchema>;
