import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-stone-200/70 dark:bg-stone-700/50",
        className
      )}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-3/4" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-xl border border-stone-200/80 bg-white p-4 dark:border-stone-700/50 dark:bg-anthracite-900", className)}>
      <Skeleton className="mb-3 h-5 w-1/3" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-2 h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-stone-200/80 bg-white overflow-hidden dark:border-stone-700/50 dark:bg-anthracite-900">
      {/* Header */}
      <div className="border-b border-stone-100 bg-stone-50/50 px-4 py-3 dark:border-stone-700/50 dark:bg-anthracite-800/50">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="border-b border-stone-100 px-4 py-3 last:border-0 dark:border-stone-700/50">
          <div className="flex gap-4">
            {Array.from({ length: cols }).map((_, ci) => (
              <Skeleton key={ci} className={cn("h-4 flex-1", ci === 0 && "max-w-[80px]")} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonKPI() {
  return (
    <div className="rounded-xl border border-stone-200/80 bg-white p-4 dark:border-stone-700/50 dark:bg-anthracite-900">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="mb-2 h-3 w-20" />
          <Skeleton className="h-6 w-12" />
        </div>
      </div>
    </div>
  );
}
