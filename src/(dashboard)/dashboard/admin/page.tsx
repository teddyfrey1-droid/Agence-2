import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/permissions";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Section = {
  title: string;
  description: string;
  href: string;
  icon: string;
  badgeKey?: "users" | "logs" | "notifications" | "access" | "agency";
  accent: string;
};

const adminSections: Section[] = [
  {
    title: "Informations de l'agence",
    description: "SIRET, coordonnées, carte professionnelle, mentions légales.",
    href: "/dashboard/admin/agence",
    badgeKey: "agency",
    accent: "from-brand-300 to-champagne-300",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    title: "Utilisateurs",
    description: "Créer, modifier, inviter et gérer les comptes utilisateurs.",
    href: "/dashboard/admin/utilisateurs",
    badgeKey: "users",
    accent: "from-brand-400 to-brand-500",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    title: "Notifications & Emails",
    description: "Configurer les notifications push et emails par événement.",
    href: "/dashboard/admin/notifications",
    badgeKey: "notifications",
    accent: "from-champagne-400 to-brand-400",
    icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
  },
  {
    title: "Gestion des accès",
    description: "Permissions par rôle et personnalisation par utilisateur.",
    href: "/dashboard/admin/acces",
    badgeKey: "access",
    accent: "from-brand-500 to-anthracite-700",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    title: "Journal d'activité",
    description: "Consulter l'historique des actions et audit.",
    href: "/dashboard/admin/journal",
    badgeKey: "logs",
    accent: "from-anthracite-500 to-brand-600",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  },
];

