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
        "rounded-premium border border-stone-200 bg-white p-5 shadow-card",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-stone-500">{label}</p>
          <p className="text-2xl font-semibold text-anthracite-900">{value}</p>
        </div>
        {icon && (
          <div className="rounded-lg bg-brand-50 p-2.5 text-brand-600">
            {icon}
          </div>
        )}
      </div>
      {change && (
        <p
          className={cn("mt-2 text-xs font-medium", {
            "text-emerald-600": trend === "up",
            "text-red-600": trend === "down",
            "text-stone-500": trend === "neutral",
          })}
        >
          {change}
        </p>
      )}
    </div>
  );
}
