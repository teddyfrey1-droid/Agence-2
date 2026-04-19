import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface InteractionFilters {
  type?: string;
  contactId?: string;
  propertyId?: string;
  dealId?: string;
  search?: string;
}

export async function findInteractions(
  filters: InteractionFilters = {},
  page = 1,
  perPage = 20
) {
  const where: Prisma.InteractionWhereInput = {};

  if (filters.type) where.type = filters.type as Prisma.EnumInteractionTypeFilter;
  if (filters.contactId) where.contactId = filters.contactId;
  if (filters.propertyId) where.propertyId = filters.propertyId;
  if (filters.dealId) where.dealId = filters.dealId;
  if (filters.search) {
    where.OR = [
      { subject: { contains: filters.search, mode: "insensitive" } },
      { content: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.interaction.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true } },
        contact: { select: { firstName: true, lastName: true } },
        property: { select: { title: true, reference: true } },
        deal: { select: { title: true, reference: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.interaction.count({ where }),
  ]);

  return { items, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function createInteraction(data: Prisma.InteractionCreateInput) {
  return prisma.interaction.create({ data });
}

export async function countRecentInteractions(days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return prisma.interaction.count({
    where: { date: { gte: since } },
  });
}
