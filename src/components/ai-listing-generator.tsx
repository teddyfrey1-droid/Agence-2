"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { unlockAchievement } from "@/lib/achievements";

export interface ListingContextInput {
  type?: string | null;
  transactionType?: string | null;
  surface?: number | null;
  district?: string | null;
  city?: string | null;
  quarter?: string | null;
  price?: number | null;
  rentMonthly?: number | null;
  hasExtraction?: boolean;
  hasTerrace?: boolean;
  hasParking?: boolean;
  hasLoadingDock?: boolean;
  floor?: number | null;
  facadeLength?: number | null;
  ceilingHeight?: number | null;
  notes?: string | null;
}

interface Props {
  /** Called each time the user clicks to get the latest form values. */
  getContext: () => ListingContextInput;
  onApply: (result: { title: string; description: string }) => void;
  /** If true, render as a compact inline button instead of a wide banner. */
  compact?: boolean;
}

export function AIListingGenerator({ getContext, onApply, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ title: string; description: string; hooks: string[] } | null>(null);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setAiAvailable(Boolean(d?.enabled));
      })
      .catch(() => !cancelled && setAiAvailable(false));
    return () => {
      cancelled = true;
    };
  }, []);

  async function run() {
    const ctx = getContext();
    if (!ctx.type && !ctx.surface && !ctx.district) {
      addToast("Renseignez au moins le type, la surface ou le quartier", "info");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ctx),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur IA");
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Erreur IA", "error");
    } finally {
      setLoading(false);
    }
  }

  function apply() {
    if (!result) return;
    onApply({ title: result.title, description: result.description });
    addToast("Annonce appliquée au formulaire", "success");
    unlockAchievement("first_ai_listing");
    setOpen(false);
    setResult(null);
  }

  if (aiAvailable === false) return null;

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            run();
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand-300 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-100 dark:border-brand-600 dark:bg-brand-900/30 dark:text-brand-200"
        >
          <SparkleIcon className="h-3.5 w-3.5" />
          Générer avec l&apos;IA
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            run();
          }}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-brand-300 bg-gradient-to-r from-brand-50 to-champagne-50 px-4 py-3 text-left transition-all hover:border-brand-400 hover:from-brand-100 hover:to-champagne-100 dark:border-brand-600 dark:from-brand-900/20 dark:to-anthracite-800/50 dark:hover:from-brand-900/30"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-champagne-500 text-white">
              <SparkleIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-anthracite-800 dark:text-stone-100">
                Rédiger l&apos;annonce avec l&apos;IA
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Titre + description à partir du type, de la surface et du quartier
              </p>
            </div>
          </div>
          <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">→</span>
        </button>
      )}

      <Modal
        open={open}
        onClose={() => {
          if (!loading) {
            setOpen(false);
            setResult(null);
          }
        }}
        title="Rédaction IA de l'annonce"
        size="lg"
      >
        {loading && (
          <div className="flex items-center gap-3 rounded-xl bg-brand-50 p-4 text-sm text-brand-800 dark:bg-brand-900/20 dark:text-brand-200">
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            L&apos;IA rédige votre annonce…
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4">
            <div>
              <label className="text-caption mb-1 block">Titre proposé</label>
              <p className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm font-semibold text-anthracite-900 dark:border-stone-700 dark:bg-anthracite-800 dark:text-stone-100">
                {result.title}
              </p>
            </div>
            <div>
              <label className="text-caption mb-1 block">Description proposée</label>
              <p className="whitespace-pre-line rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-anthracite-700 dark:border-stone-700 dark:bg-anthracite-800 dark:text-stone-300">
                {result.description}
              </p>
            </div>
            {result.hooks && result.hooks.length > 0 && (
              <div>
                <label className="text-caption mb-1 block">Accroches</label>
                <ul className="flex flex-wrap gap-2">
                  {result.hooks.map((hook, i) => (
                    <li
                      key={i}
                      className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-800 dark:bg-brand-900/40 dark:text-brand-200"
                    >
                      {hook}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={run} disabled={loading}>
                Régénérer
              </Button>
              <Button type="button" onClick={apply}>
                Appliquer au formulaire
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
      />
    </svg>
  );
}
