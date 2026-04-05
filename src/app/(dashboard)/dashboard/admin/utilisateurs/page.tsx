import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessAdmin } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { UsersManagement } from "./users-management";

export default async function UtilisateursPage() {
  const session = await getSession();
  if (!session || !canAccessAdmin(session.role)) redirect("/dashboard");

  const users = await prisma.user.findMany({
    include: { team: true },
    orderBy: [{ role: "asc" }, { lastName: "asc" }],
  });

  const serialized = users.map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone,
    role: u.role,
    isActive: u.isActive,
    isActivated: u.isActivated,
    invitedAt: u.invitedAt?.toISOString() || null,
    lastLoginAt: u.lastLoginAt?.toISOString() || null,
    team: u.team ? { id: u.team.id, name: u.team.name } : null,
  }));

  return <UsersManagement users={serialized} />;
}
