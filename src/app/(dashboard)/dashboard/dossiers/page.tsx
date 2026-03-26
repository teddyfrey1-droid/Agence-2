import Link from "next/link";
import { findDeals } from "@/modules/deals";
import { formatPrice, formatDateShort } from "@/lib/utils";
import { DEAL_STAGE_LABELS } from "@/lib/constants";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function DossiersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; stage?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const { items, total } = await findDeals(
    { stage: params.stage, search: params.search },
    page
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-anthracite-900 sm:text-2xl">Dossiers</h1>
          <p className="text-sm text-stone-500">{total} dossier(s)</p>
        </div>
        <Link href="/dashboard/dossiers/nouveau">
          <Button className="whitespace-nowrap">
            <span className="hidden sm:inline">Nouveau dossier</span>
            <span className="sm:hidden">+ Dossier</span>
          </Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Aucun dossier" description="Créez votre premier dossier de transaction." />
      ) : (
        <>
          {/* Mobile: card view */}
          <div className="space-y-3 lg:hidden">
            {items.map((deal) => (
              <Link key={deal.id} href={`/dashboard/dossiers/${deal.id}`}>
                <Card className="p-4 active:bg-stone-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-anthracite-800">{deal.title}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {deal.property ? deal.property.title : "Pas de bien lié"}
                        {deal.contact && ` · ${deal.contact.firstName} ${deal.contact.lastName}`}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(deal.stage)}>
                      {DEAL_STAGE_LABELS[deal.stage]}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-stone-400">
                    <span className="font-mono">{deal.reference}</span>
                    {deal.estimatedValue && (
                      <span className="font-semibold text-anthracite-800">{formatPrice(deal.estimatedValue)}</span>
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
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Référence</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Titre</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Bien</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Contact</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Étape</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Valeur</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Assigné</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Modifié</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.map((deal) => (
                    <tr key={deal.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3"><Link href={`/dashboard/dossiers/${deal.id}`} className="font-mono text-xs text-brand-600 hover:underline">{deal.reference}</Link></td>
                      <td className="px-4 py-3 font-medium text-anthracite-800">{deal.title}</td>
                      <td className="px-4 py-3 text-stone-600">{deal.property ? deal.property.title : "—"}</td>
                      <td className="px-4 py-3 text-stone-600">{deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : "—"}</td>
                      <td className="px-4 py-3"><Badge variant={getStatusBadgeVariant(deal.stage)}>{DEAL_STAGE_LABELS[deal.stage]}</Badge></td>
                      <td className="px-4 py-3 font-medium text-anthracite-800">{formatPrice(deal.estimatedValue)}</td>
                      <td className="px-4 py-3 text-stone-600">{deal.assignedTo ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}` : "—"}</td>
                      <td className="px-4 py-3 text-stone-400">{formatDateShort(deal.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
