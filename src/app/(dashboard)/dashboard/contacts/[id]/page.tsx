import { notFound } from "next/navigation";
import Link from "next/link";
import { findContactById } from "@/modules/contacts";
import { formatDate, formatDateShort } from "@/lib/utils";
import { CONTACT_TYPE_LABELS, INTERACTION_TYPE_LABELS, SEARCH_REQUEST_STATUS_LABELS } from "@/lib/constants";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { QuickInteractionForm } from "@/components/quick-interaction-form";
import { QuickTaskForm } from "@/components/quick-task-form";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await findContactById(id);
  if (!contact) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/dashboard/contacts" className="text-sm text-stone-400 hover:text-anthracite-700 dark:hover:text-stone-200">Contacts</Link>
          <h1 className="mt-2 text-2xl font-semibold text-anthracite-900 dark:text-stone-100">
            {contact.firstName} {contact.lastName}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge>{CONTACT_TYPE_LABELS[contact.type] || contact.type}</Badge>
            {contact.company && <span className="text-sm text-stone-500 dark:text-stone-400">{contact.company}</span>}
          </div>
        </div>
        <Link href={`/dashboard/contacts/${id}/modifier`} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-anthracite-700 transition-colors hover:bg-stone-50 dark:border-stone-700 dark:bg-anthracite-800 dark:text-stone-200 dark:hover:bg-anthracite-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
          Modifier
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Timeline */}
          <Card>
            <CardHeader><h2 className="heading-card">Historique des interactions ({contact.interactions.length})</h2></CardHeader>
            <CardContent className="p-0">
              {contact.interactions.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-stone-400 dark:text-stone-500">Aucune interaction</p>
              ) : (
                <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                  {contact.interactions.map((i) => (
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

          {/* Search Requests */}
          <Card>
            <CardHeader><h2 className="heading-card">Demandes ({contact.searchRequests.length})</h2></CardHeader>
            <CardContent className="p-0">
              {contact.searchRequests.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-stone-400 dark:text-stone-500">Aucune demande</p>
              ) : (
                <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                  {contact.searchRequests.map((sr) => (
                    <li key={sr.id} className="flex items-center justify-between px-6 py-3">
                      <Link href={`/dashboard/demandes/${sr.id}`} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                        {sr.reference}
                      </Link>
                      <Badge variant={getStatusBadgeVariant(sr.status)}>
                        {SEARCH_REQUEST_STATUS_LABELS[sr.status]}
                      </Badge>
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
            <CardHeader><h2 className="heading-card">Coordonnées</h2></CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                {contact.email && <div><dt className="text-stone-500 dark:text-stone-400">Email</dt><dd className="font-medium text-anthracite-800 dark:text-stone-200">{contact.email}</dd></div>}
                {contact.phone && <div><dt className="text-stone-500 dark:text-stone-400">Téléphone</dt><dd className="font-medium text-anthracite-800 dark:text-stone-200">{contact.phone}</dd></div>}
                {contact.mobile && <div><dt className="text-stone-500 dark:text-stone-400">Mobile</dt><dd className="font-medium text-anthracite-800 dark:text-stone-200">{contact.mobile}</dd></div>}
                {contact.address && <div><dt className="text-stone-500 dark:text-stone-400">Adresse</dt><dd className="font-medium text-anthracite-800 dark:text-stone-200">{contact.address} {contact.zipCode} {contact.city}</dd></div>}
                <div><dt className="text-stone-500 dark:text-stone-400">Source</dt><dd className="font-medium text-anthracite-800 dark:text-stone-200">{contact.source}</dd></div>
                <div><dt className="text-stone-500 dark:text-stone-400">Créé le</dt><dd className="font-medium text-anthracite-800 dark:text-stone-200">{formatDate(contact.createdAt)}</dd></div>
              </dl>
            </CardContent>
          </Card>

          {contact.notes && (
            <Card>
              <CardHeader><h2 className="heading-card">Notes</h2></CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-anthracite-600 dark:text-stone-300">{contact.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Quick interaction */}
          <QuickInteractionForm contactId={id} />

          {/* Quick task */}
          <QuickTaskForm contactId={id} />

          {/* Pending tasks */}
          <Card>
            <CardHeader><h2 className="heading-card">Tâches en cours ({contact.tasks.length})</h2></CardHeader>
            <CardContent className="p-0">
              {contact.tasks.length === 0 ? (
                <p className="px-6 py-4 text-center text-sm text-stone-400 dark:text-stone-500">Aucune tâche</p>
              ) : (
                <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                  {contact.tasks.map((t) => (
                    <li key={t.id} className="px-6 py-2">
                      <p className="text-sm text-anthracite-800 dark:text-stone-200">{t.title}</p>
                      {t.dueDate && <p className="text-xs text-stone-400 dark:text-stone-500">Échéance: {formatDateShort(t.dueDate)}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
