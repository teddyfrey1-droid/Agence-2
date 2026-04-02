import { findInteractions } from "@/modules/interactions";
import { formatDateShort } from "@/lib/utils";
import { INTERACTION_TYPE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";

export default async function InteractionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const { items, total, totalPages } = await findInteractions({ type: params.type }, page);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">Interactions</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">{total} interaction(s)</p>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Aucune interaction" description="Les appels, emails, visites et notes apparaitront ici." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50 dark:border-stone-700/50 dark:bg-anthracite-800/50">
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Sujet</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Contact</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Par</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Bien / Dossier</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {items.map((interaction) => (
                  <tr key={interaction.id} className="transition-colors hover:bg-stone-50 dark:hover:bg-anthracite-800/50">
                    <td className="px-4 py-3">
                      <Badge>{INTERACTION_TYPE_LABELS[interaction.type] || interaction.type}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-anthracite-800 dark:text-stone-200">
                      {interaction.subject || "—"}
                    </td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                      {interaction.contact
                        ? `${interaction.contact.firstName} ${interaction.contact.lastName}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                      {interaction.user
                        ? `${interaction.user.firstName} ${interaction.user.lastName}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">
                      {interaction.property?.title || interaction.deal?.title || "—"}
                    </td>
                    <td className="px-4 py-3 text-stone-400 dark:text-stone-500">
                      {formatDateShort(interaction.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath="/dashboard/interactions" params={{ type: params.type }} />
    </div>
  );
}
