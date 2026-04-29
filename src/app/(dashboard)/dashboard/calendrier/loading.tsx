import { Skeleton } from "@/components/ui/skeleton";

export default function CalendrierLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="mb-2 h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <Skeleton className="h-[60vh] w-full rounded-xl" />
    </div>
  );
}
