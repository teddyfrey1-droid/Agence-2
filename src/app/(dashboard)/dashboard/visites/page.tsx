import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Visites" };

function formatDay(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function VisitesPage() {
  const today = startOfToday();
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [upcoming, recent, countThisWeek] = await Promise.all([
    prisma.event.findMany({
      where: {
        type: "VISITE",
        startAt: { gte: today, lte: in30Days },
      },
      orderBy: { startAt: "asc" },
      take: 50,
      include: {
        property: { select: { id: true, title: true, reference: true, city: true, district: true } },
        contact: {
          select: { id: true, firstName: true, lastName: true, company: true, phone: true },
        },
        user: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.event.findMany({
      where: {
        type: "VISITE",
        startAt: { gte: sevenDaysAgo, lt: today },
      },
      orderBy: { startAt: "desc" },
      take: 20,
      include: {
        property: { select: { id: true, title: true, reference: true } },
        contact: { select: { firstName: true, lastName: true, company: true } },
        user: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.event.count({
      where: {
        type: "VISITE",
        startAt: {
          gte: today,
          lt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  // Group upcoming by day
  const grouped = new Map<string, typeof upcoming>();
  for (const e of upcoming) {
    const dayKey = new Date(e.startAt).toISOString().slice(0, 10);
    if (!grouped.has(dayKey)) grouped.set(dayKey, []);
    grouped.get(dayKey)!.push(e);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-stone-400 dark:text-stone-500">
            Planificateur
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-anthracite-900 dark:text-stone-100">
            Visites
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {countThisWeek} visite{countThisWeek !== 1 ? "s" : ""} programmée
            {countThisWeek !== 1 ? "s" : ""} cette semaine
          </p>
        </div>
        <Link href="/dashboard/calendrier">
          <Button>
            <svg
              className="mr-1.5 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nouvelle visite
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat label="À venir (30 j)" value={upcoming.length} />
        <MiniStat label="Cette semaine" value={countThisWeek} />
        <MiniStat label="Derniers 7 j" value={recent.length} />
      </div>

      {/* Upcoming grouped by day */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          À venir
        </h2>
        {grouped.size === 0 ? (
          <EmptyState
            title="Aucune visite programmée"
            description="Créez une visite depuis le calendrier ou la fiche d'un bien."
            action={
              <Link href="/dashboard/calendrier">
                <Button>Ouvrir le calendrier</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-5">
            {Array.from(grouped.entries()).map(([day, events]) => {
              const date = new Date(day);
              const isToday = day === today.toISOString().slice(0, 10);
              return (
                <div key={day}>
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isToday
                          ? "bg-brand-600 text-white"
                          : "bg-stone-100 text-anthracite-700 dark:bg-anthracite-800 dark:text-stone-300"
                      }`}
                    >
                      {isToday ? "Aujourd'hui" : formatDay(date)}
                    </span>
                    <span className="text-xs text-stone-400">
                      {events.length} visite{events.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {events.map((e) => {
                      const contactName = e.contact
                        ? [e.contact.firstName, e.contact.lastName].filter(Boolean).join(" ").trim() ||
                          e.contact.company ||
                          "—"
                        : null;
                      return (
                        <Card key={e.id} className="p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-start gap-3">
                              <div className="flex h-12 w-16 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                                <span className="text-[10px] uppercase tracking-wider">
                                  {e.allDay ? "Journée" : formatTime(new Date(e.startAt))}
                                </span>
                                {!e.allDay && e.endAt && (
                                  <span className="text-[10px] text-stone-500">
                                    → {formatTime(new Date(e.endAt))}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-anthracite-900 dark:text-stone-100">
                                  {e.title}
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-500 dark:text-stone-400">
                                  {e.property && (
                                    <Link
                                      href={`/dashboard/biens/${e.property.id}`}
                                      className="inline-flex items-center gap-1 hover:text-brand-700 dark:hover:text-brand-400"
                                    >
                                      <svg
                                        className="h-3 w-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"
                                        />
                                      </svg>
                                      {e.property.reference} — {e.property.title}
                                    </Link>
                                  )}
                                  {contactName && (
                                    <Link
                                      href={e.contact ? `/dashboard/contacts/${e.contact.id}` : "#"}
                                      className="inline-flex items-center gap-1 hover:text-brand-700 dark:hover:text-brand-400"
                                    >
                                      <svg
                                        className="h-3 w-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                      </svg>
                                      {contactName}
                                    </Link>
                                  )}
                                  {e.contact?.phone && (
                                    <a
                                      href={`tel:${e.contact.phone}`}
                                      className="inline-flex items-center gap-1 hover:text-brand-700 dark:hover:text-brand-400"
                                    >
                                      <svg
                                        className="h-3 w-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11 11 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                        />
                                      </svg>
                                      {e.contact.phone}
                                    </a>
                                  )}
                                </div>
                                {e.description && (
                                  <p className="mt-1.5 line-clamp-2 text-xs text-stone-500 dark:text-stone-400">
                                    {e.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {e.user && (
                                <Badge variant="neutral">
                                  Agent : {e.user.firstName} {e.user.lastName}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent */}
      {recent.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Récentes (7 derniers jours)
          </h2>
          <div className="rounded-xl border border-stone-200/80 bg-white dark:border-anthracite-800 dark:bg-anthracite-900">
            <ul className="divide-y divide-stone-100 dark:divide-anthracite-800">
              {recent.map((e) => {
                const contactName = e.contact
                  ? [e.contact.firstName, e.contact.lastName].filter(Boolean).join(" ").trim() ||
                    e.contact.company
                  : null;
                return (
                  <li key={e.id} className="flex items-center gap-3 p-3 text-sm">
                    <span className="text-xs text-stone-400">
                      {formatDateTime(new Date(e.startAt))}
                    </span>
                    <span className="truncate font-medium text-anthracite-800 dark:text-stone-200">
                      {e.title}
                    </span>
                    {e.property && (
                      <Link
                        href={`/dashboard/biens/${e.property.id}`}
                        className="truncate text-xs text-stone-500 hover:text-brand-700"
                      >
                        {e.property.reference}
                      </Link>
                    )}
                    {contactName && (
                      <span className="truncate text-xs text-stone-400">· {contactName}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-stone-200/80 bg-white p-4 dark:border-anthracite-800 dark:bg-anthracite-900">
      <p className="text-[11px] uppercase tracking-widest text-stone-500 dark:text-stone-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-anthracite-900 dark:text-stone-100">{value}</p>
    </div>
  );
}
