"use client";

import { useEffect, useRef, useState } from "react";

export type Service = {
  num: string;
  title: string;
  description: string;
};

export function ServicesCarousel({ services }: { services: Service[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  // Sync active card + arrow state with native scroll position
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const update = () => {
      const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-card]"));
      if (cards.length === 0) return;
      const center = track.scrollLeft + track.clientWidth / 2;
      let nearest = 0;
      let bestDist = Infinity;
      cards.forEach((c, i) => {
        const cardCenter = c.offsetLeft + c.offsetWidth / 2;
        const d = Math.abs(cardCenter - center);
        if (d < bestDist) {
          bestDist = d;
          nearest = i;
        }
      });
      setActive(nearest);
      setCanPrev(track.scrollLeft > 4);
      setCanNext(
        track.scrollLeft + track.clientWidth < track.scrollWidth - 4
      );
    };

    update();
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [services.length]);

  function scrollTo(idx: number) {
    const track = trackRef.current;
    if (!track) return;
    const cards = track.querySelectorAll<HTMLElement>("[data-card]");
    const card = cards[idx];
    if (!card) return;
    const target =
      card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
    track.scrollTo({ left: target, behavior: "smooth" });
  }

  function nudge(dir: 1 | -1) {
    scrollTo(Math.max(0, Math.min(services.length - 1, active + dir)));
  }

  return (
    <div className="relative">
      {/* Track */}
      <div
        ref={trackRef}
        className="services-carousel-track flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          paddingLeft: "max(1.5rem, calc((100% - 28rem) / 2))",
          paddingRight: "max(1.5rem, calc((100% - 28rem) / 2))",
        }}
      >
        {services.map((s, i) => {
          const isActive = i === active;
          return (
            <article
              key={s.title}
              data-card
              className={`group relative flex min-h-[24rem] w-[85vw] max-w-md flex-none snap-center flex-col justify-between overflow-hidden border bg-white p-8 transition-all duration-700 sm:w-[26rem] sm:p-10 dark:bg-anthracite-900 ${
                isActive
                  ? "border-champagne-400/80 shadow-[0_30px_80px_-40px_rgba(163,129,90,0.45)] -translate-y-1 scale-[1.01]"
                  : "border-stone-200 dark:border-stone-800"
              }`}
            >
              {/* Conic gold glow on active */}
              <div
                aria-hidden
                className={`pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl transition-opacity duration-700 ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  background:
                    "radial-gradient(circle, rgba(212,184,122,0.20) 0%, transparent 70%)",
                }}
              />

              {/* Top — bronze numeral + label rail */}
              <div className="relative">
                <div className="flex items-end justify-between">
                  <p
                    className="font-serif text-[5.5rem] font-light leading-none transition-colors duration-700"
                    style={{
                      color: isActive ? "#a3815a" : "#e8dfd2",
                    }}
                  >
                    {s.num}
                  </p>
                  <span className="font-sans text-[9px] font-semibold tracking-[0.4em] uppercase text-stone-400 dark:text-stone-500">
                    Savoir-faire
                  </span>
                </div>
                <span
                  className={`mt-4 block h-px origin-left transition-all duration-700 ${
                    isActive ? "w-24 bg-champagne-400" : "w-12 bg-brand-300"
                  }`}
                />
                <h3 className="mt-7 font-serif text-2xl font-semibold leading-tight text-anthracite-900 sm:text-3xl dark:text-stone-100">
                  {s.title}
                </h3>
                <p className="mt-5 font-sans text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                  {s.description}
                </p>
              </div>

              {/* Bottom corner accent */}
              <div className="mt-10 flex items-center justify-between">
                <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-stone-400 dark:text-stone-500">
                  Card {String(i + 1).padStart(2, "0")} / {String(services.length).padStart(2, "0")}
                </span>
                <span
                  className={`block h-1.5 w-1.5 rotate-45 transition-colors duration-700 ${
                    isActive ? "bg-champagne-400" : "bg-stone-300 dark:bg-stone-700"
                  }`}
                />
              </div>
            </article>
          );
        })}
      </div>

      {/* Arrows */}
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between sm:flex">
        <button
          type="button"
          onClick={() => nudge(-1)}
          disabled={!canPrev}
          aria-label="Précédent"
          className="pointer-events-auto ml-2 flex h-12 w-12 items-center justify-center rounded-full border border-stone-200 bg-white/95 text-anthracite-700 backdrop-blur transition-all duration-300 hover:scale-105 hover:border-champagne-400 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-30 dark:border-stone-700 dark:bg-anthracite-900/95 dark:text-stone-300 dark:hover:text-champagne-300"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M9.78 12.78a.75.75 0 01-1.06 0L4.47 8.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 8l3.72 3.72c.3.3.3.77 0 1.06z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => nudge(1)}
          disabled={!canNext}
          aria-label="Suivant"
          className="pointer-events-auto mr-2 flex h-12 w-12 items-center justify-center rounded-full border border-stone-200 bg-white/95 text-anthracite-700 backdrop-blur transition-all duration-300 hover:scale-105 hover:border-champagne-400 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-30 dark:border-stone-700 dark:bg-anthracite-900/95 dark:text-stone-300 dark:hover:text-champagne-300"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 11-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
          </svg>
        </button>
      </div>

      {/* Dots + swipe hint */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          {services.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Aller au savoir-faire ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === active
                  ? "w-10 bg-champagne-400"
                  : "w-3 bg-stone-300 hover:bg-stone-400 dark:bg-stone-700 dark:hover:bg-stone-500"
              }`}
            />
          ))}
        </div>
        <p className="font-sans text-[9px] tracking-[0.4em] uppercase text-stone-400 sm:hidden dark:text-stone-500">
          Glissez pour explorer →
        </p>
      </div>
    </div>
  );
}
