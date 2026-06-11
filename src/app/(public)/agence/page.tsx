import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";
import { QUARTIERS } from "@/lib/quartiers";
import { ScrollReveal } from "@/components/scroll-reveal";
import { AnimatedCounter } from "@/components/animated-counter";
import { MANIFESTE_CONTENT } from "@/lib/homepage-content";

export const metadata: Metadata = {
  title: "L'agence",
  description:
    "Retail Avenue, maison d'immobilier commercial à Paris : commercialisation, recherche sur-mesure, conseil et accompagnement de bout en bout.",
  alternates: { canonical: "/agence" },
};

const VALUES = [
  {
    title: "Excellence",
    description:
      "Chaque mission est menée avec rigueur et exigence, de la première visite à la signature.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M24 6l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2 5-10z" />
      </svg>
    ),
  },
  {
    title: "Transparence",
    description:
      "Une information claire et honnête à chaque étape : prix, délais, points de vigilance.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 24s7-12 18-12 18 12 18 12-7 12-18 12S6 24 6 24z" />
        <circle cx="24" cy="24" r="5" />
      </svg>
    ),
  },
  {
    title: "Proximité",
    description:
      "Un interlocuteur unique, disponible et impliqué, qui connaît votre dossier par cœur.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 30l-6-6 8-8 8 6 8-6 8 8-6 6" />
        <path d="M14 30l10 10 10-10M24 22v8" />
      </svg>
    ),
  },
];

const METIERS = [
  {
    title: "Commercialisation",
    description:
      "Mise en valeur et diffusion ciblée de votre local auprès d'un réseau de candidats qualifiés — en vitrine ou en off-market.",
  },
  {
    title: "Recherche sur-mesure",
    description:
      "Mandat de recherche dédié : nous identifions l'adresse qui correspond à votre concept, votre flux et votre budget.",
  },
  {
    title: "Conseil & valorisation",
    description:
      "Avis de valeur, stratégie locative, arbitrage cession / location : un regard d'expert sur chaque décision.",
  },
  {
    title: "Accompagnement intégré",
    description:
      "Négociation, coordination juridique et suivi administratif jusqu'à la remise des clés — sans rupture de charge.",
  },
];


