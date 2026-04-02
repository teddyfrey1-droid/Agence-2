"use client";

interface ActivityChartProps {
  data: { label: string; value: number }[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-anthracite-900 dark:text-stone-100">{total}</span>
        <span className="text-sm text-stone-500 dark:text-stone-400">interactions</span>
      </div>
      <div className="flex items-end gap-2" style={{ height: 100 }}>
        {data.map((d, i) => {
          const barHeight = Math.max((d.value / max) * 100, 4);
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="relative w-full flex justify-center">
                {d.value > 0 && (
                  <span className="text-[10px] font-semibold text-anthracite-700 dark:text-stone-300">
                    {d.value}
                  </span>
                )}
              </div>
              <div
                className="w-full rounded-t-md bg-brand-500 dark:bg-brand-400 transition-all duration-700 ease-out"
                style={{ height: `${barHeight}%`, minHeight: "3px" }}
              />
              <span className="text-[10px] text-stone-400 dark:text-stone-500">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
