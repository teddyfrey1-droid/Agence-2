import { SkeletonTable, Skeleton } from "@/components/ui/skeleton";

export default function InteractionsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-7 w-32" />
        <Skeleton className="h-4 w-28" />
      </div>
      <SkeletonTable rows={8} cols={6} />
    </div>
  );
}
