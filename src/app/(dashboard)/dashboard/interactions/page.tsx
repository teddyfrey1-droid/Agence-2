import { findInteractions } from "@/modules/interactions";
import { formatDateShort } from "@/lib/utils";
import { INTERACTION_TYPE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function InteractionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const { items, total } = await findInteractions({ type: params.type }, page);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-anthracite-900 sm:text-2xl">Interactions</h1>
        <p className="text-sm text-stone-500">{total} interaction(s)</p>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Aucune interaction" description="Les appels, emails, visites et notes apparaîtront ici." />
      ) : (
        <>
          {/* Mobile: card view */}
          <div className="space-y-3 lg:hidden">
            {items.map((interaction) => (
              <Card key={interaction.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-anthracite-800">
                      {interaction.subject || INTERACTION_TYPE_LABELS[interaction.type] || interaction.type}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {interaction.contact
                        ? `${interaction.contact.firstName} ${interaction.contact.lastName}`
                        : "—"}
                      {interaction.user && ` · par ${interaction.user.firstName} ${interaction.user.lastName}`}
                    </p>
                  </div>
                  <Badge>{INTERACTION_TYPE_LABELS[interaction.type] || interaction.type}</Badge>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-stone-400">
                  {(interaction.property?.title || interaction.deal?.title) && (
                    <span>{interaction.property?.title || interaction.deal?.title}</span>
                  )}
                  <span className="ml-auto">{formatDateShort(interaction.date)}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <Card className="hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Sujet</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Contact</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Par</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Bien / Dossier</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.map((interaction) => (
                    <tr key={interaction.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3"><Badge>{INTERACTION_TYPE_LABELS[interaction.type] || interaction.type}</Badge></td>
                      <td className="px-4 py-3 font-medium text-anthracite-800">{interaction.subject || "—"}</td>
                      <td className="px-4 py-3 text-stone-600">{interaction.contact ? `${interaction.contact.firstName} ${interaction.contact.lastName}` : "—"}</td>
                      <td className="px-4 py-3 text-stone-600">{interaction.user ? `${interaction.user.firstName} ${interaction.user.lastName}` : "—"}</td>
                      <td className="px-4 py-3 text-xs text-stone-500">{interaction.property?.title || interaction.deal?.title || "—"}</td>
                      <td className="px-4 py-3 text-stone-400">{formatDateShort(interaction.date)}</td>
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
