import { z } from "zod";

export const createPropertySchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  type: z.enum([
    "BOUTIQUE", "BUREAU", "LOCAL_COMMERCIAL", "LOCAL_ACTIVITE",
    "RESTAURANT", "HOTEL", "ENTREPOT", "PARKING", "TERRAIN", "IMMEUBLE", "AUTRE",
  ]),
  transactionType: z.enum(["VENTE", "LOCATION", "CESSION_BAIL", "FOND_DE_COMMERCE"]),
  status: z.enum([
    "BROUILLON", "ACTIF", "EN_NEGOCIATION", "SOUS_COMPROMIS",
    "VENDU", "LOUE", "RETIRE", "ARCHIVE",
  ]).optional(),
  confidentiality: z.enum(["PUBLIC", "RESTREINT", "CONFIDENTIEL"]).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().default("Paris"),
  zipCode: z.string().optional(),
  district: z.string().optional(),
  quarter: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  surfaceMin: z.number().positive().optional(),
  surfaceMax: z.number().positive().optional(),
  surfaceTotal: z.number().positive().optional(),
  floor: z.number().int().optional(),
  totalFloors: z.number().int().positive().optional(),
  facadeLength: z.number().positive().optional(),
  ceilingHeight: z.number().positive().optional(),
  hasExtraction: z.boolean().default(false),
  hasTerrace: z.boolean().default(false),
  hasParking: z.boolean().default(false),
  hasLoadingDock: z.boolean().default(false),
  price: z.number().positive().optional(),
  rentMonthly: z.number().positive().optional(),
  rentYearly: z.number().positive().optional(),
  charges: z.number().positive().optional(),
  deposit: z.number().positive().optional(),
  fees: z.number().positive().optional(),
  ownerId: z.string().optional(),
  assignedToId: z.string().optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
