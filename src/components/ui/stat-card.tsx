import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  trend,
  icon,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-stone-200/70 bg-white p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200/70 hover:shadow-card-hover sm:p-5 dark:border-anthracite-800 dark:bg-anthracite-900",
        className,
      )}
    >
      {/* Top accent — visible on hover */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Faint background flare */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-brand-100/40 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100 dark:bg-brand-900/30" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-500 dark:text-stone-400">
            {label}
          </p>
          <p className="font-display text-[1.65rem] font-bold leading-none tracking-tight text-anthracite-900 sm:text-3xl dark:text-stone-100">
            {value}
          </p>
        </div>
        {icon && (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-transform duration-300 group-hover:scale-105 dark:bg-brand-900/30 dark:text-brand-400 dark:ring-brand-900/40">
            {icon}
          </div>
        )}
      </div>
      {change && (
        <p
          className={cn("relative mt-2 inline-flex items-center gap-1 text-xs font-medium", {
            "text-emerald-600 dark:text-emerald-400": trend === "up",
            "text-red-500 dark:text-red-400": trend === "down",
            "text-stone-500 dark:text-stone-400": trend === "neutral" || !trend,
          })}
        >
          {trend === "up" && (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          )}
          {trend === "down" && (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
          {change}
        </p>
      )}
    </div>
  );
}
