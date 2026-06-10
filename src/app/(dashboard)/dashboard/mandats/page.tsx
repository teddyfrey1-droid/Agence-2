import Link from "next/link";
import { findMandates, getMandateStats } from "@/modules/mandates";
import { formatDateShort } from "@/lib/utils";
import { MANDATE_KIND_LABELS, MANDATE_STATUS_LABELS } from "@/lib/constants";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";

function contactName(contact: { firstName: string; lastName: string; company: string | null } | null) {
  if (!contact) return "—";
  const name = `${contact.firstName} ${contact.lastName}`.trim();
  return contact.company ? `${name} (${contact.company})` : name;
}

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

function EndDateCell({ endDate, status }: { endDate: Date | null; status: string }) {
  const days = daysUntil(endDate);
  if (!endDate || days === null) return <span className="text-stone-400">—</span>;
  const watched = status === "SIGNE" || status === "ENVOYE";
  return (
    <span className="inline-flex items-center gap-1.5">
      {formatDateShort(endDate)}
      {watched && days <= 30 && days >= 0 && (
        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          J-{days}
        </span>
      )}
      {watched && days < 0 && (
        <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Échu
        </span>
      )}
    </span>
  );
}

export default async function MandatsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; kind?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const [{ items, total, totalPages }, stats] = await Promise.all([
    findMandates({ status: params.status, kind: params.kind, search: params.search }, page),
    getMandateStats(),
  ]);

  const statusFilters = [
    { value: "", label: "Tous" },
    ...Object.entries(MANDATE_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Commercial"
        title="Mandats"
        description={`${total} mandat${total !== 1 ? "s" : ""} — création, signature et suivi des échéances.`}
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M9 8h6M5 21h14a1 1 0 001-1V4a1 1 0 00-1-1H5a1 1 0 00-1 1v16a1 1 0 001 1z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 17.5l1.5 1.5 3-3" />
          </svg>
        }
        actions={
          <Link href="/dashboard/mandats/nouveau">
            <Button className="whitespace-nowrap">
              <span className="hidden sm:inline">Nouveau mandat</span>
              <span className="sm:hidden">+ Mandat</span>
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Mandats signés"
          value={stats.active}
          href="/dashboard/mandats?status=SIGNE"
        />
        <StatCard
          label="Expirent sous 30 j"
          value={stats.expiringSoon}
          href="/dashboard/mandats?status=SIGNE"
        />
        <StatCard
          label="En attente de signature"
          value={stats.awaitingSignature}
          href="/dashboard/mandats?status=ENVOYE"
        />
        <StatCard
          label="Brouillons"
          value={stats.drafts}
          href="/dashboard/mandats?status=BROUILLON"
        />
      </div>

      {/* Status filter chips */}
      <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
        {statusFilters.map((f) => {
          const active = (params.status || "") === f.value;
          const href = f.value ? `/dashboard/mandats?status=${f.value}` : "/dashboard/mandats";
          return (
            <Link
              key={f.value}
              href={href}
              className={`flex-shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-anthracite-900 bg-anthracite-900 text-white dark:border-brand-500 dark:bg-brand-500 dark:text-anthracite-950"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-anthracite-900 dark:border-anthracite-700 dark:bg-anthracite-900 dark:text-stone-400 dark:hover:text-stone-200"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Aucun mandat"
          description="Créez votre premier mandat : choisissez un client, un bien et un type de mandat — le document se génère ensuite en un clic."
        />
      ) : (
        <>
          {/* Mobile: card view */}
          <div className="space-y-3 lg:hidden">
            {items.map((mandate) => (
              <Link key={mandate.id} href={`/dashboard/mandats/${mandate.id}`} className="block">
                <Card className="p-4 transition-colors active:bg-stone-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-anthracite-800 dark:text-stone-200">
                        {MANDATE_KIND_LABELS[mandate.kind] || mandate.kind}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
                        {contactName(mandate.contact)}
                        {mandate.property && ` · ${mandate.property.title}`}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(mandate.status)}>
                      {MANDATE_STATUS_LABELS[mandate.status] || mandate.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-stone-400 dark:text-stone-500">
                    <span className="font-mono">{mandate.reference}</span>
                    <span className="ml-auto">
                      <EndDateCell endDate={mandate.endDate} status={mandate.status} />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Desktop: table */}
          <Card className="hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50 dark:border-stone-700/50 dark:bg-anthracite-800/50">
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Référence</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Client</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Bien</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Statut</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Début</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Échéance</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Créé par</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-700/50">
                  {items.map((mandate) => (
                    <tr key={mandate.id} className="transition-colors hover:bg-stone-50 dark:hover:bg-anthracite-800/50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/mandats/${mandate.id}`}
                          className="font-mono text-xs text-brand-600 hover:underline dark:text-brand-400"
                        >
                          {mandate.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-anthracite-800 dark:text-stone-200">
                        {MANDATE_KIND_LABELS[mandate.kind] || mandate.kind}
                      </td>
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{contactName(mandate.contact)}</td>
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                        {mandate.property ? mandate.property.title : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusBadgeVariant(mandate.status)}>
                          {MANDATE_STATUS_LABELS[mandate.status] || mandate.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{formatDateShort(mandate.startDate)}</td>
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                        <EndDateCell endDate={mandate.endDate} status={mandate.status} />
                      </td>
                      <td className="px-4 py-3 text-stone-400 dark:text-stone-500">
                        {mandate.createdBy ? `${mandate.createdBy.firstName} ${mandate.createdBy.lastName}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath="/dashboard/mandats"
        params={{ status: params.status, kind: params.kind, search: params.search }}
      />
    </div>
  );
}
