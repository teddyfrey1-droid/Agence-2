import { SkeletonTable, Skeleton } from "@/components/ui/skeleton";

export default function TachesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-7 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
      <SkeletonTable rows={6} cols={6} />
    </div>
  );
}
