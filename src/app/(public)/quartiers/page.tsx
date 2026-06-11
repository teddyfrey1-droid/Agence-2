import type { Metadata } from "next";
import Link from "next/link";
import { QUARTIERS } from "@/lib/quartiers";
import { ScrollReveal } from "@/components/scroll-reveal";

export const metadata: Metadata = {
  title: "Nos quartiers — Immobilier commercial à Paris",
  description:
    "Le Marais, Grands Boulevards, Saint-Germain, Champs-Élysées… Retail Avenue connaît chaque quartier commerçant de Paris, rue par rue. Découvrez nos analyses.",
  alternates: { canonical: "/quartiers" },
};

export default function QuartiersPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden bg-gradient-premium py-20 sm:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(176,146,106,0.12),transparent_55%)]" />
        <div className="container-page text-center">
          <p className="label-overline dark:text-champagne-400">Expertise terrain</p>
          <h1 className="mt-5 font-serif text-4xl font-normal italic tracking-tight text-anthracite-900 sm:text-5xl md:text-6xl dark:text-stone-100">
            Paris, quartier
            <span className="block not-italic font-semibold">par quartier</span>
          </h1>
          <div className="mx-auto mt-7 h-px w-12 bg-champagne-400" />
          <p className="mx-auto mt-7 max-w-xl font-sans text-base leading-relaxed text-anthracite-500 dark:text-stone-300">
            Chaque rue a son flux, chaque flux a sa valeur. Découvrez notre
            lecture des grands quartiers commerçants parisiens.
          </p>
        </div>
      </section>

      {/* ── Grid ── */}
      <section className="bg-white py-16 sm:py-20 dark:bg-anthracite-950">
        <div className="container-page">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {QUARTIERS.map((quartier, i) => (
              <ScrollReveal key={quartier.slug} variant="up" delay={(i % 3) * 100}>
                <Link
                  href={`/quartiers/${quartier.slug}`}
                  className="group flex h-full flex-col border border-stone-200 bg-white p-8 transition-all duration-500 hover:-translate-y-1 hover:border-champagne-400/70 hover:shadow-[0_28px_70px_-40px_rgba(163,129,90,0.45)] dark:border-stone-800 dark:bg-anthracite-900"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-xs italic text-stone-400 dark:text-stone-500">
                      {quartier.arrondissements
                        .map((a) => a.replace("er arrondissement", "ᵉʳ").replace("e arrondissement", "ᵉ"))
                        .join(" · ")}
                    </span>
                    <span className="block h-1.5 w-1.5 rotate-45 bg-stone-300 transition-colors duration-500 group-hover:bg-champagne-400 dark:bg-stone-700" />
                  </div>
                  <h2 className="mt-5 font-serif text-2xl font-semibold leading-tight text-anthracite-900 transition-colors duration-500 group-hover:text-brand-700 dark:text-stone-100 dark:group-hover:text-champagne-300">
                    {quartier.name}
                  </h2>
                  <span className="mt-4 block h-px w-10 origin-left bg-champagne-400 transition-all duration-500 group-hover:w-20" />
                  <p className="mt-4 flex-1 font-sans text-sm italic leading-relaxed text-stone-500 dark:text-stone-400">
                    {quartier.tagline}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 font-sans text-[10px] tracking-[0.25em] uppercase text-brand-600 transition-colors group-hover:text-brand-800 dark:text-champagne-400">
                    Découvrir
                    <svg className="h-3 w-3 transition-transform duration-500 group-hover:translate-x-1" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
                    </svg>
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
