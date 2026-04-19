"use client";

interface MiniBarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export function MiniBarChart({ data, height = 120, color = "bg-brand-500" }: MiniBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const barHeight = Math.max((d.value / max) * 100, 4);
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400">
              {d.value > 0 ? d.value : ""}
            </span>
            <div
              className={`w-full rounded-t-md ${color} transition-all duration-500 ease-out`}
              style={{ height: `${barHeight}%`, minHeight: "3px" }}
            />
            <span className="text-[9px] text-stone-400 dark:text-stone-500 truncate w-full text-center">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
