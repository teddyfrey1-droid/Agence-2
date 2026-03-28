"use client";

const STAGE_COLORS: Record<string, string> = {
  PROSPECT: "bg-stone-400",
  DECOUVERTE: "bg-blue-400",
  VISITE: "bg-indigo-400",
  NEGOCIATION: "bg-amber-500",
  OFFRE: "bg-orange-500",
  COMPROMIS: "bg-purple-500",
  ACTE: "bg-emerald-500",
  CLOTURE: "bg-green-600",
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
        <span className="text-2xl font-bold text-anthracite-900 dark:text-stone-100">{total}</span>
        <span className="text-sm text-stone-500 dark:text-stone-400">dossiers actifs</span>
      </div>
      <div className="space-y-2">
        {data.map((d) => {
          const width = max > 0 ? Math.max((d.count / max) * 100, 2) : 2;
          return (
            <div key={d.stage} className="flex items-center gap-2">
              <span className="w-20 truncate text-[11px] text-stone-500 dark:text-stone-400">{d.label}</span>
              <div className="flex-1 h-4 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${STAGE_COLORS[d.stage] || "bg-stone-400"} transition-all duration-500`}
                  style={{ width: `${width}%` }}
                />
              </div>
              <span className="w-5 text-right text-[11px] font-semibold text-anthracite-700 dark:text-stone-300">
                {d.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
