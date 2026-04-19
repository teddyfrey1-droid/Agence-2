import Link from "next/link";
import { findDeals } from "@/modules/deals";
import { formatPrice, formatDateShort } from "@/lib/utils";
import { DEAL_STAGE_LABELS } from "@/lib/constants";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";

export default async function DossiersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; stage?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const { items, total, totalPages } = await findDeals(
    { stage: params.stage, search: params.search },
    page
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Pipeline"
        title="Dossiers"
        description={`${total} dossier${total !== 1 ? "s" : ""} de transaction en cours de suivi.`}
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
        }
        actions={
          <>
            <a href="/api/export?type=deals" download>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                CSV
              </Button>
            </a>
            <Link href="/dashboard/dossiers/pipeline">
              <Button variant="outline" className="hidden sm:inline-flex">
                <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                Pipeline
              </Button>
            </Link>
            <Link href="/dashboard/dossiers/nouveau">
              <Button className="whitespace-nowrap">
                <span className="hidden sm:inline">Nouveau dossier</span>
                <span className="sm:hidden">+ Dossier</span>
              </Button>
            </Link>
          </>
        }
      />

      {items.length === 0 ? (
        <EmptyState title="Aucun dossier" description="Creez votre premier dossier de transaction." />
      ) : (
        <>
          {/* Mobile: card view */}
          <div className="space-y-3 lg:hidden">
            {items.map((deal) => (
              <Link key={deal.id} href={`/dashboard/dossiers/${deal.id}`}>
                <Card className="p-4 active:bg-stone-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-anthracite-800 dark:text-stone-200">{deal.title}</p>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                        {deal.property ? deal.property.title : "Pas de bien lié"}
                        {deal.contact && ` · ${deal.contact.firstName} ${deal.contact.lastName}`}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(deal.stage)}>
                      {DEAL_STAGE_LABELS[deal.stage] || deal.stage}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-stone-400 dark:text-stone-500">
                    <span className="font-mono">{deal.reference}</span>
                    {deal.estimatedValue && (
                      <span className="font-semibold text-anthracite-800 dark:text-stone-200">{formatPrice(deal.estimatedValue)}</span>
                    )}
                    <span className="ml-auto">{formatDateShort(deal.updatedAt)}</span>
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
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Titre</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Bien</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Contact</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Étape</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Valeur</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Assigné</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Modifié</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-700/50">
                  {items.map((deal) => (
                    <tr key={deal.id} className="hover:bg-stone-50 dark:hover:bg-anthracite-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/dossiers/${deal.id}`} className="font-mono text-xs text-brand-600 hover:underline dark:text-brand-400">
                          {deal.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-anthracite-800 dark:text-stone-200">{deal.title}</td>
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{deal.property ? deal.property.title : "—"}</td>
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : "—"}</td>
                      <td className="px-4 py-3"><Badge variant={getStatusBadgeVariant(deal.stage)}>{DEAL_STAGE_LABELS[deal.stage] || deal.stage}</Badge></td>
                      <td className="px-4 py-3 font-medium text-anthracite-800 dark:text-stone-200">{formatPrice(deal.estimatedValue)}</td>
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{deal.assignedTo ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}` : "—"}</td>
                      <td className="px-4 py-3 text-stone-400 dark:text-stone-500">{formatDateShort(deal.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath="/dashboard/dossiers" params={{ stage: params.stage, search: params.search }} />
    </div>
  );
}
