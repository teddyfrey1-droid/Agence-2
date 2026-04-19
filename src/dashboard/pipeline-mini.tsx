"use client";

const STAGE_COLORS: Record<string, string> = {
  PROSPECT:    "#94a3b8",
  DECOUVERTE:  "#3b82f6",
  VISITE:      "#6366f1",
  NEGOCIATION: "#f59e0b",
  OFFRE:       "#f97316",
  COMPROMIS:   "#8b5cf6",
  ACTE:        "#10b981",
  CLOTURE:     "#16a34a",
};

interface PipelineMiniProps {
  data: { stage: string; label: string; count: number }[];
}

export function PipelineMini({ data }: PipelineMiniProps) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div>
      <div className="mb-4 flex items-baseline gap-2">
        <span
          className="leading-none tracking-tight text-anthracite-900 dark:text-stone-100"
          style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.75rem" }}
        >
          {total}
        </span>
        <span className="text-sm text-stone-500 dark:text-stone-400">dossiers actifs</span>
      </div>
      <div className="space-y-2.5">
        {data.filter(d => d.count > 0 || d.stage === "PROSPECT").map((d) => {
          const width = max > 0 ? Math.max((d.count / max) * 100, d.count > 0 ? 6 : 0) : 0;
          const color = STAGE_COLORS[d.stage] || "#94a3b8";
          return (
            <div key={d.stage} className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 w-[88px] flex-shrink-0">
                <div
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <span className="truncate text-[11.5px] font-medium text-stone-500 dark:text-stone-400">
                  {d.label}
                </span>
              </div>
              <div className="flex-1 h-[5px] rounded-full bg-stone-100 dark:bg-anthracite-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${width}%`,
                    background: color,
                    opacity: 0.75,
                  }}
                />
              </div>
              <span className="w-4 text-right text-[11px] font-bold text-anthracite-700 dark:text-stone-300 tabular-nums">
                {d.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
