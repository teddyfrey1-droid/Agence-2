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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-anthracite-900">Contacts</h1>
          <p className="text-sm text-stone-500">{total} contact(s)</p>
        </div>
        <Link href="/dashboard/contacts/nouveau">
          <Button>Nouveau contact</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Aucun contact" description="Ajoutez votre premier contact ou attendez les premières demandes via le site." />
      ) : (
        <Card className="overflow-hidden">
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
                    <td className="px-4 py-3">
                      <Badge>{CONTACT_TYPE_LABELS[contact.type] || contact.type}</Badge>
                    </td>
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
      )}
    </div>
  );
}
