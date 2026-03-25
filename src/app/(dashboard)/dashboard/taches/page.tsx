import Link from "next/link";
import { findTasks } from "@/modules/tasks";
import { formatDateShort } from "@/lib/utils";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/constants";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function TachesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; priority?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const { items, total } = await findTasks(
    { status: params.status, priority: params.priority },
    page
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900">Tâches</h1>
        <p className="text-sm text-stone-500">{total} tâche(s)</p>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Aucune tâche" description="Les tâches créées manuellement ou automatiquement apparaîtront ici." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Tâche</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Priorité</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Statut</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Assigné</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Lié à</th>
                  <th className="px-4 py-3 text-left font-medium text-stone-500">Échéance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((task) => {
                  const isOverdue =
                    task.dueDate &&
                    new Date(task.dueDate) < new Date() &&
                    ["A_FAIRE", "EN_COURS"].includes(task.status);

                  return (
                    <tr key={task.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-anthracite-800">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-stone-400 line-clamp-1">{task.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusBadgeVariant(task.priority)}>
                          {TASK_PRIORITY_LABELS[task.priority]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusBadgeVariant(task.status)}>
                          {TASK_STATUS_LABELS[task.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        {task.assignedTo
                          ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500">
                        {task.contact && (
                          <Link href={`/dashboard/contacts/${task.contact.firstName}`} className="text-brand-600 hover:underline">
                            {task.contact.firstName} {task.contact.lastName}
                          </Link>
                        )}
                        {task.property && (
                          <Link href={`/dashboard/biens/${task.property.reference}`} className="text-brand-600 hover:underline">
                            {task.property.title}
                          </Link>
                        )}
                        {task.deal && (
                          <Link href={`/dashboard/dossiers/${task.deal.reference}`} className="text-brand-600 hover:underline">
                            {task.deal.title}
                          </Link>
                        )}
                      </td>
                      <td className={`px-4 py-3 ${isOverdue ? "font-medium text-red-600" : "text-stone-400"}`}>
                        {task.dueDate ? formatDateShort(task.dueDate) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
