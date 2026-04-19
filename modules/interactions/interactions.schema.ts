import { z } from "zod";

export const createInteractionSchema = z.object({
  type: z.enum([
    "APPEL_ENTRANT", "APPEL_SORTANT", "EMAIL_ENTRANT", "EMAIL_SORTANT",
    "VISITE", "REUNION", "NOTE", "SMS", "COURRIER", "AUTRE",
  ]),
  subject: z.string().optional(),
  content: z.string().optional(),
  date: z.string().optional(),
  contactId: z.string().optional(),
  propertyId: z.string().optional(),
  searchRequestId: z.string().optional(),
  dealId: z.string().optional(),
});

export type CreateInteractionInput = z.infer<typeof createInteractionSchema>;
