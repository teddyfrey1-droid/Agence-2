import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  PROPERTY_TYPE_LABELS,
  TRANSACTION_TYPE_LABELS,
  SEARCH_REQUEST_STATUS_LABELS,
} from "@/lib/constants";
import { formatPrice, formatSurface } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Matches" };

function scoreColor(s: number) {
  if (s >= 80) return "bg-emerald-500";
  if (s >= 60) return "bg-brand-500";
  if (s >= 40) return "bg-champagne-500";
  return "bg-stone-400";
}

function scoreLabel(s: number) {
  if (s >= 80) return "Excellent";
  if (s >= 60) return "Bon";
  if (s >= 40) return "Moyen";
  return "Faible";
}

export default async function MatchesHubPage() {
  const matches = await prisma.match.findMany({
    where: {
      status: { in: ["SUGGERE", "VALIDE", "EN_VISITE"] },
      property: { status: { in: ["ACTIF", "EN_NEGOCIATION"] } },
      searchRequest: { status: { in: ["NOUVELLE", "QUALIFIEE", "EN_COURS"] } },
    },
    orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
    take: 100,
    include: {
      property: {
        select: {
          id: true,
          reference: true,
          title: true,
          type: true,
          transactionType: true,
          surfaceTotal: true,
          price: true,
          rentMonthly: true,
          city: true,
          district: true,
          assignedTo: { select: { firstName: true, lastName: true } },
          media: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      },
      searchRequest: {
        select: {
          id: true,
          reference: true,
          status: true,
          activity: true,
          contact: { select: { firstName: true, lastName: true, company: true } },
          assignedTo: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  const stats = {
    total: matches.length,
    excellent: matches.filter((m) => m.score >= 80).length,
    good: matches.filter((m) => m.score >= 60 && m.score < 80).length,
    suggested: matches.filter((m) => m.status === "SUGGERE").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-stone-400 dark:text-stone-500">
          Moteur de matching
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-anthracite-900 dark:text-stone-100">
          Matches actifs
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Correspondances bien ⇄ demande triées par score — recalculées automatiquement à chaque
          création ou modification.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Total" value={stats.total} tone="default" />
        <StatTile label="Excellents (≥80)" value={stats.excellent} tone="success" />
        <StatTile label="Bons (60–79)" value={stats.good} tone="brand" />
        <StatTile label="À examiner" value={stats.suggested} tone="info" />
      </div>

      {matches.length === 0 ? (
        <EmptyState
          title="Aucun match actif"
          description="Créez un bien ou une demande : le moteur cherche automatiquement les correspondances."
        />
      ) : (
        <div className="space-y-2">
          {matches.map((m) => {
            const priceStr =
              m.property.transactionType === "LOCATION"
                ? m.property.rentMonthly
                  ? `${formatPrice(m.property.rentMonthly)}/mois`
                  : "—"
                : formatPrice(m.property.price);
            const contactName = m.searchRequest.contact
              ? [m.searchRequest.contact.firstName, m.searchRequest.contact.lastName]
                  .filter(Boolean)
                  .join(" ")
                  .trim() || m.searchRequest.contact.company || "—"
              : "—";
            return (
              <Card key={m.id} className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  {/* Score */}
                  <div className="flex items-center gap-3 lg:w-40">
                    <div
                      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-white font-bold ${scoreColor(
                        m.score,
                      )}`}
                    >
                      {m.score}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-anthracite-800 dark:text-stone-200">
                        {scoreLabel(m.score)}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-stone-400">
                        Score / 100
                      </p>
                    </div>
                  </div>

                  {/* Property */}
                  <Link
                    href={`/dashboard/biens/${m.property.id}`}
                    className="flex min-w-0 flex-1 gap-3 rounded-lg p-2 hover:bg-stone-50 dark:hover:bg-anthracite-800"
                  >
                    {m.property.media[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.property.media[0].url}
                        alt=""
                        className="h-14 w-14 flex-shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-14 w-14 flex-shrink-0 rounded-md bg-stone-100 dark:bg-anthracite-800" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-wider text-stone-400">Bien</p>
                      <p className="truncate text-sm font-semibold text-anthracite-900 dark:text-stone-100">
                        {m.property.title}
                      </p>
                      <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                        {PROPERTY_TYPE_LABELS[m.property.type] || m.property.type} ·{" "}
                        {TRANSACTION_TYPE_LABELS[m.property.transactionType]} ·{" "}
                        {m.property.district || m.property.city}
                        {m.property.surfaceTotal
                          ? ` · ${formatSurface(m.property.surfaceTotal)}`
                          : ""}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-brand-700 dark:text-brand-400">
                        {priceStr}
                      </p>
                    </div>
                  </Link>

                  {/* Request */}
                  <Link
                    href={`/dashboard/demandes/${m.searchRequest.id}`}
                    className="flex min-w-0 flex-1 gap-3 rounded-lg p-2 hover:bg-stone-50 dark:hover:bg-anthracite-800"
                  >
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md bg-champagne-50 text-champagne-600 dark:bg-champagne-900/30 dark:text-champagne-400">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-wider text-stone-400">
                        Demande
                      </p>
                      <p className="truncate text-sm font-semibold text-anthracite-900 dark:text-stone-100">
                        {contactName}
                      </p>
                      <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                        {m.searchRequest.reference}
                        {m.searchRequest.activity ? ` · ${m.searchRequest.activity}` : ""}
                      </p>
                      <Badge variant="neutral" className="mt-1">
                        {SEARCH_REQUEST_STATUS_LABELS[m.searchRequest.status] ||
                          m.searchRequest.status}
                      </Badge>
                    </div>
                  </Link>

                  {/* Reasons */}
                  {m.reasons.length > 0 && (
                    <div className="lg:w-48">
                      <p className="text-[10px] uppercase tracking-wider text-stone-400">
                        Raisons
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {m.reasons.slice(0, 3).map((r) => (
                          <li
                            key={r}
                            className="flex items-start gap-1.5 text-xs text-stone-600 dark:text-stone-400"
                          >
                            <span className="mt-[5px] h-1 w-1 flex-shrink-0 rounded-full bg-emerald-500" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "success" | "brand" | "info";
}) {
  const colorMap = {
    default: "bg-stone-100 text-stone-700 dark:bg-anthracite-800 dark:text-stone-300",
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    brand: "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300",
    info: "bg-champagne-50 text-champagne-700 dark:bg-champagne-900/30 dark:text-champagne-300",
  } as const;
  return (
    <div className="rounded-xl border border-stone-200/80 bg-white p-4 dark:border-anthracite-800 dark:bg-anthracite-900">
      <p className="text-[11px] uppercase tracking-widest text-stone-500 dark:text-stone-400">
        {label}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-2xl font-bold text-anthracite-900 dark:text-stone-100">{value}</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${colorMap[tone]}`}>
          {value > 0 ? "Actif" : "—"}
        </span>
      </div>
    </div>
  );
}
