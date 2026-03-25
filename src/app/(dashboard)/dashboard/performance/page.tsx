import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { DEAL_STAGE_LABELS, PROPERTY_STATUS_LABELS, SEARCH_REQUEST_STATUS_LABELS } from "@/lib/constants";

export default async function PerformancePage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalProperties,
    publishedProperties,
    activeSearchRequests,
    openDeals,
    overdueTasks,
    recentInteractions,
    contactsThisMonth,
    propertiesByStatus,
    dealsByStage,
    requestsByStatus,
  ] = await Promise.all([
    prisma.property.count(),
    prisma.property.count({ where: { isPublished: true } }),
    prisma.searchRequest.count({ where: { status: { in: ["NOUVELLE", "QUALIFIEE", "EN_COURS"] } } }),
    prisma.deal.count({ where: { status: { in: ["OUVERT", "EN_COURS"] } } }),
    prisma.task.count({ where: { status: { in: ["A_FAIRE", "EN_COURS"] }, dueDate: { lt: now } } }),
    prisma.interaction.count({ where: { date: { gte: sevenDaysAgo } } }),
    prisma.contact.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.property.groupBy({ by: ["status"], _count: true }),
    prisma.deal.groupBy({ by: ["stage"], _count: true, where: { status: { in: ["OUVERT", "EN_COURS"] } } }),
    prisma.searchRequest.groupBy({ by: ["status"], _count: true }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900">Performance</h1>
        <p className="text-sm text-stone-500">Vue d&apos;ensemble de l&apos;activité.</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Biens totaux" value={totalProperties} />
        <StatCard label="Biens publiés" value={publishedProperties} />
        <StatCard label="Demandes actives" value={activeSearchRequests} />
        <StatCard label="Dossiers ouverts" value={openDeals} />
        <StatCard label="Relances en retard" value={overdueTasks} trend={overdueTasks > 0 ? "down" : "up"} change={overdueTasks > 0 ? "À traiter" : "OK"} />
        <StatCard label="Interactions (7j)" value={recentInteractions} />
        <StatCard label="Nouveaux contacts (30j)" value={contactsThisMonth} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Properties by status */}
        <Card>
          <CardHeader><h2 className="heading-card">Biens par statut</h2></CardHeader>
          <CardContent>
            <dl className="space-y-2">
              {propertiesByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between text-sm">
                  <dt className="text-stone-600">{PROPERTY_STATUS_LABELS[item.status] || item.status}</dt>
                  <dd className="font-semibold text-anthracite-800">{item._count}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {/* Deals by stage */}
        <Card>
          <CardHeader><h2 className="heading-card">Dossiers par étape</h2></CardHeader>
          <CardContent>
            <dl className="space-y-2">
              {dealsByStage.map((item) => (
                <div key={item.stage} className="flex items-center justify-between text-sm">
                  <dt className="text-stone-600">{DEAL_STAGE_LABELS[item.stage] || item.stage}</dt>
                  <dd className="font-semibold text-anthracite-800">{item._count}</dd>
                </div>
              ))}
              {dealsByStage.length === 0 && <p className="text-sm text-stone-400">Aucun dossier</p>}
            </dl>
          </CardContent>
        </Card>

        {/* Search requests by status */}
        <Card>
          <CardHeader><h2 className="heading-card">Demandes par statut</h2></CardHeader>
          <CardContent>
            <dl className="space-y-2">
              {requestsByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between text-sm">
                  <dt className="text-stone-600">{SEARCH_REQUEST_STATUS_LABELS[item.status] || item.status}</dt>
                  <dd className="font-semibold text-anthracite-800">{item._count}</dd>
                </div>
              ))}
              {requestsByStatus.length === 0 && <p className="text-sm text-stone-400">Aucune demande</p>}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
