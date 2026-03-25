import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface SearchRequestFilters {
  status?: string;
  assignedToId?: string;
  source?: string;
  search?: string;
}

export async function findSearchRequests(
  filters: SearchRequestFilters = {},
  page = 1,
  perPage = 20
) {
  const where: Prisma.SearchRequestWhereInput = {};

  if (filters.status)
    where.status = filters.status as Prisma.EnumSearchRequestStatusFilter;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters.source) where.source = filters.source as Prisma.EnumContactSourceFilter;
  if (filters.search) {
    where.OR = [
      { reference: { contains: filters.search, mode: "insensitive" } },
      { activity: { contains: filters.search, mode: "insensitive" } },
      { contact: { lastName: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.searchRequest.findMany({
      where,
      include: {
        contact: { select: { firstName: true, lastName: true, company: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
        _count: { select: { matches: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.searchRequest.count({ where }),
  ]);

  return { items, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function findSearchRequestById(id: string) {
  return prisma.searchRequest.findUnique({
    where: { id },
    include: {
      contact: true,
      assignedTo: true,
      matches: {
        include: {
          property: {
            include: { media: { where: { isPrimary: true }, take: 1 } },
          },
        },
        orderBy: { score: "desc" },
      },
      tasks: { where: { status: { in: ["A_FAIRE", "EN_COURS"] } } },
      interactions: { orderBy: { date: "desc" }, take: 10 },
    },
  });
}

export async function createSearchRequest(data: Prisma.SearchRequestCreateInput) {
  return prisma.searchRequest.create({ data });
}

export async function updateSearchRequest(
  id: string,
  data: Prisma.SearchRequestUpdateInput
) {
  return prisma.searchRequest.update({ where: { id }, data });
}

export async function countSearchRequestsByStatus() {
  const result = await prisma.searchRequest.groupBy({
    by: ["status"],
    _count: true,
  });
  return result.reduce(
    (acc, r) => ({ ...acc, [r.status]: r._count }),
    {} as Record<string, number>
  );
}
