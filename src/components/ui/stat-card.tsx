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
        "group relative overflow-hidden rounded-xl border border-stone-200/80 bg-white p-4 shadow-card transition-all hover:shadow-card-hover sm:p-5 dark:border-stone-700/50 dark:bg-anthracite-900",
        className
      )}
    >
      {/* Subtle gradient accent */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-300 via-brand-500 to-champagne-400 opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="flex items-start justify-between">
        <div className="min-w-0 space-y-1 sm:space-y-2">
          <p className="text-xs font-medium text-stone-400 sm:text-sm dark:text-stone-400">{label}</p>
          <p className="text-xl font-bold tracking-tight text-anthracite-900 sm:text-2xl dark:text-stone-100">{value}</p>
        </div>
        {icon && (
          <div className="rounded-xl bg-brand-50 p-2 text-brand-600 sm:p-2.5 dark:bg-brand-900/30 dark:text-brand-400">
            {icon}
          </div>
        )}
      </div>
      {change && (
        <p
          className={cn("mt-1.5 text-xs font-medium sm:mt-2", {
            "text-emerald-600": trend === "up",
            "text-red-500": trend === "down",
            "text-stone-400": trend === "neutral",
          })}
        >
          {trend === "up" && "+"}{change}
        </p>
      )}
    </div>
  );
}
