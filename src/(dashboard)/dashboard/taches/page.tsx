import { findTasks } from "@/modules/tasks";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
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
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Suivi"
        title="Tâches"
        description={`${total} tâche${total !== 1 ? "s" : ""} à piloter au quotidien.`}
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        }
      />

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
