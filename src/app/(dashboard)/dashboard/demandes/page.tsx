import Link from "next/link";
import { findSearchRequests } from "@/modules/search-requests";
import { formatDateShort } from "@/lib/utils";
import { SEARCH_REQUEST_STATUS_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-anthracite-900 sm:text-2xl">Demandes</h1>
          <p className="text-sm text-stone-500">{total} demande(s)</p>
        </div>
        <Link href="/dashboard/demandes/nouvelle">
          <Button className="whitespace-nowrap">
            <span className="hidden sm:inline">Nouvelle demande</span>
            <span className="sm:hidden">+ Demande</span>
          </Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Aucune demande" description="Les demandes de recherche soumises via le site ou créées manuellement apparaîtront ici." />
      ) : (
        <>
          {/* Mobile: card view */}
          <div className="space-y-3 lg:hidden">
            {items.map((request) => (
              <Link key={request.id} href={`/dashboard/demandes/${request.id}`}>
                <Card className="p-4 active:bg-stone-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {request.contact ? (
                        <p className="font-medium text-anthracite-800">
                          {request.contact.firstName} {request.contact.lastName}
                          {request.contact.company && (
                            <span className="text-xs text-stone-400 ml-1">({request.contact.company})</span>
                          )}
                        </p>
                      ) : (
                        <p className="text-stone-400">Contact non renseigné</p>
                      )}
                      <p className="text-xs text-stone-400 mt-0.5">
                        {request.transactionType ? TRANSACTION_TYPE_LABELS[request.transactionType] : "—"}
                        {request.activity && ` · ${request.activity}`}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(request.status)}>
                      {SEARCH_REQUEST_STATUS_LABELS[request.status]}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-stone-400">
                    <span className="font-mono">{request.reference}</span>
                    <span>{request._count.matches} match(es)</span>
                    {request.assignedTo && (
                      <span className="ml-auto">{request.assignedTo.firstName} {request.assignedTo.lastName}</span>
                    )}
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
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Contact</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Transaction</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Activité</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Assigné à</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Statut</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Matches</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.map((request) => (
                    <tr key={request.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3"><Link href={`/dashboard/demandes/${request.id}`} className="font-mono text-xs text-brand-600 hover:underline">{request.reference}</Link></td>
                      <td className="px-4 py-3">{request.contact ? (<span className="text-anthracite-800">{request.contact.firstName} {request.contact.lastName}{request.contact.company && <span className="block text-xs text-stone-400">{request.contact.company}</span>}</span>) : <span className="text-stone-400">—</span>}</td>
                      <td className="px-4 py-3 text-stone-600">{request.transactionType ? TRANSACTION_TYPE_LABELS[request.transactionType] : "—"}</td>
                      <td className="px-4 py-3 text-stone-600">{request.activity || "—"}</td>
                      <td className="px-4 py-3 text-stone-600">{request.assignedTo ? `${request.assignedTo.firstName} ${request.assignedTo.lastName}` : "—"}</td>
                      <td className="px-4 py-3"><Badge variant={getStatusBadgeVariant(request.status)}>{SEARCH_REQUEST_STATUS_LABELS[request.status]}</Badge></td>
                      <td className="px-4 py-3 text-center text-stone-500">{request._count.matches}</td>
                      <td className="px-4 py-3 text-stone-400">{formatDateShort(request.createdAt)}</td>
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
