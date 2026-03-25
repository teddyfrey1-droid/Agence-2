import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type PropertyWithRelations = Prisma.PropertyGetPayload<{
  include: {
    owner: true;
    assignedTo: true;
    media: true;
    _count: { select: { deals: true; matches: true; tasks: true } };
  };
}>;

export type PropertyListItem = Prisma.PropertyGetPayload<{
  include: {
    media: { where: { isPrimary: true }; take: 1 };
    assignedTo: { select: { firstName: true; lastName: true } };
    _count: { select: { matches: true } };
  };
}>;

export interface PropertyFilters {
  status?: string;
  type?: string;
  transactionType?: string;
  city?: string;
  district?: string;
  isPublished?: boolean;
  assignedToId?: string;
  search?: string;
}

export async function findProperties(
  filters: PropertyFilters = {},
  page = 1,
  perPage = 20
) {
  const where: Prisma.PropertyWhereInput = {};

  if (filters.status) where.status = filters.status as Prisma.EnumPropertyStatusFilter;
  if (filters.type) where.type = filters.type as Prisma.EnumPropertyTypeFilter;
  if (filters.transactionType)
    where.transactionType = filters.transactionType as Prisma.EnumTransactionTypeFilter;
  if (filters.city) where.city = filters.city;
  if (filters.district) where.district = filters.district;
  if (filters.isPublished !== undefined) where.isPublished = filters.isPublished;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { reference: { contains: filters.search, mode: "insensitive" } },
      { address: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: {
        media: { where: { isPrimary: true }, take: 1 },
        assignedTo: { select: { firstName: true, lastName: true } },
        _count: { select: { matches: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.property.count({ where }),
  ]);

  return { items, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function findPropertyById(id: string) {
  return prisma.property.findUnique({
    where: { id },
    include: {
      owner: true,
      assignedTo: true,
      media: { orderBy: { sortOrder: "asc" } },
      _count: { select: { deals: true, matches: true, tasks: true } },
    },
  });
}

export async function findPublishedProperties(page = 1, perPage = 12) {
  const where: Prisma.PropertyWhereInput = {
    isPublished: true,
    status: "ACTIF",
    confidentiality: "PUBLIC",
  };

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: {
        media: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.property.count({ where }),
  ]);

  return { items, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function createProperty(data: Prisma.PropertyCreateInput) {
  return prisma.property.create({ data });
}

export async function updateProperty(
  id: string,
  data: Prisma.PropertyUpdateInput
) {
  return prisma.property.update({ where: { id }, data });
}

export async function deleteProperty(id: string) {
  return prisma.property.delete({ where: { id } });
}

export async function countPropertiesByStatus() {
  const result = await prisma.property.groupBy({
    by: ["status"],
    _count: true,
  });
  return result.reduce(
    (acc, r) => ({ ...acc, [r.status]: r._count }),
    {} as Record<string, number>
  );
}
