import { Skeleton, SkeletonKPI, SkeletonCard } from "@/components/ui/skeleton";

export default function PerformanceLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonKPI />
        <SkeletonKPI />
        <SkeletonKPI />
        <SkeletonKPI />
      </div>
      <SkeletonCard className="h-72" />
    </div>
  );
}
