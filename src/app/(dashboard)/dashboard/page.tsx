import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateShort } from "@/lib/utils";
import { TASK_PRIORITY_LABELS, DEAL_STAGE_LABELS } from "@/lib/constants";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { PipelineMini } from "@/components/dashboard/pipeline-mini";
import Link from "next/link";

function KpiCard({
  label,
  value,
  icon,
  color,
  href,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  href: string;
}) {
  return (
    <Link href={href} className="group">
      <div className="relative overflow-hidden rounded-xl border border-stone-200/70 bg-white p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200/70 hover:shadow-card-hover sm:p-5 dark:border-anthracite-800 dark:bg-anthracite-900">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-brand-100/40 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100 dark:bg-brand-900/30" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-stone-500 dark:text-stone-400">
              {label}
            </p>
            <p className="font-display text-[1.65rem] font-bold leading-none tracking-tight text-anthracite-900 sm:text-3xl dark:text-stone-100">
              {value}
            </p>
          </div>
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${color}`}>
            {icon}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function DashboardHomePage() {
  const session = await getSession();

  // Build last 7 days range
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    propertyCount,
    activePropertyCount,
    contactCount,
    searchRequestCount,
    openDealCount,
    overdueTasks,
    recentTasks,
    recentInteractions,
    weekInteractions,
    dealsByStage,
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
        dueDate: { lt: now },
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
    // Interactions over last 7 days for chart
    prisma.interaction.findMany({
      where: { date: { gte: sevenDaysAgo } },
      select: { date: true },
    }),
    // Deal counts by stage for mini pipeline
    prisma.deal.groupBy({
      by: ["stage"],
      where: { status: { in: ["OUVERT", "EN_COURS"] } },
      _count: true,
    }),
  ]);

  // Build activity data for last 7 days
  const DAY_LABELS_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const activityData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const dayStr = d.toISOString().slice(0, 10);
    const count = weekInteractions.filter(
      (inter) => new Date(inter.date).toISOString().slice(0, 10) === dayStr
    ).length;
    return { label: DAY_LABELS_SHORT[d.getDay()], value: count };
  });

  // Pipeline data
  const PIPELINE_ORDER = ["PROSPECT", "DECOUVERTE", "VISITE", "NEGOCIATION", "OFFRE", "COMPROMIS", "ACTE", "CLOTURE"];
  const pipelineData = PIPELINE_ORDER.map((stage) => ({
    stage,
    label: DEAL_STAGE_LABELS[stage] || stage,
    count: dealsByStage.find((d) => d.stage === stage)?._count || 0,
  }));

  const dateStr = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={dateStr}
        title={`Bonjour ${session?.firstName ?? ""}`}
        description="Votre vue d'ensemble du jour — pipeline, activité et prochaines actions."
      />

      {/* Terrain shortcut — prominent card for field use */}
      <Link
        href="/dashboard/terrain/nouveau"
        className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-emerald-100/60 px-5 py-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover active:scale-[0.99] dark:border-emerald-800/50 dark:from-emerald-900/20 dark:to-emerald-900/10"
      >
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-emerald-800 dark:text-emerald-300">Nouveau repérage terrain</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500">GPS · photos · notes — tout en un formulaire</p>
        </div>
        <svg className="ml-auto h-5 w-5 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </Link>

      {/* Other quick actions — scrollable horizontally on small screens */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        <Link href="/dashboard/biens/nouveau" className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-700 transition-colors active:bg-brand-100 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300 dark:hover:bg-brand-900/40">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Nouveau bien
        </Link>
        <Link href="/dashboard/contacts/nouveau" className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-anthracite-600 transition-colors active:bg-stone-100 hover:bg-stone-50 dark:border-stone-700 dark:bg-anthracite-800 dark:text-stone-300 dark:hover:bg-anthracite-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
          Nouveau contact
        </Link>
        <Link href="/dashboard/demandes/nouvelle" className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-anthracite-600 transition-colors active:bg-stone-100 hover:bg-stone-50 dark:border-stone-700 dark:bg-anthracite-800 dark:text-stone-300 dark:hover:bg-anthracite-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          Nouvelle demande
        </Link>
        <Link href="/dashboard/dossiers/nouveau" className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-anthracite-600 transition-colors active:bg-stone-100 hover:bg-stone-50 dark:border-stone-700 dark:bg-anthracite-800 dark:text-stone-300 dark:hover:bg-anthracite-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
          Nouveau dossier
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Biens totaux"
          value={propertyCount}
          href="/dashboard/biens"
          color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>}
        />
        <KpiCard
          label="Biens actifs"
          value={activePropertyCount}
          href="/dashboard/biens?status=ACTIF"
          color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <KpiCard
          label="Contacts"
          value={contactCount}
          href="/dashboard/contacts"
          color="bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
        />
        <KpiCard
          label="Demandes actives"
          value={searchRequestCount}
          href="/dashboard/demandes"
          color="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>}
        />
        <KpiCard
          label="Dossiers ouverts"
          value={openDealCount}
          href="/dashboard/dossiers"
          color="bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>}
        />
        <KpiCard
          label={overdueTasks > 0 ? "Relances en retard" : "Tout est à jour"}
          value={overdueTasks}
          href="/dashboard/taches"
          color={overdueTasks > 0
            ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
          }
          icon={overdueTasks > 0
            ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          }
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
                <svg className="h-4 w-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
              </div>
              <h2 className="heading-card">Activité (7 jours)</h2>
            </div>
          </CardHeader>
          <CardContent>
            <ActivityChart data={activityData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20">
                  <svg className="h-4 w-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                </div>
                <h2 className="heading-card">Pipeline</h2>
              </div>
              <Link href="/dashboard/dossiers/pipeline" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                Voir le Kanban
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <PipelineMini data={pipelineData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        {/* Upcoming tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <svg className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                </div>
                <h2 className="heading-card">Tâches à venir</h2>
              </div>
              <Link href="/dashboard/taches" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                Voir tout
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentTasks.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 dark:bg-anthracite-800">
                  <svg className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-sm text-stone-400 dark:text-stone-500">Aucune tâche en cours</p>
              </div>
            ) : (
              <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                {recentTasks.map((task) => (
                  <li key={task.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">
                        {task.title}
                      </p>
                      <p className="text-xs text-stone-400 dark:text-stone-500">
                        {task.assignedTo
                          ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                          : "Non assignée"}
                        {task.dueDate && ` · ${formatDateShort(task.dueDate)}`}
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
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h2 className="heading-card">Activité récente</h2>
              </div>
              <Link href="/dashboard/interactions" className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                Voir tout
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentInteractions.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 dark:bg-anthracite-800">
                  <svg className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-sm text-stone-400 dark:text-stone-500">Aucune activité récente</p>
              </div>
            ) : (
              <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                {recentInteractions.map((interaction) => (
                  <li key={interaction.id} className="px-5 py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">
                          {interaction.subject || interaction.type}
                        </p>
                        <p className="text-xs text-stone-400 dark:text-stone-500">
                          {interaction.contact
                            ? `${interaction.contact.firstName} ${interaction.contact.lastName}`
                            : "—"}
                          {interaction.user &&
                            ` · par ${interaction.user.firstName} ${interaction.user.lastName}`}
                        </p>
                      </div>
                      <span className="text-xs text-stone-400 dark:text-stone-500">
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
