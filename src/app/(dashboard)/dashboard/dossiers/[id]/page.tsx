import { notFound } from "next/navigation";
import Link from "next/link";
import { findDealById } from "@/modules/deals";
import { formatPrice, formatDate, formatDateShort } from "@/lib/utils";
import { DEAL_STAGE_LABELS, INTERACTION_TYPE_LABELS, TASK_PRIORITY_LABELS } from "@/lib/constants";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

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
          <Link href="/dashboard/dossiers" className="text-sm text-stone-400 hover:text-anthracite-700">Dossiers</Link>
          <h1 className="mt-2 text-2xl font-semibold text-anthracite-900">{deal.title}</h1>
          <p className="text-sm text-stone-500">Réf. {deal.reference}</p>
        </div>
        <div className="flex items-center gap-2">
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
                <p className="px-6 py-8 text-center text-sm text-stone-400">Aucune tâche</p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {deal.tasks.map((t) => (
                    <li key={t.id} className="flex items-center justify-between px-6 py-3">
                      <div>
                        <p className="text-sm font-medium text-anthracite-800">{t.title}</p>
                        {t.dueDate && <p className="text-xs text-stone-400">Échéance: {formatDateShort(t.dueDate)}</p>}
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
                <p className="px-6 py-8 text-center text-sm text-stone-400">Aucune interaction</p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {deal.interactions.map((i) => (
                    <li key={i.id} className="px-6 py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-anthracite-800">
                            {i.subject || INTERACTION_TYPE_LABELS[i.type]}
                          </p>
                          {i.content && <p className="mt-1 text-xs text-stone-500 line-clamp-2">{i.content}</p>}
                        </div>
                        <span className="text-xs text-stone-400">{formatDateShort(i.date)}</span>
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
                  <dt className="text-stone-500">Valeur estimée</dt>
                  <dd className="font-medium text-anthracite-800">{formatPrice(deal.estimatedValue)}</dd>
                </div>
                {deal.commission && (
                  <div className="flex justify-between">
                    <dt className="text-stone-500">Commission</dt>
                    <dd className="font-medium text-anthracite-800">{formatPrice(deal.commission)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-stone-500">Assigné à</dt>
                  <dd className="font-medium text-anthracite-800">
                    {deal.assignedTo ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}` : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Créé le</dt>
                  <dd className="font-medium text-anthracite-800">{formatDate(deal.createdAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {deal.property && (
            <Card>
              <CardHeader><h2 className="heading-card">Bien lié</h2></CardHeader>
              <CardContent>
                <Link href={`/dashboard/biens/${deal.property.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                  {deal.property.title}
                </Link>
              </CardContent>
            </Card>
          )}

          {deal.contact && (
            <Card>
              <CardHeader><h2 className="heading-card">Contact</h2></CardHeader>
              <CardContent>
                <Link href={`/dashboard/contacts/${deal.contact.id}`} className="text-sm font-medium text-brand-600 hover:underline">
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
