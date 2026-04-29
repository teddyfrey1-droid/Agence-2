import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { formatDateShort } from "@/lib/utils";
import { TASK_PRIORITY_LABELS, DEAL_STAGE_LABELS } from "@/lib/constants";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { PipelineMini } from "@/components/dashboard/pipeline-mini";
import { RecentSpotsMap } from "@/components/dashboard/recent-spots-map";
import Link from "next/link";

export default async function DashboardHomePage() {
  const session = await getSession();

  // Build last 7 days range
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  // Today window (for "Mode matin")
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const [
    propertyCount,
    activePropertyCount,
    contactCount,
    searchRequestCount,
    openDealCount,
    overdueTasks,
    propertiesNew7d,
    propertiesNew7to14d,
    contactsNew7d,
    contactsNew7to14d,
    requestsNew7d,
    requestsNew7to14d,
    dealsNew7d,
    dealsNew7to14d,
    propertyDailyCounts,
    contactDailyCounts,
    requestDailyCounts,
    dealDailyCounts,
    recentTasks,
    recentInteractions,
    weekInteractions,
    dealsByStage,
    todaysTasks,
    todaysVisits,
    newHotMatches,
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
    // Δ — items created in the last 7 days vs the previous 7 days
    prisma.property.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.property.count({
      where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
    }),
    prisma.contact.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.contact.count({
      where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
    }),
    prisma.searchRequest.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.searchRequest.count({
      where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
    }),
    prisma.deal.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.deal.count({
      where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
    }),
    // Sparklines — daily creation counts for last 7 days
    prisma.property.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.contact.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.searchRequest.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.deal.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
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
    // Today's relances (tasks due today or overdue)
    prisma.task.findMany({
      where: {
        status: { in: ["A_FAIRE", "EN_COURS"] },
        dueDate: { lte: endOfToday },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 4,
      include: {
        contact: { select: { firstName: true, lastName: true } },
      },
    }),
    // Today's visits
    prisma.event.findMany({
      where: {
        type: "VISITE",
        startAt: { gte: startOfToday, lte: endOfToday },
      },
      orderBy: { startAt: "asc" },
      take: 4,
      include: {
        contact: { select: { firstName: true, lastName: true } },
        property: { select: { title: true, address: true } },
      },
    }),
    // New matches ≥ 75 % created in the last 24h
    prisma.match.findMany({
      where: {
        score: { gte: 75 },
        status: "SUGGERE",
        createdAt: { gte: twentyFourHoursAgo },
      },
      orderBy: { score: "desc" },
      take: 4,
      include: {
        property: { select: { id: true, title: true, city: true } },
        searchRequest: {
          select: {
            reference: true,
            contact: { select: { firstName: true, lastName: true } },
          },
        },
      },
    }),
  ]);

  // Quietly avoids unused-warnings — the 48h marker is reused below.
  void fortyEightHoursAgo;

  // Build daily count series for sparklines (Sun..Sat for last 7 days, oldest → today)
  function dailySeries(rows: { createdAt: Date }[]) {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      return rows.filter((r) => r.createdAt.toISOString().slice(0, 10) === key).length;
    });
  }
  const propertySpark = dailySeries(propertyDailyCounts);
  const contactSpark = dailySeries(contactDailyCounts);
  const requestSpark = dailySeries(requestDailyCounts);
  const dealSpark = dailySeries(dealDailyCounts);

  function delta(curr: number, prev: number) {
    return curr - prev;
  }

  const recentSpots = await prisma.fieldSpotting.findMany({
    where: { latitude: { not: null }, longitude: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, latitude: true, longitude: true, address: true, createdAt: true },
  });
  const mapSpots = recentSpots
    .filter((s): s is typeof s & { latitude: number; longitude: number } =>
      s.latitude != null && s.longitude != null
    )
    .map((s) => ({
      id: s.id,
      lat: s.latitude,
      lng: s.longitude,
      address: s.address,
      createdAt: s.createdAt,
    }));

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

  const hour = now.getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const morningItems = todaysTasks.length + todaysVisits.length + newHotMatches.length;

  // Hero summary stats — compact actionable counters next to the greeting
  const summaryItems = [
    {
      label: "Visites aujourd’hui",
      value: todaysVisits.length,
      tone: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Relances dues",
      value: todaysTasks.length,
      tone: todaysTasks.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-stone-500 dark:text-stone-400",
    },
    {
      label: "Matches chauds 24 h",
      value: newHotMatches.length,
      tone: newHotMatches.length > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-stone-500 dark:text-stone-400",
    },
    {
      label: "Retards",
      value: overdueTasks,
      tone: overdueTasks > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={dateStr}
        title={`${greeting} ${session?.firstName ?? ""}`}
        description="Votre vue d'ensemble du jour — pipeline, activité et prochaines actions."
        meta={
          <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {summaryItems.map((s) => (
              <div key={s.label} className="flex items-baseline gap-2">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  {s.label}
                </dt>
                <dd className={`font-display text-lg font-semibold tabular-nums ${s.tone}`}>
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        }
      />

      {/* ── Mode matin — 3 blocs actionnables ── */}
      {morningItems > 0 && (
        <section aria-label="Mode matin — actions du jour">
          <div className="mb-2 flex items-center gap-2 px-1">
            <span className="label-overline">Mode matin</span>
            <span className="h-px flex-1 bg-gradient-to-r from-brand-300/60 via-stone-200 to-transparent dark:from-brand-700/40 dark:via-anthracite-800" />
            <span className="text-[10.5px] font-medium uppercase tracking-wider text-stone-400">
              {morningItems} action{morningItems > 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            {/* Relances — amber accent (urgence) */}
            <Link
              href="/dashboard/taches"
              className="group flex flex-col rounded-2xl border border-stone-200/70 bg-white p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300/60 hover:shadow-card-hover dark:border-anthracite-800 dark:bg-anthracite-900 dark:hover:border-amber-700/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-900/30">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                    Relances
                  </p>
                  <p className="font-display text-2xl font-bold leading-none tracking-tight text-anthracite-900 dark:text-stone-100">
                    {todaysTasks.length}
                  </p>
                </div>
              </div>
              {todaysTasks.length === 0 ? (
                <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">Aucune relance aujourd&apos;hui.</p>
              ) : (
                <ul className="mt-3 space-y-1.5">
                  {todaysTasks.slice(0, 3).map((t) => (
                    <li key={t.id} className="flex items-baseline gap-2 truncate text-xs text-anthracite-700 dark:text-stone-300">
                      <span className="h-1 w-1 flex-shrink-0 rounded-full bg-amber-500" />
                      <span className="truncate font-medium">{t.title}</span>
                      {t.contact && (
                        <span className="truncate text-stone-400 dark:text-stone-500">
                          · {t.contact.firstName} {t.contact.lastName}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <span className="mt-auto pt-3 text-xs font-medium text-amber-700 transition-colors group-hover:text-amber-800 dark:text-amber-400">
                Voir toutes →
              </span>
            </Link>

            {/* Visites — blue accent (planning) */}
            <Link
              href="/dashboard/visites"
              className="group flex flex-col rounded-2xl border border-stone-200/70 bg-white p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300/60 hover:shadow-card-hover dark:border-anthracite-800 dark:bg-anthracite-900 dark:hover:border-blue-700/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-900/30">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                    Visites du jour
                  </p>
                  <p className="font-display text-2xl font-bold leading-none tracking-tight text-anthracite-900 dark:text-stone-100">
                    {todaysVisits.length}
                  </p>
                </div>
              </div>
              {todaysVisits.length === 0 ? (
                <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">Aucune visite prévue aujourd&apos;hui.</p>
              ) : (
                <ul className="mt-3 space-y-1.5">
                  {todaysVisits.slice(0, 3).map((v) => (
                    <li key={v.id} className="flex items-baseline gap-2 truncate text-xs text-anthracite-700 dark:text-stone-300">
                      <span className="font-mono text-[11px] font-semibold tabular-nums text-blue-700 dark:text-blue-400">
                        {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(v.startAt)}
                      </span>
                      <span className="truncate text-stone-500 dark:text-stone-400">
                        · {v.property?.title || v.title}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <span className="mt-auto pt-3 text-xs font-medium text-blue-700 transition-colors group-hover:text-blue-800 dark:text-blue-400">
                Voir l&apos;agenda →
              </span>
            </Link>

            {/* Matches chauds — emerald accent (succès) */}
            <Link
              href="/dashboard/matches"
              className="group flex flex-col rounded-2xl border border-stone-200/70 bg-white p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300/60 hover:shadow-card-hover dark:border-anthracite-800 dark:bg-anthracite-900 dark:hover:border-emerald-700/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-900/30">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                    Matches chauds
                  </p>
                  <p className="font-display text-2xl font-bold leading-none tracking-tight text-anthracite-900 dark:text-stone-100">
                    {newHotMatches.length}
                  </p>
                </div>
              </div>
              {newHotMatches.length === 0 ? (
                <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">Aucun match ≥ 75 % depuis 24 h.</p>
              ) : (
                <ul className="mt-3 space-y-1.5">
                  {newHotMatches.slice(0, 3).map((m) => (
                    <li key={m.id} className="flex items-baseline gap-2 truncate text-xs text-anthracite-700 dark:text-stone-300">
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {m.score}%
                      </span>
                      <span className="truncate text-stone-500 dark:text-stone-400">{m.property.title}</span>
                    </li>
                  ))}
                </ul>
              )}
              <span className="mt-auto pt-3 text-xs font-medium text-emerald-700 transition-colors group-hover:text-emerald-800 dark:text-emerald-400">
                Voir les matches →
              </span>
            </Link>
          </div>
        </section>
      )}

      {/* Quick actions — terrain en avant, créations à droite */}
      <section aria-label="Actions rapides">
        <div className="mb-2 flex items-center gap-2 px-1">
          <span className="label-overline">Actions rapides</span>
          <span className="h-px flex-1 bg-gradient-to-r from-brand-300/60 via-stone-200 to-transparent dark:from-brand-700/40 dark:via-anthracite-800" />
        </div>
        <div className="grid gap-3 lg:grid-cols-5">
          {/* Terrain — primary action, larger */}
          <Link
            href="/dashboard/terrain/nouveau"
            className="group relative col-span-1 flex items-center gap-4 overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-emerald-100/50 px-5 py-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover active:scale-[0.99] lg:col-span-2 dark:border-emerald-800/50 dark:from-emerald-900/20 dark:to-emerald-900/10"
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Repérage terrain</p>
              <p className="mt-0.5 text-[11px] text-emerald-600/90 dark:text-emerald-500/90">
                GPS · photos · notes en un seul formulaire
              </p>
            </div>
            <svg className="ml-auto h-4 w-4 flex-shrink-0 text-emerald-400 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>

          {[
            { href: "/dashboard/biens/nouveau", label: "Nouveau bien", iconPath: "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21" },
            { href: "/dashboard/contacts/nouveau", label: "Nouveau contact", iconPath: "M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" },
            { href: "/dashboard/demandes/nouvelle", label: "Nouvelle demande", iconPath: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" },
            { href: "/dashboard/dossiers/nouveau", label: "Nouveau dossier", iconPath: "M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group flex items-center gap-3 rounded-2xl border border-stone-200/70 bg-white px-4 py-3.5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200/70 hover:shadow-card-hover dark:border-anthracite-800 dark:bg-anthracite-900 dark:hover:border-brand-700/40"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-transform group-hover:scale-105 dark:bg-brand-900/30 dark:text-brand-400 dark:ring-brand-900/40">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={a.iconPath} />
                </svg>
              </div>
              <span className="flex-1 text-sm font-medium text-anthracite-800 dark:text-stone-200">{a.label}</span>
              <svg className="h-4 w-4 flex-shrink-0 text-stone-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-500 dark:text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>
      </section>

      {/* KPIs — overview at-a-glance, with 7d delta + sparkline */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Biens totaux"
          value={propertyCount}
          href="/dashboard/biens"
          tone="blue"
          delta={delta(propertiesNew7d, propertiesNew7to14d)}
          deltaLabel="vs 7j"
          sparkline={propertySpark}
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21" /></svg>}
        />
        <StatCard
          label="Biens actifs"
          value={activePropertyCount}
          href="/dashboard/biens?status=ACTIF"
          tone="emerald"
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Contacts"
          value={contactCount}
          href="/dashboard/contacts"
          tone="violet"
          delta={delta(contactsNew7d, contactsNew7to14d)}
          deltaLabel="vs 7j"
          sparkline={contactSpark}
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
        />
        <StatCard
          label="Demandes actives"
          value={searchRequestCount}
          href="/dashboard/demandes"
          tone="amber"
          delta={delta(requestsNew7d, requestsNew7to14d)}
          deltaLabel="vs 7j"
          sparkline={requestSpark}
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>}
        />
        <StatCard
          label="Dossiers ouverts"
          value={openDealCount}
          href="/dashboard/dossiers"
          tone="brand"
          delta={delta(dealsNew7d, dealsNew7to14d)}
          deltaLabel="vs 7j"
          sparkline={dealSpark}
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>}
        />
        <StatCard
          label={overdueTasks > 0 ? "Relances en retard" : "Tout est à jour"}
          value={overdueTasks}
          href="/dashboard/taches"
          tone={overdueTasks > 0 ? "red" : "emerald"}
          icon={overdueTasks > 0
            ? <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            : <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          }
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <h2 className="heading-card">Sur le terrain</h2>
            </div>
          </CardHeader>
          <CardContent>
            <RecentSpotsMap spots={mapSpots} />
          </CardContent>
        </Card>

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
