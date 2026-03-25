import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface ContactFilters {
  type?: string;
  source?: string;
  search?: string;
  isActive?: boolean;
}

export async function findContacts(
  filters: ContactFilters = {},
  page = 1,
  perPage = 20
) {
  const where: Prisma.ContactWhereInput = {};

  if (filters.type) where.type = filters.type as Prisma.EnumContactTypeFilter;
  if (filters.source) where.source = filters.source as Prisma.EnumContactSourceFilter;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { company: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: {
        _count: {
          select: {
            searchRequests: true,
            deals: true,
            interactions: true,
            tasks: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.contact.count({ where }),
  ]);

  return { items, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function findContactById(id: string) {
  return prisma.contact.findUnique({
    where: { id },
    include: {
      organizations: { include: { organization: true } },
      searchRequests: { orderBy: { createdAt: "desc" }, take: 5 },
      deals: { orderBy: { createdAt: "desc" }, take: 5 },
      interactions: { orderBy: { date: "desc" }, take: 10 },
      tasks: { where: { status: { in: ["A_FAIRE", "EN_COURS"] } }, take: 5 },
    },
  });
}

export async function findContactByEmail(email: string) {
  return prisma.contact.findFirst({ where: { email } });
}

export async function createContact(data: Prisma.ContactCreateInput) {
  return prisma.contact.create({ data });
}

export async function updateContact(
  id: string,
  data: Prisma.ContactUpdateInput
) {
  return prisma.contact.update({ where: { id }, data });
}

export async function countContactsByType() {
  const result = await prisma.contact.groupBy({
    by: ["type"],
    _count: true,
    where: { isActive: true },
  });
  return result.reduce(
    (acc, r) => ({ ...acc, [r.type]: r._count }),
    {} as Record<string, number>
  );
}
