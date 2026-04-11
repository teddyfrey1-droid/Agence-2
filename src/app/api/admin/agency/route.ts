import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActiveSession } from "@/lib/auth";
import { APP_NAME } from "@/lib/constants";

const optionalString = z
  .string()
  .trim()
  .max(500, "Valeur trop longue")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v == null || v === "" ? null : v));

const optionalEmail = z
  .string()
  .trim()
  .max(320)
  .email("Email invalide")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v == null || v === "" ? null : v));

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .url("URL invalide")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v == null || v === "" ? null : v));

const agencySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Le nom est obligatoire")
    .max(200, "Nom trop long"),
  legalName: optionalString,
  legalForm: optionalString,
  siret: optionalString,
  capitalSocial: optionalString,
  rcs: optionalString,
  tvaNumber: optionalString,
  apeCode: optionalString,
  address: optionalString,
  city: optionalString,
  zipCode: optionalString,
  phone: optionalString,
  email: optionalEmail,
  website: optionalUrl,
  description: optionalString,
  professionalCardNumber: optionalString,
  professionalCardAuthority: optionalString,
  financialGuarantee: optionalString,
  professionalInsurance: optionalString,
  publicationDirector: optionalString,
  mediator: optionalString,
  dpoContact: optionalString,
});

async function getOrCreatePrimaryAgency() {
  const existing = await prisma.agency.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;
  return prisma.agency.create({
    data: {
      name: APP_NAME,
      city: "Paris",
      email: "contact@retailavenue.fr",
    },
  });
}

export async function GET() {
  const session = await getActiveSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!["SUPER_ADMIN", "DIRIGEANT", "ASSOCIE"].includes(session.role)) {
    return NextResponse.json(
      { error: "Permissions insuffisantes" },
      { status: 403 }
    );
  }

  const agency = await getOrCreatePrimaryAgency();
  return NextResponse.json(agency);
}

export async function PUT(request: NextRequest) {
  const session = await getActiveSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!["SUPER_ADMIN", "DIRIGEANT"].includes(session.role)) {
    return NextResponse.json(
      { error: "Permissions insuffisantes" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = agencySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Données invalides",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const current = await getOrCreatePrimaryAgency();

  const updated = await prisma.agency.update({
    where: { id: current.id },
    data: parsed.data,
  });

  await prisma.auditLog.create({
    data: {
      userId: session.userId,
      action: "UPDATE",
      entity: "Agency",
      entityId: updated.id,
      details: "Mise à jour des informations de l'agence",
    },
  });

  return NextResponse.json(updated);
}
