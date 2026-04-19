import Link from "next/link";
import { findContacts } from "@/modules/contacts";
import { formatDateShort } from "@/lib/utils";
import { CONTACT_TYPE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";

// Map contact emails to user accounts for activation status
async function getLinkedUsers(contactEmails: (string | null)[]) {
  const emails = contactEmails.filter(Boolean) as string[];
  if (emails.length === 0) return {};
  const users = await prisma.user.findMany({
    where: { email: { in: emails }, role: "CLIENT" },
    select: { email: true, isActivated: true, isActive: true, lastLoginAt: true, accountActivatedAt: true, createdAt: true },
  });
  return Object.fromEntries(users.map((u) => [u.email, u]));
}

type AccountStatus = "no_account" | "pending_activation" | "active" | "blocked";

function getAccountStatus(linkedUser: { isActivated: boolean; isActive: boolean } | undefined): AccountStatus {
  if (!linkedUser) return "no_account";
  if (!linkedUser.isActive) return "blocked";
  if (!linkedUser.isActivated) return "pending_activation";
  return "active";
}

const accountStatusConfig: Record<AccountStatus, { label: string; variant: "neutral" | "warning" | "success" | "danger" }> = {
  no_account: { label: "Pas de compte", variant: "neutral" },
  pending_activation: { label: "En attente", variant: "warning" },
  active: { label: "Compte actif", variant: "success" },
  blocked: { label: "Bloqué", variant: "danger" },
};

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string; search?: string; account?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const { items, total, totalPages } = await findContacts(
    { type: params.type, search: params.search },
    page
  );

  const linkedUsers = await getLinkedUsers(items.map((c) => c.email));
  const hasFilters = !!(params.type || params.search || params.account);

  // Count pending activations
  const pendingCount = await prisma.user.count({
    where: { role: "CLIENT", isActivated: false, isActive: true },
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Carnet d'adresses"
        title="Contacts"
        description={`${total} contact${total !== 1 ? "s" : ""} dans votre base.`}
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2a4 4 0 100-8 4 4 0 000 8zm6 0a3 3 0 100-6 3 3 0 000 6zM5 10a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
        }
        meta={
          pendingCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {pendingCount} en attente d&apos;activation
            </span>
          ) : undefined
        }
        actions={
          <>
            <a href="/api/export?type=contacts" download>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                CSV
              </Button>
            </a>
            <Link href="/dashboard/contacts/nouveau">
              <Button className="whitespace-nowrap">
                <span className="hidden sm:inline">Nouveau contact</span>
                <span className="sm:hidden">+ Contact</span>
              </Button>
            </Link>
          </>
        }
      />

      <FilterBar
        basePath="/dashboard/contacts"
        searchPlaceholder="Rechercher un contact..."
        filters={[
          { name: "type", label: "Type", options: Object.entries(CONTACT_TYPE_LABELS).map(([value, label]) => ({ value, label })) },
        ]}
        currentParams={params}
      />

      {items.length === 0 ? (
        <EmptyState
          title={hasFilters ? "Aucun résultat" : "Aucun contact"}
          description={hasFilters ? "Aucun contact ne correspond à vos filtres." : "Ajoutez votre premier contact ou attendez les premières demandes via le site."}
          action={hasFilters ? (<Link href="/dashboard/contacts"><Button variant="secondary">Effacer les filtres</Button></Link>) : undefined}
        />
      ) : (
        <>
          {/* Mobile: card view */}
          <div className="space-y-3 lg:hidden">
            {items.map((contact) => {
              const linkedUser = contact.email ? linkedUsers[contact.email] : undefined;
              const status = getAccountStatus(linkedUser);
              const statusConfig = accountStatusConfig[status];

              return (
                <Link key={contact.id} href={`/dashboard/contacts/${contact.id}`}>
                  <Card className="p-4 active:bg-stone-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                            {contact.firstName?.[0]}{contact.lastName?.[0]}
                            {status === "pending_activation" && (
                              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-amber-400" />
                            )}
                            {status === "active" && (
                              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-anthracite-800 dark:text-stone-200">
                              {contact.firstName} {contact.lastName}
                            </p>
                            {contact.company && (
                              <p className="text-xs text-stone-400 dark:text-stone-500">{contact.company}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge>{CONTACT_TYPE_LABELS[contact.type] || contact.type}</Badge>
                        {status !== "no_account" && (
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                      {contact.email && <span>{contact.email}</span>}
                      {(contact.phone || contact.mobile) && <span>{contact.phone || contact.mobile}</span>}
                      <span>{contact._count.searchRequests} demande(s)</span>
                      <span>{contact._count.deals} dossier(s)</span>
                      {linkedUser?.lastLoginAt && (
                        <span>Vu le {formatDateShort(linkedUser.lastLoginAt)}</span>
                      )}
                      <span className="ml-auto">{formatDateShort(contact.updatedAt)}</span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Desktop: table */}
          <Card className="hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50 dark:border-stone-700/50 dark:bg-anthracite-800/50">
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Nom</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Société</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Type</th>
                    <th className="px-4 py-3 text-center font-medium text-stone-500 dark:text-stone-400">Compte</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Téléphone</th>
                    <th className="px-4 py-3 text-center font-medium text-stone-500 dark:text-stone-400">Demandes</th>
                    <th className="px-4 py-3 text-center font-medium text-stone-500 dark:text-stone-400">Dossiers</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Dernière connexion</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Modifié</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-700/50">
                  {items.map((contact) => {
                    const linkedUser = contact.email ? linkedUsers[contact.email] : undefined;
                    const status = getAccountStatus(linkedUser);
                    const statusConfig = accountStatusConfig[status];

                    return (
                      <tr key={contact.id} className="hover:bg-stone-50 dark:hover:bg-anthracite-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 flex-shrink-0">
                              {contact.firstName?.[0]}{contact.lastName?.[0]}
                              {status === "pending_activation" && (
                                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-amber-400 dark:border-anthracite-900" />
                              )}
                              {status === "active" && (
                                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400 dark:border-anthracite-900" />
                              )}
                            </div>
                            <Link href={`/dashboard/contacts/${contact.id}`} className="font-medium text-anthracite-800 hover:text-brand-700 dark:text-stone-200 dark:hover:text-brand-400">
                              {contact.firstName} {contact.lastName}
                            </Link>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{contact.company || "—"}</td>
                        <td className="px-4 py-3"><Badge>{CONTACT_TYPE_LABELS[contact.type] || contact.type}</Badge></td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{contact.email || "—"}</td>
                        <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{contact.phone || contact.mobile || "—"}</td>
                        <td className="px-4 py-3 text-center text-stone-500 dark:text-stone-400">{contact._count.searchRequests}</td>
                        <td className="px-4 py-3 text-center text-stone-500 dark:text-stone-400">{contact._count.deals}</td>
                        <td className="px-4 py-3 text-stone-400 dark:text-stone-500">
                          {linkedUser?.lastLoginAt ? formatDateShort(linkedUser.lastLoginAt) : "—"}
                        </td>
                        <td className="px-4 py-3 text-stone-400 dark:text-stone-500">{formatDateShort(contact.updatedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath="/dashboard/contacts" params={{ type: params.type, search: params.search }} />
    </div>
  );
}
