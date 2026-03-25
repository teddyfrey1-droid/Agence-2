import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface TaskFilters {
  status?: string;
  priority?: string;
  assignedToId?: string;
  search?: string;
  overdue?: boolean;
}

export async function findTasks(
  filters: TaskFilters = {},
  page = 1,
  perPage = 20
) {
  const where: Prisma.TaskWhereInput = {};

  if (filters.status) where.status = filters.status as Prisma.EnumTaskStatusFilter;
  if (filters.priority) where.priority = filters.priority as Prisma.EnumTaskPriorityFilter;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters.overdue) {
    where.dueDate = { lt: new Date() };
    where.status = { in: ["A_FAIRE", "EN_COURS"] };
  }
  if (filters.search) {
    where.title = { contains: filters.search, mode: "insensitive" };
  }

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { firstName: true, lastName: true } },
        contact: { select: { firstName: true, lastName: true } },
        property: { select: { title: true, reference: true } },
        deal: { select: { title: true, reference: true } },
      },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.task.count({ where }),
  ]);

  return { items, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

export async function findTaskById(id: string) {
  return prisma.task.findUnique({
    where: { id },
    include: {
      createdBy: true,
      assignedTo: true,
      contact: true,
      property: true,
      searchRequest: true,
      deal: true,
    },
  });
}

export async function createTask(data: Prisma.TaskCreateInput) {
  return prisma.task.create({ data });
}

export async function updateTask(id: string, data: Prisma.TaskUpdateInput) {
  return prisma.task.update({ where: { id }, data });
}

export async function countOverdueTasks(userId?: string) {
  const where: Prisma.TaskWhereInput = {
    dueDate: { lt: new Date() },
    status: { in: ["A_FAIRE", "EN_COURS"] },
  };
  if (userId) where.assignedToId = userId;
  return prisma.task.count({ where });
}
