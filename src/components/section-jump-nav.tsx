"use client";

import { useEffect, useState } from "react";

type Section = { id: string; label: string };

const SECTIONS: Section[] = [
  { id: "manifeste",    label: "Vision" },
  { id: "savoir-faire", label: "Savoir-faire" },
  { id: "recherche",    label: "Recherche" },
  { id: "contact",      label: "Contact" },
];

export function SectionJumpNav() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 240);
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

  // Sections rendered with always-dark backgrounds — labels need to flip light.
  const onDarkSection = active === "contact";

  return (
    <nav
      aria-label="Navigation rapide"
      className={`fixed right-0 top-1/2 z-40 -translate-y-1/2 transition-all duration-700 ${
        visible
          ? "translate-x-0 opacity-100"
          : "pointer-events-none translate-x-3 opacity-0"
      }`}
    >
      <ul className="flex flex-col items-end gap-5 pr-3 sm:pr-5">
        {SECTIONS.map((s) => {
          const isActive = active === s.id;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => jumpTo(s.id)}
                aria-label={s.label}
                aria-current={isActive ? "true" : undefined}
                className="group flex items-center gap-3 sm:gap-4"
              >
                {/* Label — serif italic, elegant, theme-aware */}
                <span
                  className={`whitespace-nowrap font-serif italic transition-all duration-500 ${
                    isActive
                      ? `text-base font-medium ${
                          onDarkSection
                            ? "text-champagne-200"
                            : "text-anthracite-900 dark:text-champagne-200"
                        }`
                      : `text-sm font-light ${
                          onDarkSection
                            ? "text-stone-400 group-hover:text-stone-200"
                            : "text-stone-500 group-hover:text-anthracite-800 dark:text-stone-400 dark:group-hover:text-stone-200"
                        }`
                  }`}
                >
                  {s.label}
                </span>

                {/* Hairline + diamond — sits flush on the page edge */}
                <span className="relative flex items-center">
                  <span
                    className={`block h-px transition-all duration-500 ${
                      isActive
                        ? "w-8 bg-champagne-400"
                        : "w-3 bg-stone-300 group-hover:w-6 group-hover:bg-champagne-300/80 dark:bg-stone-600 dark:group-hover:bg-champagne-300/70"
                    }`}
                  />
                  <span
                    className={`ml-1.5 block rotate-45 transition-all duration-500 ${
                      isActive
                        ? "h-2 w-2 bg-champagne-400 shadow-[0_0_0_4px_rgba(212,184,122,0.18)]"
                        : "h-1.5 w-1.5 bg-stone-300 group-hover:bg-champagne-400 dark:bg-stone-600 dark:group-hover:bg-champagne-400"
                    }`}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
