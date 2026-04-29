import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";

export default function VisitesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="mb-2 h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <SkeletonTable rows={5} cols={6} />
    </div>
  );
}
