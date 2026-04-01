import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface DealFilters {
  stage?: string;
  status?: string;
  assignedToId?: string;
  search?: string;
}

export async function findDeals(
  filters: DealFilters = {},
  page = 1,
  perPage = 20
) {
  const where: Prisma.DealWhereInput = {};

  if (filters.stage) where.stage = filters.stage as Prisma.EnumDealStageFilter;
  if (filters.status) where.status = filters.status as Prisma.EnumDealStatusFilter;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { reference: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      include: {
        property: { select: { title: true, reference: true } },
        contact: { select: { firstName: true, lastName: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
        _count: { select: { tasks: true, interactions: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.deal.count({ where }),
  ]);

  return { items, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function findDealById(id: string) {
  return prisma.deal.findUnique({
    where: { id },
    include: {
      property: true,
      contact: true,
      searchRequest: true,
      assignedTo: true,
      propertyFoundBy: { select: { id: true, firstName: true, lastName: true } },
      dealClosedBy: { select: { id: true, firstName: true, lastName: true } },
      tasks: { orderBy: { dueDate: "asc" } },
      interactions: { orderBy: { date: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function createDeal(data: Prisma.DealCreateInput) {
  return prisma.deal.create({ data });
}

export async function updateDeal(id: string, data: Prisma.DealUpdateInput) {
  return prisma.deal.update({ where: { id }, data });
}

export async function countDealsByStage() {
  const result = await prisma.deal.groupBy({
    by: ["stage"],
    _count: true,
    where: { status: { in: ["OUVERT", "EN_COURS"] } },
  });
  return result.reduce(
    (acc, r) => ({ ...acc, [r.stage]: r._count }),
    {} as Record<string, number>
  );
}
