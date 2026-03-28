import { SkeletonKPI } from "@/components/ui/skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-7 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonKPI key={i} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-stone-200/80 bg-white p-4 dark:border-stone-700/50 dark:bg-anthracite-900">
          <Skeleton className="mb-4 h-5 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-stone-200/80 bg-white p-4 dark:border-stone-700/50 dark:bg-anthracite-900">
          <Skeleton className="mb-4 h-5 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
