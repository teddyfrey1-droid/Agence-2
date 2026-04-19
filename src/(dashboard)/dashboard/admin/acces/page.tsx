import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessAdmin } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { AccessManagement } from "./access-management";

export default async function AccesPage() {
  const session = await getSession();
  if (!session || !canAccessAdmin(session.role)) redirect("/dashboard");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true,
      customPermissions: true,
    },
    where: { isActive: true },
    orderBy: [{ role: "asc" }, { lastName: "asc" }],
  });

  return <AccessManagement users={JSON.parse(JSON.stringify(users))} />;
}
