import { findTasks } from "@/modules/tasks";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { TaskListClient } from "@/components/tasks/task-list-client";

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
        <h1 className="text-xl font-semibold text-anthracite-900 sm:text-2xl dark:text-stone-100">
          Tâches
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">{total} tâche(s)</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Aucune tâche"
          description="Les tâches créées manuellement ou automatiquement apparaîtront ici."
        />
      ) : (
        <TaskListClient items={items as never} />
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath="/dashboard/taches"
        params={{ status: params.status, priority: params.priority }}
      />
    </div>
  );
}
