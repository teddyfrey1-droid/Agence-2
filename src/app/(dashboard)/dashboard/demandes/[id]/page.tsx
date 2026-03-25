import { notFound } from "next/navigation";
import Link from "next/link";
import { findSearchRequestById } from "@/modules/search-requests";
import { formatPrice, formatSurface, formatDate } from "@/lib/utils";
import { SEARCH_REQUEST_STATUS_LABELS, PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default async function DemandeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await findSearchRequestById(id);
  if (!request) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-stone-400">
            <Link href="/dashboard/demandes" className="hover:text-anthracite-700">Demandes</Link>
            <span>/</span>
            <span className="text-anthracite-700">{request.reference}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-anthracite-900">
            Demande {request.reference}
          </h1>
        </div>
        <Badge variant={getStatusBadgeVariant(request.status)}>
          {SEARCH_REQUEST_STATUS_LABELS[request.status]}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><h2 className="heading-card">Critères</h2></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-caption">Transaction</dt>
                  <dd className="mt-1 text-sm font-medium text-anthracite-800">
                    {request.transactionType ? TRANSACTION_TYPE_LABELS[request.transactionType] : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption">Types</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {request.propertyTypes.map((t) => (
                      <Badge key={t}>{PROPERTY_TYPE_LABELS[t] || t}</Badge>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption">Surface</dt>
                  <dd className="mt-1 text-sm font-medium text-anthracite-800">
                    {formatSurface(request.surfaceMin)} — {formatSurface(request.surfaceMax)}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption">Budget</dt>
                  <dd className="mt-1 text-sm font-medium text-anthracite-800">
                    {formatPrice(request.budgetMin)} — {formatPrice(request.budgetMax)}
                  </dd>
                </div>
                {request.activity && (
                  <div>
                    <dt className="text-caption">Activité</dt>
                    <dd className="mt-1 text-sm font-medium text-anthracite-800">{request.activity}</dd>
                  </div>
                )}
                {request.districts.length > 0 && (
                  <div className="col-span-2">
                    <dt className="text-caption">Arrondissements</dt>
                    <dd className="mt-1 flex flex-wrap gap-1">
                      {request.districts.map((d) => (
                        <Badge key={d} variant="neutral">{d}</Badge>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
              {request.description && (
                <p className="mt-4 border-t border-stone-100 pt-4 text-sm text-anthracite-600">
                  {request.description}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Matches */}
          <Card>
            <CardHeader>
              <h2 className="heading-card">Matching ({request.matches.length})</h2>
            </CardHeader>
            <CardContent>
              {request.matches.length === 0 ? (
                <p className="py-4 text-center text-sm text-stone-400">Aucun match pour le moment</p>
              ) : (
                <div className="space-y-3">
                  {request.matches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between rounded-lg border border-stone-100 p-3">
                      <div>
                        <Link href={`/dashboard/biens/${match.property.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                          {match.property.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {match.reasons.map((r, i) => (
                            <span key={i} className="text-xs text-stone-400">{r}{i < match.reasons.length - 1 ? " · " : ""}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-anthracite-900">{match.score}%</span>
                        <Badge variant={getStatusBadgeVariant(match.status)} className="ml-2">{match.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><h2 className="heading-card">Contact</h2></CardHeader>
            <CardContent>
              {request.contact ? (
                <div className="space-y-1 text-sm">
                  <Link href={`/dashboard/contacts/${request.contact.id}`} className="font-medium text-brand-600 hover:underline">
                    {request.contact.firstName} {request.contact.lastName}
                  </Link>
                  {request.contact.email && <p className="text-stone-500">{request.contact.email}</p>}
                  {request.contact.phone && <p className="text-stone-500">{request.contact.phone}</p>}
                </div>
              ) : (
                <p className="text-sm text-stone-400">Aucun contact lié</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="heading-card">Détails</h2></CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone-500">Source</dt>
                  <dd className="font-medium text-anthracite-800">{request.source}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Assigné à</dt>
                  <dd className="font-medium text-anthracite-800">
                    {request.assignedTo ? `${request.assignedTo.firstName} ${request.assignedTo.lastName}` : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Créée le</dt>
                  <dd className="font-medium text-anthracite-800">{formatDate(request.createdAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
