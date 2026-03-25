import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils";
import { TASK_PRIORITY_LABELS, PROPERTY_STATUS_LABELS, SEARCH_REQUEST_STATUS_LABELS } from "@/lib/constants";
import Link from "next/link";

export default async function DashboardHomePage() {
  const session = await getSession();

  const [
    propertyCount,
    activePropertyCount,
    contactCount,
    searchRequestCount,
    openDealCount,
    overdueTasks,
    recentTasks,
    recentInteractions,
  ] = await Promise.all([
    prisma.property.count(),
    prisma.property.count({ where: { status: "ACTIF" } }),
    prisma.contact.count({ where: { isActive: true } }),
    prisma.searchRequest.count({
      where: { status: { in: ["NOUVELLE", "QUALIFIEE", "EN_COURS"] } },
    }),
    prisma.deal.count({
      where: { status: { in: ["OUVERT", "EN_COURS"] } },
    }),
    prisma.task.count({
      where: {
        status: { in: ["A_FAIRE", "EN_COURS"] },
        dueDate: { lt: new Date() },
      },
    }),
    prisma.task.findMany({
      where: { status: { in: ["A_FAIRE", "EN_COURS"] } },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 5,
      include: {
        assignedTo: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.interaction.findMany({
      orderBy: { date: "desc" },
      take: 5,
      include: {
        contact: { select: { firstName: true, lastName: true } },
        user: { select: { firstName: true, lastName: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900">
          Bonjour {session?.firstName}
        </h1>
        <p className="text-sm text-stone-500">
          Voici un aperçu de votre activité.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard label="Biens totaux" value={propertyCount} />
        <StatCard label="Biens actifs" value={activePropertyCount} />
        <StatCard label="Contacts" value={contactCount} />
        <StatCard label="Demandes actives" value={searchRequestCount} />
        <StatCard label="Dossiers ouverts" value={openDealCount} />
        <StatCard
          label="Relances en retard"
          value={overdueTasks}
          change={overdueTasks > 0 ? "À traiter en priorité" : "Tout est à jour"}
          trend={overdueTasks > 0 ? "down" : "up"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="heading-card">Tâches à venir</h2>
              <Link
                href="/dashboard/taches"
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Voir tout
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentTasks.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-stone-400">
                Aucune tâche en cours
              </p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {recentTasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-anthracite-800">
                        {task.title}
                      </p>
                      <p className="text-xs text-stone-400">
                        {task.assignedTo
                          ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                          : "Non assignée"}
                        {task.dueDate && ` · Échéance: ${formatDateShort(task.dueDate)}`}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(task.priority)}>
                      {TASK_PRIORITY_LABELS[task.priority]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent interactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="heading-card">Activité récente</h2>
              <Link
                href="/dashboard/interactions"
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Voir tout
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentInteractions.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-stone-400">
                Aucune activité récente
              </p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {recentInteractions.map((interaction) => (
                  <li key={interaction.id} className="px-6 py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-anthracite-800">
                          {interaction.subject || interaction.type}
                        </p>
                        <p className="text-xs text-stone-400">
                          {interaction.contact
                            ? `${interaction.contact.firstName} ${interaction.contact.lastName}`
                            : "—"}
                          {interaction.user &&
                            ` · par ${interaction.user.firstName} ${interaction.user.lastName}`}
                        </p>
                      </div>
                      <span className="text-xs text-stone-400">
                        {formatDateShort(interaction.date)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
