import Link from "next/link";
import { cn } from "@/lib/utils";

type Tone = "brand" | "blue" | "emerald" | "violet" | "amber" | "red" | "neutral";

const TONE_BG: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-600 ring-brand-100 dark:bg-brand-900/30 dark:text-brand-400 dark:ring-brand-900/40",
  blue: "bg-blue-50 text-blue-600 ring-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-900/30",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-900/30",
  violet: "bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:ring-violet-900/30",
  amber: "bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-900/30",
  red: "bg-red-50 text-red-600 ring-red-100 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-900/30",
  neutral: "bg-stone-100 text-stone-600 ring-stone-200 dark:bg-anthracite-800 dark:text-stone-300 dark:ring-anthracite-700",
};

const TONE_SPARK: Record<Tone, string> = {
  brand: "stroke-brand-500 dark:stroke-brand-400",
  blue: "stroke-blue-500 dark:stroke-blue-400",
  emerald: "stroke-emerald-500 dark:stroke-emerald-400",
  violet: "stroke-violet-500 dark:stroke-violet-400",
  amber: "stroke-amber-500 dark:stroke-amber-400",
  red: "stroke-red-500 dark:stroke-red-400",
  neutral: "stroke-stone-400 dark:stroke-stone-500",
};

interface StatCardProps {
  label: string;
  value: string | number;
  /** Numeric delta vs previous period — formatted automatically */
  delta?: number;
  /** Free-form change label (used if delta isn't provided) */
  change?: string;
  trend?: "up" | "down" | "neutral";
  /** "vs 7j", "vs hier", etc. — appended after the delta */
  deltaLabel?: string;
  icon?: React.ReactNode;
  /** 7+ data points → renders an inline sparkline */
  sparkline?: number[];
  /** When provided the whole card becomes a clickable link */
  href?: string;
  tone?: Tone;
  className?: string;
}

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = Math.max(max - min, 1);
  const w = 80;
  const h = 24;
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("h-6 w-20 overflow-visible", className)}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function deriveTrend(delta: number | undefined, trend?: "up" | "down" | "neutral") {
  if (trend) return trend;
  if (delta == null) return undefined;
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "neutral";
}

function formatDelta(delta: number) {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta}`;
}

export function StatCard({
  label,
  value,
  delta,
  change,
  trend,
  deltaLabel,
  icon,
  sparkline,
  href,
  tone = "brand",
  className,
}: StatCardProps) {
  const finalTrend = deriveTrend(delta, trend);
  const changeText = change ?? (delta != null ? formatDelta(delta) : undefined);

  const inner = (
    <>
      {/* Top accent — visible on hover */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Faint background flare */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-brand-100/40 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100 dark:bg-brand-900/30" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
            {label}
          </p>
          <p className="font-display text-[1.65rem] font-bold leading-none tracking-tight text-anthracite-900 sm:text-3xl dark:text-stone-100">
            {value}
          </p>
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-105",
              TONE_BG[tone]
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {(changeText || sparkline) && (
        <div className="relative mt-3 flex items-center justify-between gap-3">
          {changeText && (
            <p
              className={cn("inline-flex items-center gap-1 text-xs font-medium", {
                "text-emerald-600 dark:text-emerald-400": finalTrend === "up",
                "text-red-500 dark:text-red-400": finalTrend === "down",
                "text-stone-500 dark:text-stone-400": finalTrend === "neutral" || !finalTrend,
              })}
            >
              {finalTrend === "up" && (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
              {finalTrend === "down" && (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              <span>{changeText}</span>
              {deltaLabel && (
                <span className="text-stone-400 dark:text-stone-500"> {deltaLabel}</span>
              )}
            </p>
          )}
          {sparkline && sparkline.length >= 2 && (
            <Sparkline data={sparkline} className={TONE_SPARK[tone]} />
          )}
        </div>
      )}
    </>
  );

  const baseClasses = cn(
    "group relative overflow-hidden rounded-xl border border-stone-200/70 bg-white p-4 shadow-card transition-all duration-300 sm:p-5 dark:border-anthracite-800 dark:bg-anthracite-900",
    href && "hover:-translate-y-0.5 hover:border-brand-200/70 hover:shadow-card-hover",
    className
  );

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {inner}
      </Link>
    );
  }
  return <div className={baseClasses}>{inner}</div>;
}
