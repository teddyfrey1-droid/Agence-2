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

  return <UsersManagement users={JSON.parse(JSON.stringify(users))} />;
}
