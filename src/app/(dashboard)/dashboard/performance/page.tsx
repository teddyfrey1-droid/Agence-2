import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  DEAL_STAGE_LABELS,
  PROPERTY_STATUS_LABELS,
  SEARCH_REQUEST_STATUS_LABELS,
  TRANSACTION_TYPE_LABELS
} from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

export default async function PerformancePage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

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
    wonDeals,
    allDeals,
    agents,
    closedDealsWithDates,
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
    prisma.deal.findMany({
      where: { status: "GAGNE" },
      include: {
        property: { select: { transactionType: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.deal.count(),
    prisma.user.findMany({
      where: { role: { in: ["AGENT", "MANAGER", "ASSOCIE", "DIRIGEANT"] }, isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        deals: {
          select: { status: true, finalValue: true, commission: true },
        },
      },
    }),
    prisma.deal.findMany({
      where: {
        status: "GAGNE",
        closedAt: { gte: sixMonthsAgo },
      },
      select: { closedAt: true },
    }),
  ]);

  // Conversion funnel data
  const funnelStages = ["PROSPECT", "VISITE", "NEGOCIATION", "COMPROMIS", "CLOTURE"];
  const funnelCounts = funnelStages.map((stage) => {
    const stageIndex = ["PROSPECT", "DECOUVERTE", "VISITE", "NEGOCIATION", "OFFRE", "COMPROMIS", "ACTE", "CLOTURE"].indexOf(stage);
    // Count deals at this stage or beyond
    const allStages = ["PROSPECT", "DECOUVERTE", "VISITE", "NEGOCIATION", "OFFRE", "COMPROMIS", "ACTE", "CLOTURE"];
    const relevantStages = allStages.slice(stageIndex);
    const count = dealsByStage
      .filter((d) => relevantStages.includes(d.stage))
      .reduce((sum, d) => sum + d._count, 0);
    // Also add won deals that passed through
    const wonCount = stage === "CLOTURE" ? wonDeals.length : 0;
    return { stage, label: DEAL_STAGE_LABELS[stage] || stage, count: count + wonCount };
  });

  // Agent ranking
  const agentRanking = agents
    .map((agent) => {
      const won = agent.deals.filter((d) => d.status === "GAGNE");
      const total = agent.deals.length;
      const totalCommission = won.reduce((sum, d) => sum + (d.commission || 0), 0);
      const totalValue = won.reduce((sum, d) => sum + (d.finalValue || 0), 0);
      const conversionRate = total > 0 ? Math.round((won.length / total) * 100) : 0;
      return {
        id: agent.id,
        name: `${agent.firstName} ${agent.lastName}`,
        role: agent.role,
        totalDeals: total,
        wonDeals: won.length,
        conversionRate,
        totalCommission,
        totalValue,
      };
    })
    .sort((a, b) => b.wonDeals - a.wonDeals || b.conversionRate - a.conversionRate);

  // Avg closing time by transaction type
  const closingTimeByType: Record<string, { total: number; count: number }> = {};
  for (const deal of wonDeals) {
    if (!deal.closedAt || !deal.createdAt) continue;
    const transType = deal.property?.transactionType || "AUTRE";
    if (!closingTimeByType[transType]) closingTimeByType[transType] = { total: 0, count: 0 };
    const days = Math.round((new Date(deal.closedAt).getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    closingTimeByType[transType].total += days;
    closingTimeByType[transType].count++;
  }
  const closingTimes = Object.entries(closingTimeByType).map(([type, data]) => ({
    type,
    label: TRANSACTION_TYPE_LABELS[type] || type,
    avgDays: Math.round(data.total / data.count),
    count: data.count,
  }));

  // Monthly deals (last 6 months)
  const monthLabels: string[] = [];
  const monthCounts: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthLabels.push(d.toLocaleDateString("fr-FR", { month: "short" }));
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const count = closedDealsWithDates.filter((deal) => {
      if (!deal.closedAt) return false;
      const closed = new Date(deal.closedAt);
      return closed >= monthStart && closed <= monthEnd;
    }).length;
    monthCounts.push(count);
  }
  const maxMonthCount = Math.max(...monthCounts, 1);

  // Total won revenue
  const totalRevenue = wonDeals.reduce((sum, d) => sum + (d.finalValue || 0), 0);
  const totalCommissions = wonDeals.reduce((sum, d) => sum + (d.commission || 0), 0);

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Analyse"
        title="Performance"
        description="Vue d'ensemble de l'activité et des conversions — portefeuille, funnel et CA."
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        }
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Dossiers gagnes" value={wonDeals.length} change={`sur ${allDeals} total`} trend="neutral" />
        <StatCard label="CA total" value={formatPrice(totalRevenue)} />
        <StatCard label="Commissions" value={formatPrice(totalCommissions)} />
        <StatCard label="Taux conversion" value={allDeals > 0 ? `${Math.round((wonDeals.length / allDeals) * 100)}%` : "—"} />
        <StatCard label="Biens totaux" value={totalProperties} />
        <StatCard label="Biens publies" value={publishedProperties} />
        <StatCard label="Demandes actives" value={activeSearchRequests} />
        <StatCard label="Relances en retard" value={overdueTasks} trend={overdueTasks > 0 ? "down" : "up"} change={overdueTasks > 0 ? "A traiter" : "OK"} />
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-anthracite-900 dark:text-stone-100">
            Entonnoir de conversion
          </h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-0">
            {funnelCounts.map((step, i) => {
              const maxCount = Math.max(...funnelCounts.map((s) => s.count), 1);
              const widthPct = Math.max((step.count / maxCount) * 100, 20);
              const colors = [
                "bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200",
                "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
                "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
                "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
                "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
              ];

              return (
                <div key={step.stage} className="flex flex-1 items-center">
                  <div className="w-full">
                    <div
                      className={`mx-auto flex flex-col items-center justify-center rounded-lg px-3 py-3 text-center transition-all ${colors[i]}`}
                      style={{ width: `${widthPct}%`, minWidth: "80px" }}
                    >
                      <span className="text-2xl font-bold">{step.count}</span>
                      <span className="text-[11px] font-medium">{step.label}</span>
                    </div>
                    {i < funnelCounts.length - 1 && funnelCounts[i].count > 0 && (
                      <p className="mt-1 text-center text-[10px] text-stone-400 dark:text-stone-500">
                        {funnelCounts[i + 1].count > 0
                          ? `${Math.round((funnelCounts[i + 1].count / funnelCounts[i].count) * 100)}%`
                          : "—"}
                      </p>
                    )}
                  </div>
                  {i < funnelCounts.length - 1 && (
                    <svg className="mx-1 hidden h-5 w-5 shrink-0 text-stone-300 sm:block dark:text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Agent Ranking */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-anthracite-900 dark:text-stone-100">
              Classement agents
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            {agentRanking.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-stone-400 dark:text-stone-500">Aucun agent</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 dark:border-stone-700/50">
                      <th className="px-4 py-2.5 text-left font-medium text-stone-500 dark:text-stone-400">#</th>
                      <th className="px-4 py-2.5 text-left font-medium text-stone-500 dark:text-stone-400">Agent</th>
                      <th className="px-4 py-2.5 text-right font-medium text-stone-500 dark:text-stone-400">Gagnes</th>
                      <th className="hidden px-4 py-2.5 text-right font-medium text-stone-500 sm:table-cell dark:text-stone-400">Conv.</th>
                      <th className="hidden px-4 py-2.5 text-right font-medium text-stone-500 md:table-cell dark:text-stone-400">Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
                    {agentRanking.map((agent, i) => (
                      <tr key={agent.id} className="transition-colors hover:bg-stone-50 dark:hover:bg-anthracite-800/50">
                        <td className="px-4 py-2.5">
                          {i < 3 ? (
                            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                              i === 0 ? "bg-amber-400" : i === 1 ? "bg-stone-400" : "bg-amber-600"
                            }`}>
                              {i + 1}
                            </span>
                          ) : (
                            <span className="pl-1.5 text-stone-400 dark:text-stone-500">{i + 1}</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-anthracite-800 dark:text-stone-200">{agent.name}</p>
                          <p className="text-xs text-stone-400 dark:text-stone-500">{agent.totalDeals} dossiers</p>
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">{agent.wonDeals}</td>
                        <td className="hidden px-4 py-2.5 text-right sm:table-cell">
                          <span className={`text-xs font-medium ${
                            agent.conversionRate >= 50 ? "text-emerald-600 dark:text-emerald-400" : agent.conversionRate >= 25 ? "text-amber-600 dark:text-amber-400" : "text-stone-500 dark:text-stone-400"
                          }`}>
                            {agent.conversionRate}%
                          </span>
                        </td>
                        <td className="hidden px-4 py-2.5 text-right font-medium text-anthracite-800 md:table-cell dark:text-stone-200">
                          {formatPrice(agent.totalCommission)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Deals Chart */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-anthracite-900 dark:text-stone-100">
              Dossiers clotures par mois
            </h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2" style={{ height: "200px" }}>
              {monthLabels.map((label, i) => (
                <div key={label} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-bold text-anthracite-800 dark:text-stone-200">{monthCounts[i]}</span>
                  <div className="w-full max-w-[48px] overflow-hidden rounded-t-md bg-stone-100 dark:bg-stone-800" style={{ height: "160px" }}>
                    <div
                      className="mt-auto w-full rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400 transition-all dark:from-brand-500 dark:to-brand-300"
                      style={{
                        height: `${(monthCounts[i] / maxMonthCount) * 100}%`,
                        marginTop: `${100 - (monthCounts[i] / maxMonthCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-medium uppercase text-stone-400 dark:text-stone-500">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Closing Time by Transaction Type */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-anthracite-900 dark:text-stone-100">
              Temps moyen de closing
            </h2>
          </CardHeader>
          <CardContent>
            {closingTimes.length === 0 ? (
              <p className="py-4 text-center text-sm text-stone-400 dark:text-stone-500">
                Aucun dossier cloture pour le moment
              </p>
            ) : (
              <div className="space-y-4">
                {closingTimes.map((ct) => {
                  const maxDays = Math.max(...closingTimes.map((c) => c.avgDays), 1);
                  const widthPct = (ct.avgDays / maxDays) * 100;
                  return (
                    <div key={ct.type}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium text-anthracite-800 dark:text-stone-200">{ct.label}</span>
                        <span className="text-sm font-bold text-anthracite-900 dark:text-stone-100">{ct.avgDays} jours</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 dark:from-brand-500 dark:to-brand-300"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                      <p className="mt-0.5 text-[11px] text-stone-400 dark:text-stone-500">{ct.count} dossier{ct.count > 1 ? "s" : ""}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Existing breakdowns */}
        <div className="space-y-6">
          <Card>
            <CardHeader><h2 className="text-base font-semibold text-anthracite-900 dark:text-stone-100">Biens par statut</h2></CardHeader>
            <CardContent>
              <dl className="space-y-2">
                {propertiesByStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between text-sm">
                    <dt className="text-stone-600 dark:text-stone-400">{PROPERTY_STATUS_LABELS[item.status] || item.status}</dt>
                    <dd className="font-semibold text-anthracite-800 dark:text-stone-200">{item._count}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="text-base font-semibold text-anthracite-900 dark:text-stone-100">Demandes par statut</h2></CardHeader>
            <CardContent>
              <dl className="space-y-2">
                {requestsByStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between text-sm">
                    <dt className="text-stone-600 dark:text-stone-400">{SEARCH_REQUEST_STATUS_LABELS[item.status] || item.status}</dt>
                    <dd className="font-semibold text-anthracite-800 dark:text-stone-200">{item._count}</dd>
                  </div>
                ))}
                {requestsByStatus.length === 0 && <p className="text-sm text-stone-400 dark:text-stone-500">Aucune demande</p>}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