export default function AgencePage() {
  return (
    <>
      {/* ══════════════════════════════════════════════
          § 1 — HERO — sombre, photographique
      ══════════════════════════════════════════════ */}
      <section className="relative flex min-h-[62vh] flex-col items-center justify-center overflow-hidden py-28">
        <div className="absolute inset-0">
          <Image
            src="/hero-paris.jpg"
            alt="Rue commerçante parisienne"
            fill
            className="object-cover object-center"
            priority
            quality={85}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <p
            className="animate-reveal-fade font-sans text-[10px] font-semibold tracking-[0.5em] uppercase text-champagne-300"
            style={{ textShadow: "0 1px 12px rgba(0,0,0,0.9)" }}
          >
            L&apos;agence
          </p>
          <h1
            className="animate-reveal-up delay-150 mt-6 font-serif text-4xl font-normal italic leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl"
            style={{ textShadow: "0 2px 28px rgba(0,0,0,0.7)" }}
          >
            Une maison dédiée à
            <br />
            <em className="not-italic font-semibold">l&apos;immobilier commercial.</em>
          </h1>
          <div className="animate-reveal-fade delay-500 mx-auto mt-8 h-px w-14 bg-champagne-400" />
          <p
            className="animate-reveal-up delay-500 mx-auto mt-8 max-w-xl font-sans text-base leading-loose text-stone-100"
            style={{ textShadow: "0 1px 16px rgba(0,0,0,0.9)" }}
          >
            {APP_NAME} accompagne enseignes, investisseurs et propriétaires dans
            leurs projets de locaux commerciaux et professionnels, à Paris et en
            Île-de-France.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          § 2 — MANIFESTE & CHIFFRES
      ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white py-24 sm:py-32 dark:bg-anthracite-950">
        <div
          aria-hidden
          className="animate-drift-a pointer-events-none absolute -left-32 top-16 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(212,184,122,0.10) 0%, transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-6">
          <ScrollReveal variant="fade" className="mx-auto max-w-3xl text-center">
            <div className="line-vertical mx-auto mb-14 h-16" />
            <p className="font-serif text-3xl font-normal italic leading-tight text-anthracite-900 sm:text-4xl lg:text-5xl dark:text-stone-100">
              Nous ne vendons pas des murs,
            </p>
            <p className="mt-3 font-serif text-3xl font-semibold leading-tight text-anthracite-900 sm:text-4xl lg:text-5xl dark:text-stone-100">
              nous révélons des emplacements.
            </p>
            <div className="rule-gold mx-auto mt-9" />
            <p className="mx-auto mt-9 max-w-2xl font-sans text-base leading-loose text-stone-600 dark:text-stone-300">
              Derrière chaque adresse, il y a un flux, une histoire de quartier,
              un potentiel commercial. Notre métier&nbsp;: le mesurer, le révéler
              et le faire correspondre au bon projet.
            </p>
          </ScrollReveal>

          <div className="mt-24 grid grid-cols-2 border-t border-stone-200 md:grid-cols-4 dark:border-stone-800">
            {MANIFESTE_CONTENT.stats.map((stat, i) => {
              const match = /^(\D*)(\d+)(\D*)$/.exec(stat.value);
              const prefix = match?.[1] ?? "";
              const num = match ? parseInt(match[2], 10) : 0;
              const suffix = match?.[3] ?? "";
              return (
                <ScrollReveal
                  key={stat.line1}
                  variant="up"
                  delay={i * 120}
                  className={`px-4 py-12 text-center ${
                    i > 0 ? "border-l border-stone-200 dark:border-stone-800" : ""
                  }`}
                >
                  <p className="font-serif text-5xl font-normal text-anthracite-900 lg:text-6xl dark:text-stone-100">
                    {match ? (
                      <AnimatedCounter value={num} prefix={prefix} suffix={suffix} />
                    ) : (
                      stat.value
                    )}
                  </p>
                  <p className="mt-4 font-sans text-[10px] tracking-[0.3em] uppercase text-stone-500 dark:text-stone-400">
                    {stat.line1}
                    <br />
                    {stat.line2}
                  </p>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          § 3 — VALEURS
      ══════════════════════════════════════════════ */}
      <section className="bg-brand-50 py-24 sm:py-32 dark:bg-anthracite-900">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollReveal variant="up" className="mb-16 block">
            <div className="flex items-center gap-4">
              <span className="rule-brand" />
              <p className="label-overline dark:text-champagne-400">Nos valeurs</p>
            </div>
            <h2 className="mt-5 max-w-xl font-serif text-4xl font-normal text-anthracite-900 sm:text-5xl dark:text-stone-100">
              Ce qui guide
              <br />
              chacune de nos missions.
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {VALUES.map((value, i) => (
              <ScrollReveal
                key={value.title}
                variant="up"
                delay={i * 140}
                className="group relative flex flex-col overflow-hidden border border-stone-200 bg-white p-8 transition-all duration-500 hover:-translate-y-1 hover:border-champagne-400/70 hover:shadow-[0_28px_70px_-40px_rgba(163,129,90,0.45)] sm:p-10 dark:border-stone-800 dark:bg-anthracite-950"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-champagne-400/10 blur-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                />
                <div className="flex items-center justify-between">
                  <span className="font-serif text-xs italic text-stone-400 dark:text-stone-500">
                    {String(i + 1).padStart(2, "0")} — Valeur
                  </span>
                  <span className="block h-1.5 w-1.5 rotate-45 bg-stone-300 transition-colors duration-500 group-hover:bg-champagne-400 dark:bg-stone-700" />
                </div>
                <div className="relative mt-7">
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-champagne-400/0 blur-xl transition-all duration-700 group-hover:bg-champagne-400/15"
                  />
                  <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-champagne-300/70 bg-gradient-to-br from-white to-stone-50 text-brand-700 transition-all duration-500 group-hover:scale-105 group-hover:border-champagne-400 group-hover:text-champagne-600 dark:border-champagne-400/40 dark:from-anthracite-950 dark:to-anthracite-900 dark:text-champagne-400">
                    <span className="h-8 w-8">{value.icon}</span>
                  </span>
                </div>
                <h3 className="mt-7 font-serif text-2xl font-semibold leading-tight text-anthracite-900 transition-colors duration-500 group-hover:text-brand-700 dark:text-stone-100 dark:group-hover:text-champagne-300">
                  {value.title}
                </h3>
                <span className="mt-4 block h-px w-10 origin-left bg-champagne-400 transition-all duration-500 group-hover:w-20" />
                <p className="mt-5 font-sans text-sm leading-loose text-stone-600 dark:text-stone-300">
                  {value.description}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          § 4 — EXPERTISE TERRAIN
      ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white py-24 sm:py-32 dark:bg-anthracite-950">
        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-2 lg:items-center lg:gap-20">
          {/* Visuel */}
          <ScrollReveal variant="left" className="relative order-2 lg:order-1">
            <div className="relative aspect-[4/5] w-full overflow-hidden border border-stone-200 dark:border-stone-800">
              <Image
                src="/hero-paris.jpg"
                alt="Quartier commerçant parisien"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 45vw, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-10">
                <p className="font-sans text-[9px] tracking-[0.45em] uppercase text-champagne-300">
                  Expertise terrain
                </p>
                <p className="mt-3 font-serif text-2xl italic leading-snug text-white">
                  « Chaque rue a son flux,
                  <br />
                  chaque flux a sa valeur. »
                </p>
              </div>
            </div>
            <div className="animate-float absolute -bottom-4 -right-4 hidden h-24 w-24 border-b border-r border-champagne-400 sm:block" />
            <div className="animate-float absolute -left-4 -top-4 hidden h-24 w-24 border-l border-t border-champagne-400 sm:block" style={{ animationDelay: "1.5s" }} />
          </ScrollReveal>

          {/* Copy */}
          <ScrollReveal variant="right" delay={120} className="order-1 lg:order-2">
            <div className="flex items-center gap-4">
              <span className="rule-brand" />
              <p className="label-overline dark:text-champagne-400">Notre expertise</p>
            </div>
            <h2 className="mt-5 font-serif text-4xl font-normal leading-tight text-anthracite-900 sm:text-5xl dark:text-stone-100">
              Paris, quartier
              <br />
              <em className="font-semibold not-italic text-brand-700 dark:text-champagne-300">
                par quartier.
              </em>
            </h2>
            <p className="mt-8 max-w-xl font-sans text-base leading-loose text-stone-600 dark:text-stone-300">
              Implantés au cœur de Paris, nous arpentons chaque arrondissement et
              en connaissons les spécificités&nbsp;: linéaires commerçants, flux
              piétons, niveaux de loyers, dynamiques de quartier. Cette lecture
              fine du terrain nous permet d&apos;identifier les meilleures
              opportunités — souvent avant qu&apos;elles ne deviennent publiques.
            </p>
            <p className="mt-5 max-w-xl font-sans text-base leading-loose text-stone-600 dark:text-stone-300">
              Boutique sur les Grands Boulevards, bureau dans le Marais,
              restaurant à Saint-Germain ou local d&apos;activité en
              périphérie&nbsp;: notre réseau couvre tous les usages.
            </p>

            <div className="mt-10 flex flex-wrap gap-2.5">
              {QUARTIERS.map((quartier) => (
                <Link
                  key={quartier.slug}
                  href={`/quartiers/${quartier.slug}`}
                  className="inline-flex items-center gap-2 border border-stone-200 bg-white px-4 py-2 font-sans text-xs text-stone-600 transition-colors duration-300 hover:border-champagne-400/70 hover:text-anthracite-900 dark:border-stone-800 dark:bg-anthracite-950 dark:text-stone-400 dark:hover:border-champagne-400/50 dark:hover:text-stone-200"
                >
                  <span aria-hidden className="block h-1 w-1 rotate-45 bg-champagne-400" />
                  {quartier.name}
                </Link>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          § 5 — NOS MÉTIERS
      ══════════════════════════════════════════════ */}
      <section className="bg-stone-50 py-24 sm:py-32 dark:bg-anthracite-900">
        <div className="mx-auto max-w-7xl px-6">
          <ScrollReveal variant="up" className="mb-16 block text-center">
            <span className="inline-flex items-center gap-3 font-sans text-[10px] font-semibold tracking-[0.5em] uppercase text-brand-600 dark:text-champagne-400">
              <span className="h-px w-8 bg-champagne-400/70" />
              Nos métiers
              <span className="h-px w-8 bg-champagne-400/70" />
            </span>
            <h2 className="mt-6 font-serif text-4xl font-normal text-anthracite-900 sm:text-5xl dark:text-stone-100">
              Un accompagnement,
              <br />
              <em className="font-semibold not-italic">quatre savoir-faire.</em>
            </h2>
          </ScrollReveal>

          <div className="grid gap-px overflow-hidden border border-stone-200 bg-stone-200 sm:grid-cols-2 dark:border-stone-800 dark:bg-stone-800">
            {METIERS.map((metier, i) => (
              <ScrollReveal
                key={metier.title}
                variant="fade"
                delay={i * 110}
                className="group bg-white p-9 transition-colors duration-500 hover:bg-champagne-50/60 sm:p-12 dark:bg-anthracite-950 dark:hover:bg-anthracite-900"
              >
                <p className="font-serif text-3xl italic text-stone-300 transition-colors duration-500 group-hover:text-champagne-500 dark:text-stone-700 dark:group-hover:text-champagne-400">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-5 font-serif text-2xl font-semibold text-anthracite-900 dark:text-stone-100">
                  {metier.title}
                </h3>
                <span className="mt-4 block h-px w-10 origin-left bg-champagne-400 transition-all duration-500 group-hover:w-20" />
                <p className="mt-5 font-sans text-sm leading-loose text-stone-600 dark:text-stone-300">
                  {metier.description}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          § 6 — CTA FINAL
      ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-anthracite-950 py-28 sm:py-36">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #d4b87a 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(163,129,90,0.18) 0%, transparent 70%)" }}
        />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <ScrollReveal variant="fade" className="block">
            <span className="inline-flex items-center gap-3 font-sans text-[10px] font-semibold tracking-[0.55em] uppercase text-champagne-400">
              <span className="h-px w-8 bg-champagne-400/70" />
              Et maintenant
              <span className="h-px w-8 bg-champagne-400/70" />
            </span>
          </ScrollReveal>
          <ScrollReveal variant="up" delay={120}>
            <h2 className="mt-8 font-serif text-4xl font-light italic leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Parlons de
              <br />
              <em className="not-italic font-semibold text-champagne-300">votre projet.</em>
            </h2>
          </ScrollReveal>
          <ScrollReveal variant="up" delay={240} className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row">
            <Link
              href="/contact"
              className="group relative inline-flex items-center gap-3 overflow-hidden bg-champagne-500 px-10 py-4 font-sans text-[11px] tracking-[0.3em] uppercase text-anthracite-950 transition-colors duration-500 hover:bg-champagne-400"
            >
              <span
                aria-hidden
                className="animate-gleam pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              />
              <span className="relative">Nous contacter</span>
              <svg className="relative h-3 w-3 transition-transform duration-500 group-hover:translate-x-1" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
              </svg>
            </Link>
            <Link
              href="/recherche-local"
              className="inline-flex items-center gap-2 font-sans text-[11px] tracking-[0.25em] uppercase text-champagne-200 transition-colors duration-300 hover:text-white"
            >
              Lancer une recherche
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
              </svg>
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
