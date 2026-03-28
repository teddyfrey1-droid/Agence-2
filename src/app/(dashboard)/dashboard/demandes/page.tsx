import Link from "next/link";
import { findSearchRequests } from "@/modules/search-requests";
import { formatDateShort } from "@/lib/utils";
import { SEARCH_REQUEST_STATUS_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";

export default async function DemandesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const { items, total, totalPages } = await findSearchRequests(
    { status: params.status, search: params.search },
    page
  );

  const hasFilters = !!(params.status || params.search);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">Demandes de recherche</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">{total} demande(s)</p>
        </div>
        <Link href="/dashboard/demandes/nouvelle">
          <Button>Nouvelle demande</Button>
        </Link>
      </div>

      <FilterBar
        basePath="/dashboard/demandes"
        searchPlaceholder="Rechercher une demande..."
        filters={[
          {
            name: "status",
            label: "Statut",
            options: Object.entries(SEARCH_REQUEST_STATUS_LABELS).map(([value, label]) => ({ value, label })),
          },
        ]}
        currentParams={params}
      />

      {items.length === 0 ? (
        <EmptyState
          title={hasFilters ? "Aucun résultat" : "Aucune demande"}
          description={hasFilters ? "Aucune demande ne correspond à vos filtres." : "Les demandes de recherche soumises via le site ou créées manuellement apparaîtront ici."}
          action={
            hasFilters ? (
              <Link href="/dashboard/demandes">
                <Button variant="secondary">Effacer les filtres</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50 dark:border-stone-700/50 dark:bg-anthracite-800/50">
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Référence</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Contact</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Transaction</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Activité</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Assigné à</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Statut</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Matches</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Score</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-700/50">
                {items.map((request) => (
                  <tr key={request.id} className="hover:bg-stone-50 dark:hover:bg-anthracite-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/demandes/${request.id}`}
                        className="font-mono text-xs text-brand-600 hover:underline dark:text-brand-400"
                      >
                        {request.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {request.contact ? (
                        <span className="text-anthracite-800 dark:text-stone-200">
                          {request.contact.firstName} {request.contact.lastName}
                          {request.contact.company && (
                            <span className="block text-xs text-stone-400 dark:text-stone-500">{request.contact.company}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                      {request.transactionType
                        ? TRANSACTION_TYPE_LABELS[request.transactionType]
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                      {request.activity || "—"}
                    </td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                      {request.assignedTo
                        ? `${request.assignedTo.firstName} ${request.assignedTo.lastName}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {SEARCH_REQUEST_STATUS_LABELS[request.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-stone-500 dark:text-stone-400">
                      {request._count.matches}
                    </td>
                    <td className="px-4 py-3">
                      {request.qualificationScore != null ? (
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-12 rounded-full bg-stone-200 dark:bg-stone-700">
                            <div
                              className={`h-1.5 rounded-full ${
                                request.qualificationScore >= 70 ? "bg-emerald-500" :
                                request.qualificationScore >= 40 ? "bg-amber-500" : "bg-red-400"
                              }`}
                              style={{ width: `${request.qualificationScore}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-stone-600 dark:text-stone-400">{request.qualificationScore}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-400 dark:text-stone-500">
                      {formatDateShort(request.createdAt)}
                    </td>
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
