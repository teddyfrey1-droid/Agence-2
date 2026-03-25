import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateShort } from "@/lib/utils";

export default async function UtilisateursPage() {
  const session = await getSession();
  if (!session) return null;

  const users = await prisma.user.findMany({
    where: { agencyId: session.agencyId },
    include: { team: true },
    orderBy: { lastName: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900">Utilisateurs</h1>
        <p className="text-sm text-stone-500">{users.length} utilisateur(s)</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <th className="px-4 py-3 text-left font-medium text-stone-500">Nom</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">Email</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">Rôle</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">Équipe</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">Statut</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500">Dernière connexion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-anthracite-800">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge>{USER_ROLE_LABELS[user.role] || user.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {user.team?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.isActive ? "success" : "neutral"}>
                      {user.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-stone-400">
                    {user.lastLoginAt ? formatDateShort(user.lastLoginAt) : "Jamais"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
