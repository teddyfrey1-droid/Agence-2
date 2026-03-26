import Link from "next/link";
import { findContacts } from "@/modules/contacts";
import { formatDateShort } from "@/lib/utils";
import { CONTACT_TYPE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const { items, total } = await findContacts(
    { type: params.type, search: params.search },
    page
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-anthracite-900 sm:text-2xl">Contacts</h1>
          <p className="text-sm text-stone-500">{total} contact(s)</p>
        </div>
        <Link href="/dashboard/contacts/nouveau">
          <Button className="whitespace-nowrap">
            <span className="hidden sm:inline">Nouveau contact</span>
            <span className="sm:hidden">+ Contact</span>
          </Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Aucun contact" description="Ajoutez votre premier contact ou attendez les premières demandes via le site." />
      ) : (
        <>
          {/* Mobile: card view */}
          <div className="space-y-3 lg:hidden">
            {items.map((contact) => (
              <Link key={contact.id} href={`/dashboard/contacts/${contact.id}`}>
                <Card className="p-4 active:bg-stone-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-anthracite-800">
                        {contact.firstName} {contact.lastName}
                      </p>
                      {contact.company && (
                        <p className="text-xs text-stone-400 mt-0.5 truncate">{contact.company}</p>
                      )}
                    </div>
                    <Badge>{CONTACT_TYPE_LABELS[contact.type] || contact.type}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                    {contact.email && <span>{contact.email}</span>}
                    {(contact.phone || contact.mobile) && (
                      <a href={`tel:${contact.phone || contact.mobile}`} className="text-brand-600" onClick={(e) => e.stopPropagation()}>
                        {contact.phone || contact.mobile}
                      </a>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-stone-400">
                    <span>{contact._count.searchRequests} demande(s)</span>
                    <span>{contact._count.deals} dossier(s)</span>
                    <span className="ml-auto">{formatDateShort(contact.updatedAt)}</span>
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
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Nom</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Société</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Téléphone</th>
                    <th className="px-4 py-3 text-center font-medium text-stone-500">Demandes</th>
                    <th className="px-4 py-3 text-center font-medium text-stone-500">Dossiers</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Modifié</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.map((contact) => (
                    <tr key={contact.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/contacts/${contact.id}`} className="font-medium text-anthracite-800 hover:text-brand-700">
                          {contact.firstName} {contact.lastName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-stone-600">{contact.company || "—"}</td>
                      <td className="px-4 py-3"><Badge>{CONTACT_TYPE_LABELS[contact.type] || contact.type}</Badge></td>
                      <td className="px-4 py-3 text-stone-600">{contact.email || "—"}</td>
                      <td className="px-4 py-3 text-stone-600">{contact.phone || contact.mobile || "—"}</td>
                      <td className="px-4 py-3 text-center text-stone-500">{contact._count.searchRequests}</td>
                      <td className="px-4 py-3 text-center text-stone-500">{contact._count.deals}</td>
                      <td className="px-4 py-3 text-stone-400">{formatDateShort(contact.updatedAt)}</td>
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
