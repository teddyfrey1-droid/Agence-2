import Link from "next/link";
import { findTasks } from "@/modules/tasks";
import { formatDateShort } from "@/lib/utils";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/constants";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";

export default async function TachesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; priority?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const { items, total, totalPages } = await findTasks(
    { status: params.status, priority: params.priority },
    page
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-anthracite-900 sm:text-2xl dark:text-stone-100">Tâches</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">{total} tâche(s)</p>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Aucune tache" description="Les taches creees manuellement ou automatiquement apparaitront ici." />
      ) : (
        <>
          {/* Mobile: card view */}
          <div className="space-y-3 lg:hidden">
            {items.map((task) => {
              const isOverdue =
                task.dueDate &&
                new Date(task.dueDate) < new Date() &&
                ["A_FAIRE", "EN_COURS"].includes(task.status);

              return (
                <Card key={task.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-anthracite-800 dark:text-stone-200">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 line-clamp-2">{task.description}</p>
                      )}
                    </div>
                    <Badge variant={getStatusBadgeVariant(task.priority)}>
                      {TASK_PRIORITY_LABELS[task.priority]}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(task.status)}>
                      {TASK_STATUS_LABELS[task.status]}
                    </Badge>
                    {task.assignedTo && (
                      <span className="text-xs text-stone-500 dark:text-stone-400">
                        {task.assignedTo.firstName} {task.assignedTo.lastName}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className={`ml-auto text-xs ${isOverdue ? "font-semibold text-red-600 dark:text-red-400" : "text-stone-400 dark:text-stone-500"}`}>
                        {isOverdue && "! "}
                        {formatDateShort(task.dueDate)}
                      </span>
                    )}
                  </div>
                  {(task.contact || task.property || task.deal) && (
                    <div className="mt-2 text-xs text-brand-600 dark:text-brand-400">
                      {task.contact && <span>{task.contact.firstName} {task.contact.lastName}</span>}
                      {task.property && <span>{task.property.title}</span>}
                      {task.deal && <span>{task.deal.title}</span>}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Desktop: table */}
          <Card className="hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50 dark:border-stone-700/50 dark:bg-anthracite-800/50">
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Tâche</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Priorité</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Statut</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Assigné</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Lié à</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Échéance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-700/50">
                  {items.map((task) => {
                    const isOverdue =
                      task.dueDate &&
                      new Date(task.dueDate) < new Date() &&
                      ["A_FAIRE", "EN_COURS"].includes(task.status);
                    return (
                      <tr key={task.id} className="hover:bg-stone-50 dark:hover:bg-anthracite-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-anthracite-800 dark:text-stone-200">{task.title}</p>
                          {task.description && <p className="text-xs text-stone-400 dark:text-stone-500 line-clamp-1">{task.description}</p>}
                        </td>
                        <td className="px-4 py-3"><Badge variant={getStatusBadgeVariant(task.priority)}>{TASK_PRIORITY_LABELS[task.priority]}</Badge></td>
                        <td className="px-4 py-3"><Badge variant={getStatusBadgeVariant(task.status)}>{TASK_STATUS_LABELS[task.status]}</Badge></td>
                        <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : "—"}</td>
                        <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">
                          {task.contact && <Link href={`/dashboard/contacts/${task.contactId}`} className="text-brand-600 hover:underline dark:text-brand-400">{task.contact.firstName} {task.contact.lastName}</Link>}
                          {task.property && <Link href={`/dashboard/biens/${task.propertyId}`} className="text-brand-600 hover:underline dark:text-brand-400">{task.property.title}</Link>}
                          {task.deal && <Link href={`/dashboard/dossiers/${task.dealId}`} className="text-brand-600 hover:underline dark:text-brand-400">{task.deal.title}</Link>}
                        </td>
                        <td className={`px-4 py-3 ${isOverdue ? "font-medium text-red-600 dark:text-red-400" : "text-stone-400 dark:text-stone-500"}`}>{task.dueDate ? formatDateShort(task.dueDate) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath="/dashboard/taches" params={{ status: params.status, priority: params.priority }} />
    </div>
  );
}
