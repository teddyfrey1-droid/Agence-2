import { prisma } from "@/lib/prisma";
import { APP_NAME } from "@/lib/constants";

export type AgencyInfo = {
  id: string | null;
  name: string;
  legalName: string | null;
  legalForm: string | null;
  siret: string | null;
  capitalSocial: string | null;
  rcs: string | null;
  tvaNumber: string | null;
  apeCode: string | null;
  address: string | null;
  city: string | null;
  zipCode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  professionalCardNumber: string | null;
  professionalCardAuthority: string | null;
  financialGuarantee: string | null;
  professionalInsurance: string | null;
  publicationDirector: string | null;
  mediator: string | null;
  dpoContact: string | null;
};

const FALLBACK: AgencyInfo = {
  id: null,
  name: APP_NAME,
  legalName: null,
  legalForm: null,
  siret: null,
  capitalSocial: null,
  rcs: null,
  tvaNumber: null,
  apeCode: null,
  address: null,
  city: "Paris",
  zipCode: null,
  phone: null,
  email: "contact@retailavenue.fr",
  website: null,
  description: null,
  professionalCardNumber: null,
  professionalCardAuthority: null,
  financialGuarantee: null,
  professionalInsurance: null,
  publicationDirector: null,
  mediator: null,
  dpoContact: null,
};

/**
 * Returns the primary agency record, creating a default one if none exists.
 * Falls back silently to hard-coded defaults if the database is unreachable
 * (e.g. public pages during build).
 */
export async function getAgencyInfo(): Promise<AgencyInfo> {
  try {
    let agency = await prisma.agency.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!agency) {
      agency = await prisma.agency.create({
        data: {
          name: APP_NAME,
          city: "Paris",
          email: "contact@retailavenue.fr",
        },
      });
    }

    return {
      id: agency.id,
      name: agency.name || APP_NAME,
      legalName: agency.legalName,
      legalForm: agency.legalForm,
      siret: agency.siret,
      capitalSocial: agency.capitalSocial,
      rcs: agency.rcs,
      tvaNumber: agency.tvaNumber,
      apeCode: agency.apeCode,
      address: agency.address,
      city: agency.city,
      zipCode: agency.zipCode,
      phone: agency.phone,
      email: agency.email,
      website: agency.website,
      description: agency.description,
      professionalCardNumber: agency.professionalCardNumber,
      professionalCardAuthority: agency.professionalCardAuthority,
      financialGuarantee: agency.financialGuarantee,
      professionalInsurance: agency.professionalInsurance,
      publicationDirector: agency.publicationDirector,
      mediator: agency.mediator,
      dpoContact: agency.dpoContact,
    };
  } catch {
    return FALLBACK;
  }
}

/**
 * Helper to display a value or a placeholder for unfilled legal fields.
 */
export function orPlaceholder(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  return v.length > 0 ? v : "à compléter";
}
