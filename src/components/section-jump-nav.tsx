"use client";

import { useEffect, useState } from "react";

type Section = { id: string; label: string };

const SECTIONS: Section[] = [
  { id: "manifeste", label: "Vision" },
  { id: "savoir-faire", label: "Savoir-faire" },
  { id: "recherche", label: "Recherche" },
  { id: "contact", label: "Contact" },
];

export function SectionJumpNav() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () =>
      setVisible(window.scrollY > window.innerHeight * 0.5);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      className={`fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 transition-all duration-700 lg:block ${
        visible
          ? "translate-x-0 opacity-100"
          : "pointer-events-none translate-x-3 opacity-0"
      }`}
    >
      {/* Soft champagne halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-full bg-champagne-400/15 blur-2xl"
      />

      <ul className="relative flex flex-col gap-1 rounded-full border border-stone-200 bg-white/85 p-1.5 shadow-[0_24px_60px_-30px_rgba(15,16,20,0.35)] backdrop-blur-xl dark:border-stone-700 dark:bg-anthracite-900/85">
        {SECTIONS.map((s) => {
          const isActive = active === s.id;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => jumpTo(s.id)}
                aria-current={isActive ? "true" : undefined}
                className={`group relative flex w-full items-center gap-2.5 rounded-full px-4 py-2 font-sans text-[10px] font-semibold tracking-[0.3em] uppercase transition-all duration-500 ${
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
                <span className="whitespace-nowrap">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
