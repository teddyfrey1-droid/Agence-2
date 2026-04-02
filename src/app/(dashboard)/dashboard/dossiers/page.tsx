import Link from "next/link";
import { findDeals } from "@/modules/deals";
import { formatPrice, formatDateShort } from "@/lib/utils";
import { DEAL_STAGE_LABELS } from "@/lib/constants";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">Dossiers</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">{total} dossier(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/export?type=deals" download>
            <Button variant="outline" size="sm">
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              CSV
            </Button>
          </a>
          <Link href="/dashboard/dossiers/pipeline">
            <Button variant="outline">
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Pipeline
            </Button>
          </Link>
          <Link href="/dashboard/dossiers/nouveau">
            <Button>Nouveau dossier</Button>
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Aucun dossier" description="Creez votre premier dossier de transaction." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50 dark:border-stone-700/50 dark:bg-anthracite-800/50">
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Reference</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Titre</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Bien</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Contact</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Etape</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Valeur</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Assigne</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Modifie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {items.map((deal) => (
                  <tr key={deal.id} className="transition-colors hover:bg-stone-50 dark:hover:bg-anthracite-800/50">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/dossiers/${deal.id}`} className="font-mono text-xs text-brand-600 hover:underline dark:text-brand-400">
                        {deal.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-anthracite-800 dark:text-stone-200">{deal.title}</td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                      {deal.property ? deal.property.title : "—"}
                    </td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                      {deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(deal.stage)}>
                        {DEAL_STAGE_LABELS[deal.stage] || deal.stage}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-anthracite-800 dark:text-stone-200">
                      {formatPrice(deal.estimatedValue)}
                    </td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                      {deal.assignedTo ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-stone-400 dark:text-stone-500">{formatDateShort(deal.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath="/dashboard/dossiers" params={{ stage: params.stage, search: params.search }} />
    </div>
  );
}
