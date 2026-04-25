"use client";

import { useEffect, useState } from "react";
import { Confetti } from "@/components/confetti";
import type { Achievement } from "@/lib/achievements";

interface Displayed extends Achievement {
  key: string;
}

/**
 * Listens for `retail:achievement` window events and surfaces a distinctive
 * celebratory card (auto-dismisses after 5 s). Confetti plays once per unlock.
 */
export function AchievementToaster() {
  const [current, setCurrent] = useState<Displayed | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    function handle(e: Event) {
      const ev = e as CustomEvent<Achievement>;
      if (!ev.detail) return;
      setCurrent({ ...ev.detail, key: `${ev.detail.id}-${Date.now()}` });
      setCelebrate(true);
      const t = setTimeout(() => setCurrent(null), 5000);
      return () => clearTimeout(t);
    }
    window.addEventListener("retail:achievement", handle as EventListener);
    return () => window.removeEventListener("retail:achievement", handle as EventListener);
  }, []);

  if (!current) return <Confetti fire={celebrate} onDone={() => setCelebrate(false)} />;

  return (
    <>
      <Confetti fire={celebrate} onDone={() => setCelebrate(false)} count={150} />
      <div
        className="fixed left-1/2 top-20 z-[9998] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-champagne-50 p-4 shadow-2xl animate-scale-in dark:border-brand-700 dark:from-brand-900/40 dark:via-anthracite-900 dark:to-anthracite-900"
        role="status"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-champagne-500 text-2xl shadow-inner">
            {current.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
              Succès débloqué
            </p>
            <p className="mt-0.5 text-sm font-bold text-anthracite-900 dark:text-stone-100">
              {current.title}
            </p>
            <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400">
              {current.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrent(null)}
            className="ml-2 flex h-6 w-6 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 dark:hover:bg-anthracite-800"
            aria-label="Fermer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
