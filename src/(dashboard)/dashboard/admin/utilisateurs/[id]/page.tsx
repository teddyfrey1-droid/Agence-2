import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  DIRIGEANT: "Dirigeant",
  ASSOCIE: "Associé",
  MANAGER: "Manager",
  AGENT: "Agent",
  ASSISTANT: "Assistant",
  CLIENT: "Client",
};

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h${m > 0 ? `${m}min` : ""}`;
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || !canAccessAdmin(session.role)) redirect("/dashboard");

  const { id } = await params;

  const [user, activities, auditLogs] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: { team: true, agency: true },
    }),
    prisma.userActivity.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.auditLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  if (!user) notFound();

  // Calculate stats
  const loginCount = activities.filter((a) => a.type === "LOGIN").length;
  const pageViews = activities.filter((a) => a.type === "PAGE_VIEW").length;
  const lastLogin = activities.find((a) => a.type === "LOGIN");

  // Get unique pages visited
  const uniquePages = [...new Set(activities.filter((a) => a.path).map((a) => a.path!))];

  // Get activity type icon
  function getActivityIcon(type: string): string {
    switch (type) {
      case "LOGIN": return "🔑";
      case "LOGOUT": return "🚪";
      case "PAGE_VIEW": return "👁";
      case "ACTION": return "⚡";
      default: return "📋";
    }
  }

  function getActivityLabel(type: string): string {
    switch (type) {
      case "LOGIN": return "Connexion";
      case "LOGOUT": return "Déconnexion";
      case "PAGE_VIEW": return "Page consultée";
      case "ACTION": return "Action";
      default: return type;
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/dashboard/admin/utilisateurs" className="text-stone-400 hover:text-anthracite-700">
            Utilisateurs
          </Link>
          <span className="text-stone-300">/</span>
          <span className="text-anthracite-700">{user.firstName} {user.lastName}</span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-anthracite-900">
              {user.firstName} {user.lastName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={user.role === "CLIENT" ? "neutral" : "default"}>
                {ROLE_LABELS[user.role] || user.role}
              </Badge>
              <Badge variant={user.isActive ? "success" : "danger"}>
                {user.isActive ? "Actif" : "Bloqué"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-anthracite-900">{loginCount}</p>
          <p className="text-xs text-stone-500">Connexions</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-anthracite-900">{pageViews}</p>
          <p className="text-xs text-stone-500">Pages vues</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-anthracite-900">{uniquePages.length}</p>
          <p className="text-xs text-stone-500">Pages uniques</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-anthracite-900">{auditLogs.length}</p>
          <p className="text-xs text-stone-500">Actions</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Activity timeline */}
          <Card>
            <CardHeader>
              <h2 className="heading-card">Historique d&apos;activité</h2>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-stone-400">Aucune activité enregistrée.</p>
              ) : (
                <div className="space-y-1">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-stone-50"
                    >
                      <span className="flex-shrink-0 text-base">{getActivityIcon(activity.type)}</span>
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-anthracite-800">
                          {getActivityLabel(activity.type)}
                        </span>
                        {activity.path && (
                          <span className="ml-2 text-stone-500">{activity.path}</span>
                        )}
                        {activity.details && (
                          <span className="ml-2 text-stone-400">— {activity.details}</span>
                        )}
                      </div>
                      <span className="flex-shrink-0 text-xs text-stone-400">
                        {formatDateTime(activity.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audit log */}
          <Card>
            <CardHeader>
              <h2 className="heading-card">Journal des actions</h2>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-sm text-stone-400">Aucune action enregistrée.</p>
              ) : (
                <div className="space-y-1">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-stone-50"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-anthracite-800">{log.action}</span>
                        <span className="ml-2 text-stone-500">{log.entity}</span>
                        {log.details && (
                          <p className="text-xs text-stone-400 mt-0.5">{log.details}</p>
                        )}
                      </div>
                      <span className="flex-shrink-0 text-xs text-stone-400">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="heading-card">Informations</h2>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-stone-500">Email</dt>
                  <dd className="font-medium text-anthracite-800">{user.email}</dd>
                </div>
                {user.phone && (
                  <div>
                    <dt className="text-stone-500">Téléphone</dt>
                    <dd className="font-medium text-anthracite-800">
                      <a href={`tel:${user.phone}`} className="hover:text-brand-600">{user.phone}</a>
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-stone-500">Rôle</dt>
                  <dd className="font-medium text-anthracite-800">{ROLE_LABELS[user.role] || user.role}</dd>
                </div>
                {user.agency && (
                  <div>
                    <dt className="text-stone-500">Agence</dt>
                    <dd className="font-medium text-anthracite-800">{user.agency.name}</dd>
                  </div>
                )}
                {user.team && (
                  <div>
                    <dt className="text-stone-500">Équipe</dt>
                    <dd className="font-medium text-anthracite-800">{user.team.name}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-stone-500">Compte créé le</dt>
                  <dd className="font-medium text-anthracite-800">{formatDateTime(user.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-stone-500">Dernière connexion</dt>
                  <dd className="font-medium text-anthracite-800">
                    {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Jamais"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Most visited pages */}
          {uniquePages.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="heading-card">Pages les plus visitées</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {uniquePages.slice(0, 10).map((page) => {
                    const count = activities.filter((a) => a.path === page).length;
                    return (
                      <div key={page} className="flex items-center justify-between text-sm">
                        <span className="truncate text-stone-600">{page}</span>
                        <span className="ml-2 flex-shrink-0 text-xs font-medium text-anthracite-700">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
