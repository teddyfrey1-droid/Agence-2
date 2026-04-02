import { SkeletonTable, Skeleton } from "@/components/ui/skeleton";

export default function DossiersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="mb-2 h-7 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>
      <SkeletonTable rows={6} cols={8} />
    </div>
  );
}
