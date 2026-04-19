"use client";

interface ActivityChartProps {
  data: { label: string; value: number }[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((s, d) => s + d.value, 0);
  const today = new Date().getDay();
  const dayIndex = data.length - 1; // last item = today

  return (
    <div>
      <div className="mb-4 flex items-baseline gap-2">
        <span
          className="leading-none tracking-tight text-anthracite-900 dark:text-stone-100"
          style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.75rem" }}
        >
          {total}
        </span>
        <span className="text-sm text-stone-500 dark:text-stone-400">interactions cette semaine</span>
      </div>
      <div className="flex items-end gap-1.5" style={{ height: 96 }}>
        {data.map((d, i) => {
          const barPct = Math.max((d.value / max) * 100, 4);
          const isToday = i === dayIndex;
          return (
            <div key={i} className="group flex flex-1 flex-col items-center gap-1.5 h-full">
              <div className="flex flex-1 w-full flex-col justify-end">
                <div
                  className={cn(
                    "w-full rounded-t-[5px] transition-all duration-700 ease-out animate-bar-grow cursor-pointer",
                    isToday
                      ? "bg-brand-500 hover:bg-brand-600"
                      : "bg-brand-200 hover:bg-brand-400 dark:bg-brand-800/60 dark:hover:bg-brand-600"
                  )}
                  style={{
                    height: `${barPct}%`,
                    animationDelay: `${i * 55}ms`,
                  }}
                  title={`${d.value} interaction${d.value !== 1 ? "s" : ""}`}
                />
              </div>
              <span
                className={cn(
                  "text-[9.5px] font-semibold tracking-wide",
                  isToday ? "text-brand-600 dark:text-brand-400" : "text-stone-400 dark:text-stone-500"
                )}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
