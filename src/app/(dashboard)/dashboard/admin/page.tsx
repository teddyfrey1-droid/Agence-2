import Link from "next/link";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatDateShort } from "@/lib/utils";

const adminSections = [
  {
    title: "Informations de l'agence",
    description: "SIRET, coordonnées, carte professionnelle, mentions légales.",
    href: "/dashboard/admin/agence",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    statKey: "agency" as const,
  },
  {
    title: "Utilisateurs",
    description: "Créer, modifier, inviter et gérer les comptes.",
    href: "/dashboard/admin/utilisateurs",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    color: "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400",
    statKey: "users" as const,
  },
  {
    title: "Notifications & Emails",
    description: "Push, emails par événement, rôle et destinataire.",
    href: "/dashboard/admin/notifications",
    icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
    color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    statKey: "notifications" as const,
  },
  {
    title: "Gestion des accès",
    description: "Permissions par rôle et personnalisation par utilisateur.",
    href: "/dashboard/admin/acces",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    statKey: "roles" as const,
  },
  {
    title: "Journal d'activité",
    description: "Historique des actions et audit de sécurité.",
    href: "/dashboard/admin/journal",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    color: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    statKey: "logs" as const,
  },
];

export default async function AdminPage() {
  const [
    totalUsers,
    activeUsers,
    pendingUsers,
    totalLogs,
    recentLogs,
    agency,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: true, lastLoginAt: null } }),
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
    prisma.agency.findFirst({ select: { commercialName: true } }),
  ]);

  // Unique roles in use
  const rolesInUse = await prisma.user.groupBy({
    by: ["role"],
    _count: true,
  });

  const stats = {
    agency: agency?.commercialName ? "Configurée" : "À compléter",
    users: `${activeUsers} actif${activeUsers > 1 ? "s" : ""}`,
    notifications: "Configurable",
    roles: `${rolesInUse.length} rôle${rolesInUse.length > 1 ? "s" : ""}`,
    logs: `${totalLogs} entrée${totalLogs > 1 ? "s" : ""}`,
  };

  return (
    <div className="space-y-6">
      {/* Header with breadcrumb */}
      <div>
        <p className="text-xs font-medium text-brand-500 dark:text-brand-400">Système</p>
        <h1 className="mt-1 text-2xl font-semibold text-anthracite-900 dark:text-stone-100">
          Administration
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Paramètres et gestion du système.
        </p>
      </div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-stone-200/80 bg-white p-3 dark:border-anthracite-800 dark:bg-anthracite-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20">
            <svg className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold text-anthracite-900 dark:text-stone-100">{totalUsers}</p>
            <p className="text-xs text-stone-400 dark:text-stone-500">Utilisateurs</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-stone-200/80 bg-white p-3 dark:border-anthracite-800 dark:bg-anthracite-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
            <svg className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold text-anthracite-900 dark:text-stone-100">{activeUsers}</p>
            <p className="text-xs text-stone-400 dark:text-stone-500">Actifs</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-stone-200/80 bg-white p-3 dark:border-anthracite-800 dark:bg-anthracite-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <svg className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold text-anthracite-900 dark:text-stone-100">{pendingUsers}</p>
            <p className="text-xs text-stone-400 dark:text-stone-500">En attente</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-stone-200/80 bg-white p-3 dark:border-anthracite-800 dark:bg-anthracite-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <svg className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold text-anthracite-900 dark:text-stone-100">{totalLogs}</p>
            <p className="text-xs text-stone-400 dark:text-stone-500">Logs audit</p>
          </div>
        </div>
      </div>

      {/* Admin section cards — staggered entrance */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
        {adminSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card hover className="group relative overflow-hidden p-5 animate-admin-card-in">
              {/* Top accent bar on hover */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-300 via-brand-500 to-champagne-400 opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="flex items-start gap-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${section.color} flex-shrink-0 transition-transform group-hover:scale-110`}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-anthracite-900 dark:text-stone-100">
                      {section.title}
                    </h3>
                    <svg className="h-4 w-4 flex-shrink-0 text-stone-300 transition-transform group-hover:translate-x-0.5 dark:text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    {section.description}
                  </p>
                  {/* Inline stat badge */}
                  <p className="mt-2.5 inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600 dark:bg-anthracite-800 dark:text-stone-400">
                    {stats[section.statKey]}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent activity — quick glance */}
      <Card>
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5 dark:border-anthracite-800">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20">
              <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-anthracite-900 dark:text-stone-100">Dernières actions</h2>
          </div>
          <Link
            href="/dashboard/admin/journal"
            className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Voir tout
          </Link>
        </div>
        <div className="divide-y divide-stone-100 dark:divide-anthracite-800">
          {recentLogs.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 dark:bg-anthracite-800">
                <svg className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-stone-400 dark:text-stone-500">Aucune activité enregistrée</p>
            </div>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-anthracite-800 dark:text-stone-200">
                    {log.action} — {log.resource}
                  </p>
                  <p className="text-xs text-stone-400 dark:text-stone-500">
                    {log.user
                      ? `${log.user.firstName} ${log.user.lastName}`
                      : "Système"}
                  </p>
                </div>
                <span className="flex-shrink-0 text-xs text-stone-400 dark:text-stone-500">
                  {formatDateShort(log.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
