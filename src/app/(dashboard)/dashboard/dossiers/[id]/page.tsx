import { notFound } from "next/navigation";
import Link from "next/link";
import { findDealById } from "@/modules/deals";
import { formatPrice, formatDate, formatDateShort } from "@/lib/utils";
import { DEAL_STAGE_LABELS, INTERACTION_TYPE_LABELS, TASK_PRIORITY_LABELS } from "@/lib/constants";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { QuickInteractionForm } from "@/components/quick-interaction-form";
import { QuickTaskForm } from "@/components/quick-task-form";

export default async function DossierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await findDealById(id);
  if (!deal) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/dashboard/dossiers" className="text-sm text-stone-400 hover:text-anthracite-700 dark:hover:text-stone-200">Dossiers</Link>
          <h1 className="mt-2 text-2xl font-semibold text-anthracite-900 dark:text-stone-100">{deal.title}</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">Réf. {deal.reference}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/dossiers/${id}/modifier`} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-anthracite-700 transition-colors hover:bg-stone-50 dark:border-stone-700 dark:bg-anthracite-800 dark:text-stone-200 dark:hover:bg-anthracite-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
            Modifier
          </Link>
          <Badge variant={getStatusBadgeVariant(deal.stage)}>
            {DEAL_STAGE_LABELS[deal.stage]}
          </Badge>
          <Badge variant={getStatusBadgeVariant(deal.status)}>
            {deal.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Tasks */}
          <Card>
            <CardHeader><h2 className="heading-card">Tâches ({deal.tasks.length})</h2></CardHeader>
            <CardContent className="p-0">
              {deal.tasks.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-stone-400 dark:text-stone-500">Aucune tâche</p>
              ) : (
                <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                  {deal.tasks.map((t) => (
                    <li key={t.id} className="flex items-center justify-between px-6 py-3">
                      <div>
                        <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">{t.title}</p>
                        {t.dueDate && <p className="text-xs text-stone-400 dark:text-stone-500">Échéance: {formatDateShort(t.dueDate)}</p>}
                      </div>
                      <Badge variant={getStatusBadgeVariant(t.priority)}>
                        {TASK_PRIORITY_LABELS[t.priority]}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Interactions */}
          <Card>
            <CardHeader><h2 className="heading-card">Interactions ({deal.interactions.length})</h2></CardHeader>
            <CardContent className="p-0">
              {deal.interactions.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-stone-400 dark:text-stone-500">Aucune interaction</p>
              ) : (
                <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                  {deal.interactions.map((i) => (
                    <li key={i.id} className="px-6 py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">
                            {i.subject || INTERACTION_TYPE_LABELS[i.type]}
                          </p>
                          {i.content && <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 line-clamp-2">{i.content}</p>}
                        </div>
                        <span className="text-xs text-stone-400 dark:text-stone-500">{formatDateShort(i.date)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><h2 className="heading-card">Détails</h2></CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone-500 dark:text-stone-400">Valeur estimée</dt>
                  <dd className="font-medium text-anthracite-800 dark:text-stone-200">{formatPrice(deal.estimatedValue)}</dd>
                </div>
                {deal.commission && (
                  <div className="flex justify-between">
                    <dt className="text-stone-500 dark:text-stone-400">Commission</dt>
                    <dd className="font-medium text-anthracite-800 dark:text-stone-200">{formatPrice(deal.commission)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-stone-500 dark:text-stone-400">Assigné à</dt>
                  <dd className="font-medium text-anthracite-800 dark:text-stone-200">
                    {deal.assignedTo ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}` : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500 dark:text-stone-400">Créé le</dt>
                  <dd className="font-medium text-anthracite-800 dark:text-stone-200">{formatDate(deal.createdAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Commission Attribution */}
          {deal.commission && (
            <Card>
              <CardHeader><h2 className="heading-card">Répartition commission</h2></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{formatPrice(deal.commission)}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Commission totale</p>
                  </div>
                  <div className="h-px bg-stone-100 dark:bg-stone-800" />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-anthracite-800 dark:text-stone-200">
                          {deal.propertyFoundBy
                            ? `${deal.propertyFoundBy.firstName} ${deal.propertyFoundBy.lastName}`
                            : "Non attribué"}
                        </p>
                        <p className="text-xs text-stone-400 dark:text-stone-500">Apporteur du bien</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-anthracite-800 dark:text-stone-200">
                          {formatPrice(deal.commission * (deal.finderCommissionPct || 30) / 100)}
                        </p>
                        <p className="text-xs text-stone-400 dark:text-stone-500">{deal.finderCommissionPct || 30}%</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-anthracite-800 dark:text-stone-200">
                          {deal.dealClosedBy
                            ? `${deal.dealClosedBy.firstName} ${deal.dealClosedBy.lastName}`
                            : "Non attribué"}
                        </p>
                        <p className="text-xs text-stone-400 dark:text-stone-500">Vendeur / Closer</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-anthracite-800 dark:text-stone-200">
                          {formatPrice(deal.commission * (deal.closerCommissionPct || 70) / 100)}
                        </p>
                        <p className="text-xs text-stone-400 dark:text-stone-500">{deal.closerCommissionPct || 70}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick interaction */}
          <QuickInteractionForm dealId={id} contactId={deal.contact?.id} />

          {/* Quick task */}
          <QuickTaskForm dealId={id} />

          {deal.property && (
            <Card>
              <CardHeader><h2 className="heading-card">Bien lié</h2></CardHeader>
              <CardContent>
                <Link href={`/dashboard/biens/${deal.property.id}`} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                  {deal.property.title}
                </Link>
              </CardContent>
            </Card>
          )}

          {deal.contact && (
            <Card>
              <CardHeader><h2 className="heading-card">Contact</h2></CardHeader>
              <CardContent>
                <Link href={`/dashboard/contacts/${deal.contact.id}`} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                  {deal.contact.firstName} {deal.contact.lastName}
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
