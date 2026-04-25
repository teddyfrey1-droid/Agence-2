"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { haptic } from "@/lib/haptics";
import { unlockAchievement } from "@/lib/achievements";

interface Props {
  propertyId: string;
  type: string;
  transactionType: string;
  district: string | null;
  city: string | null;
  quarter: string | null;
  surface: number | null;
  hasExtraction: boolean;
  hasTerrace: boolean;
  hasParking: boolean;
  hasLoadingDock: boolean;
  hasDescription: boolean;
}

const SUPPRESS_KEY = "retail-ai-suggestion-dismissed";

/**
 * Discreet banner offered when a property has no real description yet.
 *  - Hides itself if the description is already filled
 *  - Hides itself if the AI key isn't configured server-side
 *  - Hides itself for the rest of the session once dismissed
 *  - Generates the listing in place and PATCHes the property
 */
export function PropertyAiSuggestion(props: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [generating, setGenerating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [result, setResult] = useState<{ title: string; description: string } | null>(null);

  useEffect(() => {
    if (props.hasDescription) return;
    try {
      if (sessionStorage.getItem(`${SUPPRESS_KEY}:${props.propertyId}`)) {
        setDismissed(true);
        return;
      }
    } catch { /* ignore */ }
    let cancelled = false;
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((d) => !cancelled && setAiAvailable(Boolean(d?.enabled)))
      .catch(() => !cancelled && setAiAvailable(false));
    return () => { cancelled = true; };
  }, [props.hasDescription, props.propertyId]);

  if (props.hasDescription || dismissed || aiAvailable !== true) return null;

  function dismiss() {
    haptic("tap");
    setDismissed(true);
    try {
      sessionStorage.setItem(`${SUPPRESS_KEY}:${props.propertyId}`, "1");
    } catch { /* ignore */ }
  }

  async function generate() {
    setGenerating(true);
    haptic("tap");
    try {
      const res = await fetch("/api/ai/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: props.type,
          transactionType: props.transactionType,
          district: props.district,
          city: props.city,
          quarter: props.quarter,
          surface: props.surface ?? undefined,
          hasExtraction: props.hasExtraction,
          hasTerrace: props.hasTerrace,
          hasParking: props.hasParking,
          hasLoadingDock: props.hasLoadingDock,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur IA");
      }
      const data = await res.json();
      setResult({ title: data.title, description: data.description });
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Erreur IA", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function apply() {
    if (!result) return;
    haptic("tap");
    try {
      const res = await fetch(`/api/properties/${props.propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result.title,
          description: result.description,
        }),
      });
      if (!res.ok) throw new Error();
      unlockAchievement("first_ai_listing");
      addToast("Annonce enregistrée", "success");
      setDismissed(true);
      router.refresh();
    } catch {
      addToast("Erreur lors de l'enregistrement", "error");
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-200/80 bg-gradient-to-r from-brand-50 via-white to-champagne-50 p-4 shadow-sm dark:border-brand-700/60 dark:from-brand-900/30 dark:via-anthracite-900 dark:to-anthracite-900">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Masquer la suggestion"
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-anthracite-700 dark:hover:bg-anthracite-800 dark:hover:text-stone-200"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-champagne-500 text-white shadow-inner">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          {!result && (
            <>
              <p className="text-sm font-semibold text-anthracite-900 dark:text-stone-100">
                Cette fiche n&apos;a pas de description
              </p>
              <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400">
                L&apos;IA peut rédiger un titre + une description en 5 secondes à partir des caractéristiques.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={generate}
                  disabled={generating}
                  className="inline-flex items-center gap-1.5 rounded-full bg-anthracite-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-anthracite-800 disabled:opacity-50 dark:bg-brand-500 dark:text-anthracite-950 dark:hover:bg-brand-400"
                >
                  {generating ? (
                    <>
                      <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Rédaction…
                    </>
                  ) : (
                    "Essayer maintenant"
                  )}
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="text-xs text-stone-500 hover:text-anthracite-700 dark:text-stone-400 dark:hover:text-stone-200"
                >
                  Plus tard
                </button>
              </div>
            </>
          )}

          {result && (
            <>
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                Proposition de l&apos;IA
              </p>
              <p className="mt-1 text-sm font-bold text-anthracite-900 dark:text-stone-100">{result.title}</p>
              <p className="mt-1 line-clamp-3 text-xs text-stone-700 dark:text-stone-300">{result.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={apply}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Appliquer
                </button>
                <button
                  type="button"
                  onClick={generate}
                  disabled={generating}
                  className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
                >
                  Régénérer
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="text-xs text-stone-500 hover:text-anthracite-700 dark:text-stone-400 dark:hover:text-stone-200"
                >
                  Annuler
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
