import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

export default function ParametresLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-7 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-48" />
      </div>
    </div>
  );
}
