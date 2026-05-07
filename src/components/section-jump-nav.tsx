"use client";

import { useEffect, useState } from "react";

type Section = { id: string; label: string; short: string };

const SECTIONS: Section[] = [
  { id: "manifeste",    label: "Vision",       short: "Vis." },
  { id: "savoir-faire", label: "Savoir-faire", short: "Sav." },
  { id: "recherche",    label: "Recherche",    short: "Rech." },
  { id: "contact",      label: "Contact",      short: "Cont." },
];

export function SectionJumpNav() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 240);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Brief pulse the first time the nav appears, to draw attention
  useEffect(() => {
    if (!visible) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 2400);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    const targets = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => !!el
    );
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visibleEntries[0]) setActive(visibleEntries[0].target.id);
      },
      { threshold: [0.25, 0.5, 0.75], rootMargin: "-30% 0px -30% 0px" }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  function jumpTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  return (
    <nav
      aria-label="Navigation rapide"
      className={`fixed right-3 top-1/2 z-40 -translate-y-1/2 transition-all duration-700 sm:right-4 ${
        visible
          ? "translate-x-0 opacity-100"
          : "pointer-events-none translate-x-3 opacity-0"
      }`}
    >
      {/* Champagne halo — strengthens the pulse on appearance */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -inset-2 rounded-full bg-champagne-400/20 blur-2xl transition-opacity duration-700 ${
          pulse ? "opacity-100" : "opacity-60"
        }`}
      />
      {/* Outer pulsing ring — first impression only */}
      {pulse && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-champagne-400/60 animate-pulse-soft"
        />
      )}

      <ul className="relative flex flex-col gap-1 rounded-full border border-stone-200 bg-white/90 p-1.5 shadow-[0_24px_60px_-30px_rgba(15,16,20,0.4)] backdrop-blur-xl dark:border-stone-700 dark:bg-anthracite-900/90">
        {SECTIONS.map((s) => {
          const isActive = active === s.id;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => jumpTo(s.id)}
                aria-label={s.label}
                aria-current={isActive ? "true" : undefined}
                className={`group relative flex w-full items-center gap-2 rounded-full px-3 py-2 font-sans text-[10px] font-semibold tracking-[0.25em] uppercase transition-all duration-500 sm:gap-2.5 sm:px-4 sm:tracking-[0.3em] ${
                  isActive
                    ? "bg-anthracite-900 text-champagne-300 shadow-[0_8px_22px_-10px_rgba(163,129,90,0.55)] dark:bg-champagne-500 dark:text-anthracite-900"
                    : "text-stone-500 hover:bg-stone-100 hover:text-anthracite-900 dark:text-stone-400 dark:hover:bg-anthracite-800 dark:hover:text-stone-100"
                }`}
              >
                <span
                  aria-hidden
                  className={`block h-1.5 w-1.5 flex-none rotate-45 transition-colors duration-500 ${
                    isActive
                      ? "bg-champagne-400 dark:bg-anthracite-900"
                      : "bg-stone-300 group-hover:bg-stone-400 dark:bg-stone-600 dark:group-hover:bg-stone-400"
                  }`}
                />
                <span className="hidden whitespace-nowrap sm:inline">
                  {s.label}
                </span>
                <span className="whitespace-nowrap sm:hidden">{s.short}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
