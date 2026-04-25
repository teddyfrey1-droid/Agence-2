"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { haptic } from "@/lib/haptics";

const LS_KEY = "retail-onboarding-seen-v1";

interface Step {
  title: string;
  body: string;
  cta?: { label: string; href: string };
  illustration: React.ReactNode;
}

const STEPS: Step[] = [
  {
    title: "Repérage en 2 clics",
    body: "Tapez sur l'appareil photo depuis n'importe quelle page pour capturer un local — la géolocalisation et l'adresse se remplissent toutes seules.",
    cta: { label: "Essayer le mode terrain", href: "/dashboard/terrain/capture" },
    illustration: (
      <svg viewBox="0 0 100 70" className="h-32 w-full text-brand-500">
        <rect x="22" y="20" width="56" height="36" rx="6" fill="currentColor" opacity="0.12" />
        <circle cx="50" cy="40" r="12" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <circle cx="50" cy="40" r="5" fill="currentColor" />
        <rect x="40" y="14" width="20" height="8" rx="2" fill="currentColor" opacity="0.4" />
        <circle cx="80" cy="22" r="4" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "L'IA rédige pour vous",
    body: "Scannez une carte de visite pour créer un contact, dictez vos notes de terrain, générez l'annonce depuis le type, la surface et le quartier.",
    illustration: (
      <svg viewBox="0 0 100 70" className="h-32 w-full text-brand-500">
        <rect x="14" y="16" width="52" height="32" rx="4" fill="currentColor" opacity="0.12" />
        <rect x="20" y="22" width="20" height="3" rx="1.5" fill="currentColor" opacity="0.5" />
        <rect x="20" y="28" width="30" height="3" rx="1.5" fill="currentColor" opacity="0.5" />
        <rect x="20" y="34" width="24" height="3" rx="1.5" fill="currentColor" opacity="0.5" />
        <g transform="translate(66 8)">
          <path d="M10 0L12 6L18 7L13 11L14 18L10 14L6 18L7 11L2 7L8 6Z" fill="currentColor" />
          <path d="M22 16L23 20L27 21L23 22L22 26L21 22L17 21L21 20Z" fill="currentColor" opacity="0.7" />
        </g>
      </svg>
    ),
  },
  {
    title: "Tout est sous la main",
    body: "Cmd + K ouvre la recherche. Glissez une demande vers la droite pour vous l'attribuer, tirez vers le bas pour rafraîchir une liste.",
    illustration: (
      <svg viewBox="0 0 100 70" className="h-32 w-full text-brand-500">
        <rect x="10" y="14" width="80" height="12" rx="6" fill="currentColor" opacity="0.12" />
        <circle cx="22" cy="20" r="2.5" fill="currentColor" />
        <rect x="30" y="18" width="40" height="4" rx="2" fill="currentColor" opacity="0.6" />
        <rect x="76" y="16" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <text x="82" y="22" fontSize="5" fontWeight="700" textAnchor="middle" fill="currentColor">⌘K</text>
        <rect x="10" y="34" width="80" height="12" rx="4" fill="currentColor" opacity="0.08" />
        <rect x="14" y="38" width="30" height="4" rx="2" fill="currentColor" opacity="0.5" />
        <path d="M68 40 L85 40 M78 35 L85 40 L78 45" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        <rect x="10" y="50" width="80" height="12" rx="4" fill="currentColor" opacity="0.08" />
      </svg>
    ),
  },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(LS_KEY);
      if (!seen) {
        // Delay a touch so the dashboard paints first
        const t = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function close() {
    setOpen(false);
    try {
      localStorage.setItem(LS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function next() {
    haptic("select");
    if (step < STEPS.length - 1) setStep(step + 1);
    else close();
  }

  function prev() {
    haptic("select");
    if (step > 0) setStep(step - 1);
  }

  if (!open) return null;
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-scale-in dark:bg-anthracite-900">
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-brand-500" : "w-1.5 bg-stone-200 dark:bg-stone-700"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={close}
            className="text-xs text-stone-400 hover:text-anthracite-700 dark:text-stone-500 dark:hover:text-stone-200"
          >
            Passer
          </button>
        </div>

        <div className="bg-gradient-to-br from-brand-50 to-champagne-50 px-8 pb-4 pt-6 dark:from-brand-900/20 dark:to-anthracite-800">
          {current.illustration}
        </div>

        <div className="space-y-2 px-6 py-5">
          <h2 className="text-xl font-bold text-anthracite-900 dark:text-stone-100">{current.title}</h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">{current.body}</p>
          {current.cta && (
            <Link
              href={current.cta.href}
              onClick={close}
              className="inline-flex items-center gap-1.5 pt-1 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400"
            >
              {current.cta.label} →
            </Link>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-stone-100 bg-stone-50/50 px-4 py-3 dark:border-stone-800 dark:bg-anthracite-950/40">
          <button
            type="button"
            onClick={prev}
            disabled={step === 0}
            className="rounded-lg px-3 py-2 text-sm font-medium text-stone-500 hover:bg-stone-100 disabled:opacity-40 dark:text-stone-400 dark:hover:bg-anthracite-800"
          >
            Précédent
          </button>
          <button
            type="button"
            onClick={next}
            className="rounded-lg bg-anthracite-900 px-5 py-2 text-sm font-semibold text-white hover:bg-anthracite-800 dark:bg-brand-500 dark:text-anthracite-950 dark:hover:bg-brand-400"
          >
            {isLast ? "C'est parti" : "Suivant"}
          </button>
        </div>
      </div>
    </div>
  );
}
