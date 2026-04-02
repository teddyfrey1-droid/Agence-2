import { notFound } from "next/navigation";
import Link from "next/link";
import { findSearchRequestById } from "@/modules/search-requests";
import { formatPrice, formatSurface, formatDate } from "@/lib/utils";
import { SEARCH_REQUEST_STATUS_LABELS, PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { MatchActions } from "@/components/match-actions";
import { DeleteButton } from "@/components/delete-button";

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
          <div className="flex items-center gap-2 text-sm text-stone-400 dark:text-stone-500">
            <Link href="/dashboard/demandes" className="hover:text-anthracite-700 dark:hover:text-stone-200">Demandes</Link>
            <span>/</span>
            <span className="text-anthracite-700 dark:text-stone-300">{request.reference}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-anthracite-900 dark:text-stone-100">
            Demande {request.reference}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/demandes/${id}/modifier`} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-anthracite-700 transition-colors hover:bg-stone-50 dark:border-stone-700 dark:bg-anthracite-800 dark:text-stone-200 dark:hover:bg-anthracite-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
            Modifier
          </Link>
          <DeleteButton entityId={id} entityType="search-requests" entityLabel="Demande" redirectTo="/dashboard/demandes" />
          <Badge variant={getStatusBadgeVariant(request.status)}>
            {SEARCH_REQUEST_STATUS_LABELS[request.status]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><h2 className="heading-card">Critères</h2></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-caption">Transaction</dt>
                  <dd className="mt-1 text-sm font-medium text-anthracite-800 dark:text-stone-200">
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
                  <dd className="mt-1 text-sm font-medium text-anthracite-800 dark:text-stone-200">
                    {formatSurface(request.surfaceMin)} — {formatSurface(request.surfaceMax)}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption">Budget</dt>
                  <dd className="mt-1 text-sm font-medium text-anthracite-800 dark:text-stone-200">
                    {formatPrice(request.budgetMin)} — {formatPrice(request.budgetMax)}
                  </dd>
                </div>
                {request.activity && (
                  <div>
                    <dt className="text-caption">Activité</dt>
                    <dd className="mt-1 text-sm font-medium text-anthracite-800 dark:text-stone-200">{request.activity}</dd>
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
                <p className="mt-4 border-t border-stone-100 pt-4 text-sm text-anthracite-600 dark:border-stone-800 dark:text-stone-300">
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
                <p className="py-4 text-center text-sm text-stone-400 dark:text-stone-500">Aucun match pour le moment</p>
              ) : (
                <div className="space-y-3">
                  {request.matches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between rounded-lg border border-stone-100 p-3 dark:border-stone-800">
                      <div>
                        <Link href={`/dashboard/biens/${match.property.id}`} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                          {match.property.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {match.reasons.map((r, i) => (
                            <span key={i} className="text-xs text-stone-400 dark:text-stone-500">{r}{i < match.reasons.length - 1 ? " · " : ""}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-anthracite-900 dark:text-stone-100">{match.score}%</span>
                        <MatchActions matchId={match.id} currentStatus={match.status} />
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
                  <Link href={`/dashboard/contacts/${request.contact.id}`} className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                    {request.contact.firstName} {request.contact.lastName}
                  </Link>
                  {request.contact.email && <p className="text-stone-500 dark:text-stone-400">{request.contact.email}</p>}
                  {request.contact.phone && <p className="text-stone-500 dark:text-stone-400">{request.contact.phone}</p>}
                </div>
              ) : (
                <p className="text-sm text-stone-400 dark:text-stone-500">Aucun contact lié</p>
              )}
            </CardContent>
          </Card>

          {/* Qualification Score */}
          <Card>
            <CardHeader><h2 className="heading-card">Score de qualification</h2></CardHeader>
            <CardContent>
              {request.qualificationScore != null ? (
                <div className="text-center">
                  <div className="relative mx-auto h-20 w-20">
                    <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" className="dark:stroke-stone-700" />
                      <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={request.qualificationScore >= 70 ? "#059669" : request.qualificationScore >= 40 ? "#d97706" : "#ef4444"} strokeWidth="3" strokeDasharray={`${request.qualificationScore}, 100`} />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-anthracite-800 dark:text-stone-200">
                      {request.qualificationScore}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                    {request.qualificationScore >= 70 ? "Prospect chaud" : request.qualificationScore >= 40 ? "Prospect tiède" : "Prospect froid"}
                  </p>
                </div>
              ) : (
                <p className="text-center text-sm text-stone-400 dark:text-stone-500">Non évalué</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="heading-card">Détails</h2></CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone-500 dark:text-stone-400">Source</dt>
                  <dd className="font-medium text-anthracite-800 dark:text-stone-200">{request.source}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500 dark:text-stone-400">Assigné à</dt>
                  <dd className="font-medium text-anthracite-800 dark:text-stone-200">
                    {request.assignedTo ? `${request.assignedTo.firstName} ${request.assignedTo.lastName}` : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500 dark:text-stone-400">Créée le</dt>
                  <dd className="font-medium text-anthracite-800 dark:text-stone-200">{formatDate(request.createdAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
