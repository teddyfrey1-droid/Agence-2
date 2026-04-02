import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatSurface, formatDateShort } from "@/lib/utils";
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS, SEARCH_REQUEST_STATUS_LABELS } from "@/lib/constants";
import Link from "next/link";

function ScoreRing({ score }: { score: number }) {
  const size = 40;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 70 ? "text-emerald-500 dark:text-emerald-400"
    : score >= 40 ? "text-amber-500 dark:text-amber-400"
    : "text-red-500 dark:text-red-400";

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-stone-200 dark:stroke-stone-700" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={`stroke-current ${color}`} />
      </svg>
      <span className={`absolute text-xs font-bold ${color}`}>{score}</span>
    </div>
  );
}

const STATUS_STEPS = ["NOUVELLE", "QUALIFIEE", "EN_COURS", "SATISFAITE"];
const STATUS_LABELS_SHORT: Record<string, string> = {
  NOUVELLE: "Reçue",
  QUALIFIEE: "Qualifiée",
  EN_COURS: "Recherche",
  SATISFAITE: "Trouvé",
};

function SearchTimeline({ status }: { status: string }) {
  const currentIdx = STATUS_STEPS.indexOf(status);
  const isTerminal = status === "ABANDONNEE" || status === "ARCHIVEE" || status === "EN_PAUSE";

  return (
    <div className="flex items-center gap-1">
      {STATUS_STEPS.map((step, i) => {
        const isDone = currentIdx >= i;
        const isCurrent = currentIdx === i;
        return (
          <div key={step} className="flex items-center gap-1">
            <div className="flex flex-col items-center">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                isDone
                  ? "bg-brand-600 text-white dark:bg-brand-500"
                  : "bg-stone-200 text-stone-400 dark:bg-stone-700 dark:text-stone-500"
              } ${isCurrent ? "ring-2 ring-brand-200 dark:ring-brand-800" : ""}`}>
                {isDone ? (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className="mt-1 text-[9px] text-stone-400 dark:text-stone-500 whitespace-nowrap">{STATUS_LABELS_SHORT[step]}</span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`h-0.5 w-4 sm:w-6 mb-4 ${currentIdx > i ? "bg-brand-600 dark:bg-brand-500" : "bg-stone-200 dark:bg-stone-700"}`} />
            )}
          </div>
        );
      })}
      {isTerminal && (
        <div className="ml-2 mb-4">
          <Badge variant="neutral">{SEARCH_REQUEST_STATUS_LABELS[status]}</Badge>
        </div>
      )}
    </div>
  );
}

export default async function ClientHomePage() {
  const session = await getSession();
  if (!session) return null;

  const now = new Date();

  const [publishedPropertyCount, searchRequests, upcomingEvents] = await Promise.all([
    prisma.property.count({
      where: { status: "ACTIF", isPublished: true, confidentiality: "PUBLIC" },
    }),
    prisma.searchRequest.findMany({
      where: { contact: { email: session.email } },
      include: {
        matches: {
          include: {
            property: {
              include: { media: { where: { isPrimary: true }, take: 1 } },
            },
          },
          orderBy: { score: "desc" },
          take: 5,
        },
        _count: { select: { matches: true } },
      },
    }),
    prisma.event.findMany({
      where: {
        startAt: { gte: now },
        OR: [
          { contact: { email: session.email } },
        ],
      },
      orderBy: { startAt: "asc" },
      take: 3,
    }).catch(() => []),
  ]);

  const totalMatches = searchRequests.reduce((sum, sr) => sum + sr._count.matches, 0);
  const recentMatches = searchRequests.flatMap((sr) => sr.matches).sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">
          Bienvenue, {session.firstName}
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Retrouvez ici vos biens, recherches et correspondances en un coup d&apos;oeil.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Biens disponibles"
          value={publishedPropertyCount}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21" />
            </svg>
          }
        />
        <StatCard
          label="Mes matches"
          value={totalMatches}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Mes demandes"
          value={searchRequests.length}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          }
        />
      </div>

      {/* Search status timeline */}
      {searchRequests.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-anthracite-900 dark:text-stone-100">
                Suivi de mes recherches
              </h2>
              <Link href="/espace-client/recherche" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                Nouvelle demande
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {searchRequests.map((sr) => (
                <div key={sr.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">
                      {sr.transactionType ? TRANSACTION_TYPE_LABELS[sr.transactionType] : "Recherche"}
                      {sr.activity && ` — ${sr.activity}`}
                    </p>
                    <p className="text-xs text-stone-400 dark:text-stone-500">
                      Ref: {sr.reference} &middot; {sr._count.matches} match{sr._count.matches !== 1 ? "es" : ""}
                    </p>
                  </div>
                  <SearchTimeline status={sr.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-anthracite-900 dark:text-stone-100">
              Prochains rendez-vous
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-stone-100 dark:divide-stone-700/50">
              {upcomingEvents.map((ev) => {
                const d = new Date(ev.startAt);
                return (
                  <li key={ev.id} className="flex items-center gap-4 px-4 py-3 sm:px-6">
                    <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/20">
                      <span className="text-[10px] font-semibold uppercase text-brand-600 dark:text-brand-400">
                        {d.toLocaleDateString("fr-FR", { month: "short" })}
                      </span>
                      <span className="text-lg font-bold text-anthracite-900 dark:text-stone-100 -mt-0.5">
                        {d.getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">{ev.title}</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {ev.allDay ? "Journée entière" : d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        {ev.description && ` — ${ev.description}`}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/espace-client/biens">
          <Card hover className="h-full">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-anthracite-800 dark:text-stone-200">Voir les biens</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Parcourir les biens disponibles</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/espace-client/recherche">
          <Card hover className="h-full">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-anthracite-800 dark:text-stone-200">Créer une demande</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Définir vos critères de recherche</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/espace-client/matches">
          <Card hover className="h-full">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-anthracite-800 dark:text-stone-200">Voir mes matches</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Correspondances avec vos critères</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Matches */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-anthracite-900 dark:text-stone-100">
              Derniers matches
            </h2>
            {totalMatches > 0 && (
              <Link href="/espace-client/matches" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
                Voir tout
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentMatches.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-stone-400 dark:text-stone-500">
              Aucun match pour le moment. Créez une demande de recherche pour recevoir des correspondances.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100 dark:divide-stone-700/50">
              {recentMatches.map((match) => (
                <li key={match.id}>
                  <Link
                    href={`/espace-client/biens/${match.property.id}`}
                    className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-stone-50 sm:px-6 dark:hover:bg-anthracite-800/50"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                      {match.property.media[0] ? (
                        <img src={match.property.media[0].url} alt={match.property.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/40">
                          <svg className="h-5 w-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-anthracite-800 dark:text-stone-200">
                        {match.property.title}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {match.property.district || match.property.city}
                        {match.property.price && ` — ${formatPrice(match.property.price)}`}
                        {match.property.surfaceTotal && ` — ${formatSurface(match.property.surfaceTotal)}`}
                      </p>
                    </div>
                    <ScoreRing score={match.score} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
