import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface FieldSpottingFilters {
  status?: string;
  assignedToId?: string;
  search?: string;
}

export async function findFieldSpottings(
  filters: FieldSpottingFilters = {},
  page = 1,
  perPage = 20
) {
  const where: Prisma.FieldSpottingWhereInput = {};

  if (filters.status)
    where.status = filters.status as Prisma.EnumFieldSpottingStatusFilter;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters.search) {
    where.OR = [
      { address: { contains: filters.search, mode: "insensitive" } },
      { notes: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.fieldSpotting.findMany({
      where,
      include: {
        assignedTo: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.fieldSpotting.count({ where }),
  ]);

  return { items, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function findFieldSpottingById(id: string) {
  return prisma.fieldSpotting.findUnique({
    where: { id },
    include: { assignedTo: true },
  });
}

export async function createFieldSpotting(data: Prisma.FieldSpottingCreateInput) {
  return prisma.fieldSpotting.create({ data });
}

export async function updateFieldSpotting(
  id: string,
  data: Prisma.FieldSpottingUpdateInput
) {
  return prisma.fieldSpotting.update({ where: { id }, data });
}
