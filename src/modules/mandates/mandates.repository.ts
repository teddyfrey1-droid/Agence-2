import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/utils";
import type { Prisma, MandateStatus } from "@prisma/client";

export interface MandateFilters {
  status?: string;
  kind?: string;
  contactId?: string;
  propertyId?: string;
  search?: string;
  expiringWithinDays?: number;
}

const MANDATE_INCLUDE = {
  contact: {
    select: { id: true, firstName: true, lastName: true, company: true, email: true, phone: true },
  },
  property: {
    select: { id: true, title: true, reference: true, address: true, city: true, district: true },
  },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
  deal: { select: { id: true, reference: true, title: true, stage: true } },
} satisfies Prisma.MandateInclude;

export async function findMandates(
  filters: MandateFilters = {},
  page = 1,
  perPage = 20
) {
  const where: Prisma.MandateWhereInput = {};

  if (filters.status) where.status = filters.status as MandateStatus;
  if (filters.kind) where.kind = filters.kind;
  if (filters.contactId) where.contactId = filters.contactId;
  if (filters.propertyId) where.propertyId = filters.propertyId;
  if (filters.expiringWithinDays != null) {
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + filters.expiringWithinDays);
    where.endDate = { gte: new Date(), lte: horizon };
    where.status = { in: ["ENVOYE", "SIGNE"] };
  }
  if (filters.search) {
    where.OR = [
      { reference: { contains: filters.search, mode: "insensitive" } },
      { notes: { contains: filters.search, mode: "insensitive" } },
      { contact: { firstName: { contains: filters.search, mode: "insensitive" } } },
      { contact: { lastName: { contains: filters.search, mode: "insensitive" } } },
      { contact: { company: { contains: filters.search, mode: "insensitive" } } },
      { property: { title: { contains: filters.search, mode: "insensitive" } } },
      { property: { reference: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.mandate.findMany({
      where,
      include: MANDATE_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.mandate.count({ where }),
  ]);

  return { items, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function findMandateById(id: string) {
  return prisma.mandate.findUnique({
    where: { id },
    include: {
      ...MANDATE_INCLUDE,
      contact: true,
      property: {
        include: { media: { where: { isPrimary: true }, take: 1 } },
      },
    },
  });
}

export async function createMandate(
  data: Omit<Prisma.MandateCreateInput, "reference">
) {
  return prisma.mandate.create({
    data: { ...data, reference: generateReference("MA") },
    include: MANDATE_INCLUDE,
  });
}

export async function updateMandate(id: string, data: Prisma.MandateUpdateInput) {
  return prisma.mandate.update({ where: { id }, data, include: MANDATE_INCLUDE });
}

export async function deleteMandate(id: string) {
  return prisma.mandate.delete({ where: { id } });
}

/**
 * One-click renewal: duplicate the mandate as a fresh BROUILLON.
 * The new period starts where the old one ends (or today if already past)
 * and keeps the same duration (3 months when the original had no end date).
 */
export async function renewMandate(id: string, userId?: string) {
  const source = await prisma.mandate.findUnique({ where: { id } });
  if (!source) return null;

  const now = new Date();
  const start =
    source.endDate && source.endDate.getTime() > now.getTime()
      ? source.endDate
      : now;
  const durationMs =
    source.endDate && source.endDate.getTime() > source.startDate.getTime()
      ? source.endDate.getTime() - source.startDate.getTime()
      : 90 * 86_400_000;
  const end = new Date(start.getTime() + durationMs);

  return prisma.mandate.create({
    data: {
      reference: generateReference("MA"),
      kind: source.kind,
      status: "BROUILLON",
      startDate: start,
      endDate: end,
      feesPercent: source.feesPercent,
      feesAmount: source.feesAmount,
      feesPayer: source.feesPayer,
      notes: [`Renouvellement du mandat ${source.reference}.`, source.notes]
        .filter(Boolean)
        .join("\n\n"),
      contactId: source.contactId,
      propertyId: source.propertyId,
      createdById: userId ?? source.createdById,
    },
    include: MANDATE_INCLUDE,
  });
}

/**
 * Auto-create the pipeline deal when a mandate is signed (idempotent —
 * does nothing if the mandate is already linked to a deal).
 */
export async function ensureDealForMandate(id: string) {
  const mandate = await prisma.mandate.findUnique({
    where: { id },
    include: {
      contact: { select: { firstName: true, lastName: true, company: true } },
      property: { select: { id: true, title: true } },
    },
  });
  if (!mandate || mandate.dealId) return null;

  const clientName = mandate.contact
    ? mandate.contact.company ||
      `${mandate.contact.firstName} ${mandate.contact.lastName}`.trim()
    : null;
  const title =
    [clientName, mandate.property?.title].filter(Boolean).join(" — ") ||
    `Mandat ${mandate.reference}`;

  const deal = await prisma.deal.create({
    data: {
      reference: generateReference("DS"),
      title,
      stage: "PROSPECT",
      description: `Dossier créé automatiquement à la signature du mandat ${mandate.reference}.`,
      contactId: mandate.contactId,
      propertyId: mandate.propertyId,
      assignedToId: mandate.createdById,
    },
  });

  await prisma.mandate.update({
    where: { id },
    data: { dealId: deal.id },
  });

  return deal;
}

/** Counters for the Mandats page header. */
export async function getMandateStats() {
  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  const [active, expiringSoon, drafts, awaitingSignature] = await Promise.all([
    prisma.mandate.count({ where: { status: "SIGNE" } }),
    prisma.mandate.count({
      where: {
        status: { in: ["ENVOYE", "SIGNE"] },
        endDate: { gte: now, lte: in30Days },
      },
    }),
    prisma.mandate.count({ where: { status: "BROUILLON" } }),
    prisma.mandate.count({ where: { status: "ENVOYE" } }),
  ]);

  return { active, expiringSoon, drafts, awaitingSignature };
}
