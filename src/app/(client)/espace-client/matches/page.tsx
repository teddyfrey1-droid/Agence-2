import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatSurface } from "@/lib/utils";
import {
  PROPERTY_TYPE_LABELS,
  TRANSACTION_TYPE_LABELS,
  SEARCH_REQUEST_STATUS_LABELS,
} from "@/lib/constants";
import Link from "next/link";

// Cap per search request so a user with a poorly-scoped request can't trigger
// a page that renders hundreds of cards.
const MATCHES_PER_REQUEST = 30;

const MATCH_STATUS_LABELS: Record<string, string> = {
  SUGGERE: "Suggéré",
  VALIDE: "Validé",
  REJETE: "Rejeté",
  EN_VISITE: "En visite",
  RETENU: "Retenu",
};

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 70
      ? "text-emerald-500 dark:text-emerald-400"
      : score >= 40
        ? "text-amber-500 dark:text-amber-400"
        : "text-red-500 dark:text-red-400";

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-stone-200 dark:stroke-stone-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`stroke-current ${color}`}
        />
      </svg>
      <span className={`absolute text-sm font-bold ${color}`}>{score}</span>
    </div>
  );
}

function getMatchStatusBadgeVariant(status: string) {
  switch (status) {
    case "VALIDE":
    case "RETENU":
      return "success" as const;
    case "EN_VISITE":
      return "warning" as const;
    case "REJETE":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

export default async function ClientMatchesPage() {
  const session = await getSession();
  if (!session) return null;

  const searchRequests = await prisma.searchRequest.findMany({
    where: {
      contact: { email: session.email },
      status: { notIn: ["ABANDONNEE", "ARCHIVEE"] },
    },
    include: {
      matches: {
        // Hide matches the user rejected / that the agent rejected
        where: { status: { notIn: ["REJETE"] } },
        include: {
          property: {
            include: {
              media: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
        orderBy: { score: "desc" },
        take: MATCHES_PER_REQUEST,
      },
      _count: { select: { matches: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const allMatches = searchRequests.flatMap((sr) =>
    sr.matches.map((m) => ({ ...m, searchRequest: sr }))
  );
  allMatches.sort((a, b) => b.score - a.score);

  const totalMatches = allMatches.length;
  const highScoreMatches = allMatches.filter((m) => m.score >= 70).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">
          Mes matches
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Biens correspondant a vos criteres de recherche, classes par score de
          compatibilite.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 dark:border-stone-700 dark:bg-anthracite-800">
          <span className="text-2xl font-bold text-anthracite-900 dark:text-stone-100">
            {totalMatches}
          </span>
          <span className="text-sm text-stone-500 dark:text-stone-400">
            match{totalMatches !== 1 ? "es" : ""} au total
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 dark:border-emerald-800/30 dark:bg-emerald-900/20">
          <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {highScoreMatches}
          </span>
          <span className="text-sm text-emerald-600 dark:text-emerald-400">
            score eleve (70+)
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 dark:border-stone-700 dark:bg-anthracite-800">
          <span className="text-2xl font-bold text-anthracite-900 dark:text-stone-100">
            {searchRequests.length}
          </span>
          <span className="text-sm text-stone-500 dark:text-stone-400">
            demande{searchRequests.length !== 1 ? "s" : ""} active
            {searchRequests.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Empty state */}
      {allMatches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 dark:bg-anthracite-800">
              <svg
                className="h-8 w-8 text-stone-400 dark:text-stone-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-anthracite-900 dark:text-stone-100">
              Aucun match pour le moment
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-stone-500 dark:text-stone-400">
              {searchRequests.length === 0
                ? "Creez une demande de recherche pour que nous puissions vous proposer des biens correspondant a vos criteres."
                : "Nous analysons votre demande et vous proposerons des biens des qu'une correspondance sera trouvee."}
            </p>
            <Link href="/espace-client/recherche">
              <Button variant="primary" size="md" className="mt-6">
                {searchRequests.length === 0
                  ? "Creer une demande"
                  : "Modifier mes criteres"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Group by search request */}
          {searchRequests
            .filter((sr) => sr.matches.length > 0)
            .map((sr) => (
              <div key={sr.id} className="space-y-3">
                {/* Search request header */}
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-anthracite-900 dark:text-stone-100">
                    {sr.reference}
                  </h2>
                  <Badge variant={getStatusBadgeVariant(sr.status)}>
                    {SEARCH_REQUEST_STATUS_LABELS[sr.status] || sr.status}
                  </Badge>
                  <span className="text-xs text-stone-400 dark:text-stone-500">
                    {sr.propertyTypes
                      .map((pt) => PROPERTY_TYPE_LABELS[pt] || pt)
                      .join(", ")}
                    {sr.transactionType &&
                      ` — ${TRANSACTION_TYPE_LABELS[sr.transactionType] || sr.transactionType}`}
                  </span>
                  <span className="ml-auto text-xs font-medium text-stone-500 dark:text-stone-400">
                    {sr.matches.length} match
                    {sr.matches.length !== 1 ? "es" : ""}
                  </span>
                </div>

                {/* Match cards */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {sr.matches.map((match) => {
                    const photo = match.property.media[0];
                    const displayPrice =
                      match.property.transactionType === "LOCATION"
                        ? match.property.rentMonthly
                          ? `${formatPrice(match.property.rentMonthly)}/mois`
                          : formatPrice(match.property.price)
                        : formatPrice(match.property.price);

                    return (
                      <Link
                        key={match.id}
                        href={`/espace-client/biens/${match.property.id}`}
                      >
                        <Card
                          hover
                          className="h-full overflow-hidden transition-shadow hover:shadow-md"
                        >
                          {/* Photo */}
                          <div className="relative h-40 w-full overflow-hidden">
                            {photo ? (
                              <img
                                src={photo.url}
                                alt={match.property.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 via-brand-50 to-champagne-100 dark:from-brand-900/40 dark:via-anthracite-800 dark:to-champagne-900/20">
                                <svg
                                  className="h-10 w-10 text-brand-300 dark:text-brand-700"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={1}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21"
                                  />
                                </svg>
                              </div>
                            )}
                            {/* Score overlay */}
                            <div className="absolute right-2 top-2">
                              <div className="rounded-full bg-white/90 p-1 shadow-sm backdrop-blur-sm dark:bg-anthracite-900/90">
                                <ScoreRing score={match.score} size={44} />
                              </div>
                            </div>
                            {/* Status badge */}
                            {match.status !== "SUGGERE" && (
                              <div className="absolute left-2 top-2">
                                <Badge
                                  variant={getMatchStatusBadgeVariant(
                                    match.status
                                  )}
                                >
                                  {MATCH_STATUS_LABELS[match.status] ||
                                    match.status}
                                </Badge>
                              </div>
                            )}
                          </div>

                          <CardContent className="space-y-2 py-3">
                            {/* Title & type */}
                            <div>
                              <p className="truncate text-sm font-semibold text-anthracite-900 dark:text-stone-100">
                                {match.property.title}
                              </p>
                              <p className="text-xs text-stone-500 dark:text-stone-400">
                                {match.property.district ||
                                  match.property.city ||
                                  "Paris"}
                                {match.property.zipCode &&
                                  ` (${match.property.zipCode})`}
                              </p>
                            </div>

                            {/* Price & surface */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-anthracite-900 dark:text-stone-100">
                                {displayPrice}
                              </span>
                              {match.property.surfaceTotal && (
                                <span className="text-xs text-stone-500 dark:text-stone-400">
                                  {formatSurface(match.property.surfaceTotal)}
                                </span>
                              )}
                            </div>

                            {/* Type badges */}
                            <div className="flex flex-wrap gap-1">
                              <span className="inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                                {TRANSACTION_TYPE_LABELS[
                                  match.property.transactionType
                                ] || match.property.transactionType}
                              </span>
                              <span className="inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600 dark:bg-anthracite-700 dark:text-stone-400">
                                {PROPERTY_TYPE_LABELS[match.property.type] ||
                                  match.property.type}
                              </span>
                            </div>

                            {/* Match reasons */}
                            {match.reasons.length > 0 && (
                              <div className="border-t border-stone-100 pt-2 dark:border-stone-700/50">
                                <ul className="space-y-0.5">
                                  {match.reasons.slice(0, 3).map((reason, i) => (
                                    <li
                                      key={i}
                                      className="flex items-start gap-1.5 text-[11px] text-stone-500 dark:text-stone-400"
                                    >
                                      <svg
                                        className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500 dark:text-emerald-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2.5}
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M4.5 12.75l6 6 9-13.5"
                                        />
                                      </svg>
                                      {reason}
                                    </li>
                                  ))}
                                  {match.reasons.length > 3 && (
                                    <li className="text-[11px] text-stone-400 dark:text-stone-500">
                                      +{match.reasons.length - 3} autre
                                      {match.reasons.length - 3 > 1 ? "s" : ""}
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

          {/* No matches CTA if some search requests have 0 matches */}
          {searchRequests.some((sr) => sr.matches.length === 0) && (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">
                    Certaines demandes n&apos;ont pas encore de correspondances
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Nous vous notifierons des qu&apos;un bien correspondra a vos
                    criteres.
                  </p>
                </div>
                <Link href="/espace-client/recherche">
                  <Button variant="outline" size="sm">
                    Voir mes demandes
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
