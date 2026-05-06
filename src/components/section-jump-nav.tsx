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
      className={`pointer-events-none fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 transition-all duration-700 lg:block ${
        visible ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0"
      }`}
    >
      <ul className="pointer-events-auto flex flex-col gap-1">
        {SECTIONS.map((s) => {
          const isActive = active === s.id;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => jumpTo(s.id)}
                aria-label={s.label}
                aria-current={isActive ? "true" : undefined}
                className="group relative flex items-center justify-end gap-3 py-1.5 pl-3 pr-1 text-right"
              >
                {/* Label — slides in on hover/active */}
                <span
                  className={`pointer-events-none whitespace-nowrap font-sans text-[10px] font-semibold tracking-[0.35em] uppercase transition-all duration-500 ${
                    isActive
                      ? "translate-x-0 opacity-100 text-anthracite-800 dark:text-champagne-300"
                      : "translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 text-stone-500 dark:text-stone-400"
                  }`}
                >
                  {s.label}
                </span>

                {/* Tick — short rule that grows when active */}
                <span
                  className={`block h-px transition-all duration-500 ${
                    isActive
                      ? "w-7 bg-champagne-400"
                      : "w-3 bg-stone-300 group-hover:w-5 group-hover:bg-stone-400 dark:bg-stone-600 dark:group-hover:bg-stone-400"
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
