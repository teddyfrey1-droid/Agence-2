import { Skeleton } from "@/components/ui/skeleton";

export default function CarteLoading() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="mb-2 h-7 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-[70vh] w-full rounded-xl" />
    </div>
  );
}
