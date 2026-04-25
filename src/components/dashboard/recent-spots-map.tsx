"use client";

import Link from "next/link";

interface Spot {
  id: string;
  lat: number;
  lng: number;
  address: string;
  createdAt: Date | string;
}

/**
 * Stylised mini-map of Paris. No tiles, no bounds — we project each
 * spot's lat/lng inside a bounding box centred on Paris and pulse the
 * most recent. A clickable overlay covers the whole SVG so any tap
 * navigates to /dashboard/carte.
 */
export function RecentSpotsMap({ spots }: { spots: Spot[] }) {
  // Paris bounding box (rough, padded)
  const minLat = 48.815;
  const maxLat = 48.902;
  const minLng = 2.25;
  const maxLng = 2.42;
  const W = 320;
  const H = 180;

  function project(lat: number, lng: number): [number, number] {
    const x = ((lng - minLng) / (maxLng - minLng)) * W;
    const y = H - ((lat - minLat) / (maxLat - minLat)) * H;
    return [Math.max(4, Math.min(W - 4, x)), Math.max(4, Math.min(H - 4, y))];
  }

  const visible = spots
    .filter((s) => s.lat >= minLat && s.lat <= maxLat && s.lng >= minLng && s.lng <= maxLng)
    .slice(0, 30);

  return (
    <Link
      href="/dashboard/carte"
      aria-label="Ouvrir la carte"
      className="block overflow-hidden rounded-xl border border-stone-200/70 bg-gradient-to-br from-stone-50 to-white transition-all hover:border-brand-300 hover:shadow-card-hover dark:border-stone-700/50 dark:from-anthracite-900 dark:to-anthracite-950"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-44 w-full"
        role="img"
        aria-label="Carte de Paris avec les repérages récents"
      >
        {/* Seine — rough polyline across Paris */}
        <path
          d="M0 90 Q 40 80, 80 95 T 160 105 T 240 95 T 320 110"
          stroke="currentColor"
          className="text-blue-200 dark:text-blue-900/50"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        {/* Arrondissement scaffolding — subtle concentric rings */}
        {[60, 90, 120].map((r) => (
          <circle
            key={r}
            cx={W / 2}
            cy={H / 2 - 8}
            r={r}
            fill="none"
            stroke="currentColor"
            className="text-stone-200/70 dark:text-stone-700/40"
            strokeDasharray="2 4"
          />
        ))}

        {/* Spots */}
        {visible.map((s, i) => {
          const [x, y] = project(s.lat, s.lng);
          const age = Date.now() - new Date(s.createdAt).getTime();
          const fresh = age < 24 * 60 * 60 * 1000;
          return (
            <g key={s.id}>
              {fresh && (
                <circle cx={x} cy={y} r="12" className="text-emerald-500 fill-current">
                  <animate attributeName="r" values="4;14;4" dur="2.4s" repeatCount="indefinite" begin={`${(i % 4) * 0.3}s`} />
                  <animate attributeName="opacity" values="0.5;0;0.5" dur="2.4s" repeatCount="indefinite" begin={`${(i % 4) * 0.3}s`} />
                </circle>
              )}
              <circle
                cx={x}
                cy={y}
                r="4"
                className={fresh ? "fill-emerald-500" : "fill-brand-500"}
                stroke="white"
                strokeWidth="1.5"
              />
            </g>
          );
        })}

        {visible.length === 0 && (
          <text
            x={W / 2}
            y={H / 2}
            textAnchor="middle"
            className="fill-stone-400 dark:fill-stone-500"
            fontSize="11"
          >
            Aucun repérage géolocalisé
          </text>
        )}
      </svg>
      <div className="flex items-center justify-between border-t border-stone-100 px-4 py-2 text-xs dark:border-stone-700/50">
        <span className="text-stone-500 dark:text-stone-400">
          {visible.length} repérage{visible.length !== 1 ? "s" : ""} sur la carte
        </span>
        <span className="font-medium text-brand-600 dark:text-brand-400">Ouvrir la carte →</span>
      </div>
    </Link>
  );
}
