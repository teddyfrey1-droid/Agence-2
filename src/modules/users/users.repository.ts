import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { agency: true, team: true },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { agency: true, team: true },
  });
}

export async function findUsers(agencyId: string) {
  return prisma.user.findMany({
    where: { agencyId },
    include: { team: true },
    orderBy: { lastName: "asc" },
  });
}

export async function createUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
  agencyId: string;
  teamId?: string;
  phone?: string;
}) {
  const passwordHash = await hash(data.password, 12);

  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: (data.role as "SUPER_ADMIN" | "DIRIGEANT" | "ASSOCIE" | "MANAGER" | "AGENT" | "ASSISTANT") || "AGENT",
      phone: data.phone,
      agency: { connect: { id: data.agencyId } },
      ...(data.teamId ? { team: { connect: { id: data.teamId } } } : {}),
    },
  });
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(plainPassword, hashedPassword);
}

export async function updateUserLastLogin(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}