export default async function AdminPage() {
  const session = await getSession();
  if (!session || !canAccessAdmin(session.role)) redirect("/dashboard");

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    pendingInvites,
    loggedInLast24h,
    totalLogs,
    logsLast24h,
    latestLog,
    activeNotifications,
    lastLogin,
  ] = await Promise.all([
    prisma.user.count().catch(() => 0),
    prisma.user.count({ where: { isActive: true, isActivated: true } }).catch(() => 0),
    prisma.user.count({ where: { invitedAt: { not: null }, isActivated: false } }).catch(() => 0),
    prisma.user.count({ where: { lastLoginAt: { gte: twentyFourHoursAgo } } }).catch(() => 0),
    prisma.auditLog.count().catch(() => 0),
    prisma.auditLog.count({ where: { createdAt: { gte: twentyFourHoursAgo } } }).catch(() => 0),
    prisma.auditLog
      .findFirst({
        orderBy: { createdAt: "desc" },
        include: { user: { select: { firstName: true, lastName: true } } },
      })
      .catch(() => null),
    prisma.notificationSetting
      .count({ where: { OR: [{ pushEnabled: true }, { emailEnabled: true }] } })
      .catch(() => 0),
    prisma.user
      .findFirst({
        where: { lastLoginAt: { not: null } },
        orderBy: { lastLoginAt: "desc" },
        select: { firstName: true, lastName: true, lastLoginAt: true },
      })
      .catch(() => null),
  ]);

  const badges: Record<NonNullable<Section["badgeKey"]>, number | null> = {
    users: totalUsers,
    logs: logsLast24h > 0 ? logsLast24h : null,
    notifications: activeNotifications > 0 ? activeNotifications : null,
    access: null,
    agency: null,
  };

  const weeklyActive = await prisma.user
    .count({ where: { lastLoginAt: { gte: sevenDaysAgo } } })
    .catch(() => 0);

  const stats = [
    {
      label: "Utilisateurs",
      value: totalUsers,
      sub: `${activeUsers} actifs`,
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      accent: "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30",
    },
    {
      label: "Invitations en attente",
      value: pendingInvites,
      sub: pendingInvites === 1 ? "compte à activer" : "comptes à activer",
      icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      accent: "text-champagne-600 dark:text-champagne-400 bg-champagne-50 dark:bg-champagne-900/20",
    },
    {
      label: "Actifs (24h)",
      value: loggedInLast24h,
      sub: `${weeklyActive} sur 7 jours`,
      icon: "M13 10V3L4 14h7v7l9-11h-7z",
      accent: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20",
      live: true,
    },
    {
      label: "Actions (24h)",
      value: logsLast24h,
      sub: `${totalLogs.toLocaleString("fr-FR")} au total`,
      icon: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3",
      accent: "text-anthracite-700 dark:text-stone-300 bg-stone-100 dark:bg-anthracite-800",
    },
  ];

  const shortcuts = [
    {
      label: "Inviter un utilisateur",
      href: "/dashboard/admin/utilisateurs",
      icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
    },
    {
      label: "Voir le journal",
      href: "/dashboard/admin/journal",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2",
    },
    {
      label: "Permissions",
      href: "/dashboard/admin/acces",
      icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    },
    {
      label: "Emails & push",
      href: "/dashboard/admin/notifications",
      icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    },
  ];

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label-overline animate-reveal-fade">Panneau de contrôle</p>
          <h1 className="mt-1 text-2xl font-semibold text-anthracite-900 dark:text-stone-100">
            Administration
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Paramètres, utilisateurs et gestion du système.
          </p>
        </div>

        {/* Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          {shortcuts.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group inline-flex items-center gap-2 rounded-full border border-stone-200/80 bg-white px-3 py-1.5 text-xs font-medium text-anthracite-700 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-700 hover:shadow-card-hover dark:border-anthracite-700 dark:bg-anthracite-900 dark:text-stone-300 dark:hover:border-brand-600 dark:hover:text-brand-300"
            >
              <svg
                className="h-3.5 w-3.5 text-stone-400 transition-colors group-hover:text-brand-500 dark:text-stone-500 dark:group-hover:text-brand-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
              </svg>
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="animate-admin-card rounded-xl border border-stone-200/80 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover dark:border-anthracite-800 dark:bg-anthracite-900 dark:hover:border-anthracite-700"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
                  {stat.label}
                  {stat.live && (
                    <span className="relative inline-flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-pulse-soft" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                  )}
                </p>
                <p className="mt-1 animate-tick-up text-2xl font-bold tracking-tight text-anthracite-900 dark:text-stone-100">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">{stat.sub}</p>
              </div>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.accent}`}>
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sections grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Sections
          </h2>
          {lastLogin?.lastLoginAt && (
            <p className="text-xs text-stone-400 dark:text-stone-500">
              Dernière connexion : {lastLogin.firstName} {lastLogin.lastName} —{" "}
              {formatDateTime(lastLogin.lastLoginAt)}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminSections.map((section, i) => {
            const badge = section.badgeKey ? badges[section.badgeKey] : null;
            return (
              <Link
                key={section.href}
                href={section.href}
                className="animate-admin-card group"
                style={{ animationDelay: `${150 + i * 60}ms` }}
              >
                <Card hover className="relative h-full overflow-hidden p-5">
                  {/* Accent gradient top bar */}
                  <span
                    className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${section.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-400 dark:group-hover:bg-brand-900/50">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-anthracite-900 dark:text-stone-100">
                          {section.title}
                        </h3>
                        {badge != null && badge > 0 && (
                          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-100 px-1.5 text-[10px] font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                            {badge > 99 ? "99+" : badge}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                        {section.description}
                      </p>
                    </div>
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-stone-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-500 dark:text-stone-600 dark:group-hover:text-brand-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Latest activity */}
      {latestLog && (
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-pulse-soft" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  Dernière action
                </p>
                <p className="mt-0.5 text-sm text-anthracite-800 dark:text-stone-200">
                  <span className="font-medium">
                    {latestLog.user
                      ? `${latestLog.user.firstName} ${latestLog.user.lastName}`
                      : "Système"}
                  </span>{" "}
                  — {latestLog.action}{" "}
                  <span className="text-stone-500 dark:text-stone-400">
                    sur {latestLog.entity}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-stone-400 dark:text-stone-500 sm:inline">
                {formatDateTime(latestLog.createdAt)}
              </span>
              <Link
                href="/dashboard/admin/journal"
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
              >
                Journal complet
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
