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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-anthracite-900">Dossiers</h1>
          <p className="text-sm text-stone-500">{total} dossier(s)</p>
        </div>
        <Link href="/dashboard/dossiers/nouveau">
          <Button>Nouveau dossier</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Aucun dossier" description="Créez votre premier dossier de transaction." />
      ) : (
        <Card className="overflow-hidden">
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
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/dossiers/${deal.id}`} className="font-mono text-xs text-brand-600 hover:underline">
                        {deal.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-anthracite-800">{deal.title}</td>
                    <td className="px-4 py-3 text-stone-600">
                      {deal.property ? deal.property.title : "—"}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(deal.stage)}>
                        {DEAL_STAGE_LABELS[deal.stage] || deal.stage}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-anthracite-800">
                      {formatPrice(deal.estimatedValue)}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {deal.assignedTo ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-stone-400">{formatDateShort(deal.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
