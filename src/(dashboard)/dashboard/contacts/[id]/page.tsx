import { notFound } from "next/navigation";
import Link from "next/link";
import { findContactById } from "@/modules/contacts";
import { formatDate, formatDateShort } from "@/lib/utils";
import {
  CONTACT_TYPE_LABELS,
  INTERACTION_TYPE_LABELS,
  SEARCH_REQUEST_STATUS_LABELS,
  DEAL_STAGE_LABELS,
} from "@/lib/constants";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { QuickInteractionForm } from "@/components/quick-interaction-form";
import { QuickTaskForm } from "@/components/quick-task-form";
import { DeleteButton } from "@/components/delete-button";
import { PropertyShareButton } from "@/components/property-share-button";
import { ContactAccountActions } from "@/components/contact-account-actions";
import { prisma } from "@/lib/prisma";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h${m > 0 ? `${m}min` : ""}`;
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await findContactById(id);
  if (!contact) notFound();

  // Look up linked user account (CLIENT role matching email, OR any user with linkedContactId)
  const linkedUser = contact.email
    ? await prisma.user.findFirst({
        where: {
          OR: [
            { email: contact.email, role: "CLIENT" },
            { linkedContactId: id },
          ],
        },
        select: {
          id: true,
          isActivated: true,
          isActive: true,
          lastLoginAt: true,
          accountActivatedAt: true,
          createdAt: true,
          invitedAt: true,
        },
      })
    : null;

  // Get client tracking + user activity data
  let clientStats = null;
  let recentActivity: Array<{
    id: string;
    type: string;
    label: string;
    details: string | null;
    duration: number | null;
    createdAt: Date;
  }> = [];

  if (linkedUser) {
    const [tracking, trackingStats, userActivities] = await Promise.all([
      prisma.clientTracking.findMany({
        where: { userId: linkedUser.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.clientTracking.groupBy({
        by: ["action"],
        where: { userId: linkedUser.id },
        _count: true,
        _sum: { duration: true },
      }),
      // Also pull from UserActivity table (existing login/page view tracking)
      prisma.userActivity.findMany({
        where: { userId: linkedUser.id },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);

    // Merge both activity sources into a unified timeline
    const trackingItems = tracking.map((t) => ({
      id: t.id,
      type: t.action,
      label: ACTION_LABELS[t.action] || t.action,
      details: t.details,
      duration: t.duration,
      createdAt: t.createdAt,
    }));

    const activityItems = userActivities.map((a) => ({
      id: a.id,
      type: a.type,
      label: USER_ACTIVITY_LABELS[a.type] || a.type,
      details: a.path || a.details,
      duration: a.duration,
      createdAt: a.createdAt,
    }));

    // Deduplicate by timestamp proximity (within 2s) and merge
    const allItems = [...trackingItems, ...activityItems]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .filter((item, index, arr) => {
        if (index === 0) return true;
        const prev = arr[index - 1];
        // Skip duplicates (same type within 2s)
        return !(item.type === prev.type && Math.abs(item.createdAt.getTime() - prev.createdAt.getTime()) < 2000);
      });

    recentActivity = allItems.slice(0, 40);

    const totalLogins = (trackingStats.find((s) => s.action === "LOGIN")?._count ?? 0)
      + userActivities.filter((a) => a.type === "LOGIN").length;
    const totalPageViews = (trackingStats.find((s) => s.action === "PAGE_VIEW")?._count ?? 0)
      + userActivities.filter((a) => a.type === "PAGE_VIEW").length;
    const totalPropertyViews = trackingStats.find((s) => s.action === "PROPERTY_VIEW")?._count ?? 0;
    const totalTime = trackingStats.reduce((acc, s) => acc + (s._sum.duration ?? 0), 0)
      + userActivities.reduce((acc, a) => acc + (a.duration ?? 0), 0);

    clientStats = {
      totalLogins: Math.ceil(totalLogins / 2), // deduplicate rough estimate
      totalPageViews: Math.ceil(totalPageViews / 2),
      totalPropertyViews,
      totalTime,
    };
  }

  // Get property shares for this contact (works even without linked user)
  const propertyShares = contact.propertyShares ?? [];

  // Also get shares by email if not already captured
  let emailShares: typeof propertyShares = [];
  if (contact.email) {
    emailShares = await prisma.propertyShare.findMany({
      where: {
        recipientEmail: contact.email,
        contactId: { not: id }, // exclude already-linked shares
      },
      include: { property: { select: { title: true, reference: true } } },
      orderBy: { sentAt: "desc" },
      take: 20,
    });
  }
  const allShares = [...propertyShares, ...emailShares];

  const accountStatus: "no_account" | "pending_activation" | "active" | "blocked" = !linkedUser
    ? "no_account"
    : !linkedUser.isActive
      ? "blocked"
      : !linkedUser.isActivated
        ? "pending_activation"
        : "active";

  const accountStatusConfig = {
    no_account: { label: "Pas de compte client", variant: "neutral" as const, icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" },
    pending_activation: { label: "En attente d'activation", variant: "warning" as const, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    active: { label: "Compte actif", variant: "success" as const, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    blocked: { label: "Compte bloqué", variant: "danger" as const, icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" },
  };

  const statusInfo = accountStatusConfig[accountStatus];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/dashboard/contacts" className="text-sm text-stone-400 hover:text-anthracite-700 dark:hover:text-stone-200">Contacts</Link>
          <h1 className="mt-2 text-2xl font-semibold text-anthracite-900 dark:text-stone-100">
            {contact.firstName} {contact.lastName}
          </h1>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <Badge>{CONTACT_TYPE_LABELS[contact.type] || contact.type}</Badge>
            {contact.company && <span className="text-sm text-stone-500 dark:text-stone-400">{contact.company}</span>}
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/contacts/${id}/modifier`} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-anthracite-700 transition-colors hover:bg-stone-50 dark:border-stone-700 dark:bg-anthracite-800 dark:text-stone-200 dark:hover:bg-anthracite-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
            Modifier
          </Link>
          <DeleteButton entityId={id} entityType="contacts" entityLabel="Contact" redirectTo="/dashboard/contacts" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ══════════════ Main Column ══════════════ */}
        <div className="space-y-6 lg:col-span-2">

          {/* Client Activity Stats — always shown if linked user */}
          {clientStats && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-anthracite-900 dark:text-stone-100">{clientStats.totalLogins}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Connexions</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-anthracite-900 dark:text-stone-100">{clientStats.totalPageViews}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Pages vues</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-anthracite-900 dark:text-stone-100">{clientStats.totalPropertyViews}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Biens consultés</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-anthracite-900 dark:text-stone-100">{formatDuration(clientStats.totalTime)}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Temps total</p>
              </Card>
            </div>
          )}

          {/* Property Shares / Propositions — always shown */}
          <Card>
            <CardHeader>
              <h2 className="heading-card">Propositions envoyées ({allShares.length})</h2>
            </CardHeader>
            <CardContent className="p-0">
              {allShares.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-stone-400 dark:text-stone-500">
                  Aucune proposition envoyée. Utilisez le bouton &ldquo;Envoyer un bien&rdquo; pour proposer un bien à ce contact.
                </p>
              ) : (
                <div className="divide-y divide-stone-100 dark:divide-stone-800">
                  {allShares.map((share) => (
                    <div key={share.id} className="flex items-center justify-between px-6 py-3">
                      <div className="min-w-0 flex-1">
                        <Link href={`/dashboard/biens/${share.propertyId}`} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                          {share.property.reference} — {share.property.title}
                        </Link>
                        <p className="text-xs text-stone-400 dark:text-stone-500">
                          Envoyé le {formatDateShort(share.sentAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {share.openedAt ? (
                          <div className="text-right">
                            <Badge variant="success">Ouvert</Badge>
                            <p className="mt-0.5 text-[10px] text-stone-400">
                              {share.viewCount} vue{share.viewCount > 1 ? "s" : ""} — {formatDuration(share.totalViewDuration)}
                            </p>
                          </div>
                        ) : (
                          <Badge variant="neutral">Non ouvert</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Client Activity — always shown if linked user */}
          {linkedUser && (
            <Card>
              <CardHeader>
                <h2 className="heading-card">Activité récente du client ({recentActivity.length})</h2>
              </CardHeader>
              <CardContent className="p-0">
                {recentActivity.length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-stone-400 dark:text-stone-500">
                    {accountStatus === "pending_activation"
                      ? "Le client n'a pas encore activé son compte."
                      : "Aucune activité enregistrée pour le moment."}
                  </p>
                ) : (
                  <div className="divide-y divide-stone-100 dark:divide-stone-800">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between px-6 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                            activity.type === "LOGIN" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" :
                            activity.type === "PROPERTY_VIEW" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" :
                            activity.type === "PROPOSAL_OPEN" ? "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400" :
                            activity.type === "SEARCH" ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400" :
                            "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400"
                          }`}>
                            {activity.type === "LOGIN" ? (
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                            ) : activity.type === "PROPERTY_VIEW" ? (
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            ) : activity.type === "LOGOUT" ? (
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            ) : (
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-anthracite-800 dark:text-stone-200">{activity.label}</p>
                            {activity.details && (
                              <p className="text-xs text-stone-400 dark:text-stone-500 truncate max-w-[300px]">{activity.details}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs text-stone-400 dark:text-stone-500">{formatDateShort(activity.createdAt)}</span>
                          {activity.duration != null && activity.duration > 0 && (
                            <p className="text-[10px] text-stone-400">{formatDuration(activity.duration)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dossiers */}
          <Card>
            <CardHeader><h2 className="heading-card">Dossiers ({contact.deals.length})</h2></CardHeader>
            <CardContent className="p-0">
              {contact.deals.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-stone-400 dark:text-stone-500">Aucun dossier</p>
              ) : (
                <div className="divide-y divide-stone-100 dark:divide-stone-800">
                  {contact.deals.map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between px-6 py-3">
                      <div className="min-w-0 flex-1">
                        <Link href={`/dashboard/dossiers/${deal.id}`} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                          {deal.reference} — {deal.title}
                        </Link>
                        {"property" in deal && deal.property && (
                          <p className="text-xs text-stone-400 dark:text-stone-500">
                            {(deal.property as { reference: string; title: string }).reference} — {(deal.property as { reference: string; title: string }).title}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(deal.stage)}>
                          {DEAL_STAGE_LABELS[deal.stage] || deal.stage}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline interactions */}
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

        {/* ══════════════ Sidebar ══════════════ */}
        <div className="space-y-6">

          {/* Account Status + Actions */}
          <Card>
            <CardHeader>
              <h2 className="heading-card">Compte client</h2>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 ${
                  accountStatus === "active" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" :
                  accountStatus === "pending_activation" ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" :
                  accountStatus === "blocked" ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" :
                  "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400"
                }`}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={statusInfo.icon} />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">{statusInfo.label}</p>
                  {linkedUser && (
                    <dl className="mt-2 space-y-1.5 text-xs">
                      {linkedUser.invitedAt && (
                        <div>
                          <dt className="text-stone-400">Invité le</dt>
                          <dd className="font-medium text-anthracite-700 dark:text-stone-300">{formatDate(linkedUser.invitedAt)}</dd>
                        </div>
                      )}
                      {linkedUser.accountActivatedAt && (
                        <div>
                          <dt className="text-stone-400">Activé le</dt>
                          <dd className="font-medium text-anthracite-700 dark:text-stone-300">{formatDate(linkedUser.accountActivatedAt)}</dd>
                        </div>
                      )}
                      {linkedUser.lastLoginAt && (
                        <div>
                          <dt className="text-stone-400">Dernière connexion</dt>
                          <dd className="font-medium text-anthracite-700 dark:text-stone-300">{formatDate(linkedUser.lastLoginAt)}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-stone-400">Compte créé le</dt>
                        <dd className="font-medium text-anthracite-700 dark:text-stone-300">{formatDate(linkedUser.createdAt)}</dd>
                      </div>
                    </dl>
                  )}
                  {accountStatus === "no_account" && !contact.email && (
                    <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                      Ajoutez un email pour créer un compte client.
                    </p>
                  )}
                  {accountStatus === "no_account" && contact.email && (
                    <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                      Ce contact n&apos;a pas encore de compte sur le portail client.
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 border-t border-stone-100 dark:border-stone-800 pt-4">
                <ContactAccountActions
                  userId={linkedUser?.id || ""}
                  contactEmail={contact.email || ""}
                  contactFirstName={contact.firstName}
                  accountStatus={accountStatus}
                />
              </div>
            </CardContent>
          </Card>

          {/* Send Property */}
          <Card>
            <CardHeader><h2 className="heading-card">Envoyer un bien</h2></CardHeader>
            <CardContent>
              <PropertyShareButton propertyId="" contactId={id} contactName={`${contact.firstName} ${contact.lastName}`} contactEmail={contact.email || ""} />
            </CardContent>
          </Card>

          {/* Quick interaction */}
          <QuickInteractionForm contactId={id} />

          {/* Quick task */}
          <QuickTaskForm contactId={id} />

          {/* Coordonnees */}
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

// ── Label maps ──────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Connexion",
  LOGOUT: "Déconnexion",
  PAGE_VIEW: "Page consultée",
  PROPERTY_VIEW: "Bien consulté",
  PROPOSAL_OPEN: "Proposition ouverte",
  PROPOSAL_TIME: "Temps sur proposition",
  SEARCH: "Recherche effectuée",
  ACTION: "Action",
};

const USER_ACTIVITY_LABELS: Record<string, string> = {
  LOGIN: "Connexion",
  LOGOUT: "Déconnexion",
  PAGE_VIEW: "Page consultée",
  ACTION: "Action effectuée",
};
