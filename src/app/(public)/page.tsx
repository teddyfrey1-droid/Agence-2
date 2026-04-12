import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatSurface } from "@/lib/utils";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";

/* ─────────────────────────────────────────
   DATA — static copy arrays
───────────────────────────────────────── */

const services = [
  {
    num: "01",
    title: "Location Commerciale",
    description:
      "Des adresses sélectionnées avec soin, de la boutique de quartier au flagship parisien. Nous identifions le local qui fera l'histoire de votre activité.",
  },
  {
    num: "02",
    title: "Vente de Murs",
    description:
      "Acquérir des murs commerciaux, c'est inscrire son patrimoine dans la durée. Nous guidons chaque investissement avec rigueur et discernement.",
  },
  {
    num: "03",
    title: "Fonds de Commerce",
    description:
      "Restaurants, enseignes, commerces de proximité — nous orchestrons chaque cession et acquisition avec la précision qu'elle mérite.",
  },
  {
    num: "04",
    title: "Conseil & Expertise",
    description:
      "Notre lecture fine du marché parisien, quartier par quartier, vous donne l'avantage décisif pour négocier, valoriser et sécuriser.",
  },
];

const stats = [
  { value: "6+",   line1: "Années",       line2: "d'excellence"    },
  { value: "120+", line1: "Transactions", line2: "réalisées"       },
  { value: "20",   line1: "Arrondissements",line2: "couverts"      },
  { value: "98%",  line1: "Clients",      line2: "satisfaits"      },
];

const commitments = [
  {
    title: "Expertise Locale",
    description:
      "Une connaissance fine du marché parisien, quartier par quartier, pour identifier les meilleures opportunités avant qu'elles ne paraissent.",
  },
  {
    title: "Accompagnement Dédié",
    description:
      "Un interlocuteur unique, disponible et attentif, qui suit votre projet de A à Z — de la première visite à la signature définitive.",
  },
  {
    title: "Réseau Qualifié",
    description:
      "Un portefeuille d'offres exclusives et un réseau de décideurs pour concrétiser rapidement les projets les plus ambitieux.",
  },
];

/* ─────────────────────────────────────────
   PAGE
───────────────────────────────────────── */

export default async function HomePage() {
  const featuredProperties = await prisma.property.findMany({
    where: { status: "ACTIF", isPublished: true, confidentiality: "PUBLIC" },
    include: { media: { where: { isPrimary: true }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 7,
  });

  const [hero, ...rest] = featuredProperties;
  const secondary = rest.slice(0, 2);
  const tertiary  = rest.slice(2, 6);

  return (
    <>
      {/* ══════════════════════════════════════════════
          § 1 — HERO
          Full-viewport entrance. Photograph + poetic
          headline + single refined CTA.
      ══════════════════════════════════════════════ */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">

        {/* Background photograph */}
        <Image
          src="/hero-paris.jpg"
          alt="Rue commerçante parisienne"
          fill
          className="object-cover object-center"
          priority
          quality={90}
        />

        {/* Gradient veil — top-to-bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/65" />
        {/* Subtle side vignette for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.35)_100%)]" />

        {/* ── Central content ── */}
        <div className="relative z-10 w-full max-w-4xl px-6 text-center">

          {/* Eyebrow — location marker */}
          <p className="animate-reveal-fade font-sans text-[10px] tracking-[0.55em] uppercase text-champagne-300">
            Paris &amp; Île-de-France &nbsp;·&nbsp; Depuis 2018
          </p>

          {/* Main headline */}
          <h1 className="animate-reveal-up delay-150 mt-7 font-serif text-5xl font-normal italic leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
            L&apos;immobilier
            <br />
            <em className="not-italic font-semibold">d&apos;exception</em>
          </h1>

          {/* Decorative rule */}
          <div className="animate-reveal-fade delay-500 mx-auto mt-9 h-px w-14 bg-champagne-400" />

          {/* Sub-line */}
          <p className="animate-reveal-up delay-500 mx-auto mt-8 max-w-sm font-sans text-sm leading-loose tracking-wide text-stone-300">
            Des adresses confidentielles, sélectionnées avec discernement<br className="hidden sm:block" />
            pour une clientèle qui n&apos;accepte pas le compromis.
          </p>

          {/* CTAs */}
          <div className="animate-reveal-up delay-700 mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/biens"
              className="inline-flex items-center gap-3 border border-white/50 px-10 py-4 font-sans text-[11px] tracking-[0.3em] uppercase text-white transition-all duration-500 hover:border-white hover:bg-white/10"
            >
              Découvrir la sélection
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 font-sans text-[11px] tracking-[0.25em] uppercase text-champagne-300 transition-colors duration-300 hover:text-champagne-200"
            >
              Prendre contact
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
              </svg>
            </Link>
          </div>
        </div>

        {/* ── Scroll indicator ── */}
        <div className="animate-scroll-breath absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          <span className="font-sans text-[9px] tracking-[0.4em] uppercase text-white/50">Défiler</span>
          <div className="h-12 w-px bg-gradient-to-b from-white/50 to-transparent" />
        </div>
      </section>


      {/* ══════════════════════════════════════════════
          § 2 — MANIFESTE
          Editorial pull-quote, key figures, trois
          engagements fondamentaux.
      ══════════════════════════════════════════════ */}
      <section className="bg-white py-32 sm:py-40">
        <div className="mx-auto max-w-6xl px-6">

          {/* Pull-quote block */}
          <div className="text-center">
            {/* Breathing vertical line */}
            <div className="line-vertical mx-auto mb-16 h-20" />

            <p className="font-serif text-4xl font-normal italic leading-tight text-anthracite-900 sm:text-5xl lg:text-6xl dark:text-stone-100">
              Nous ne cherchons pas<br />
              l&apos;emplacement idéal.
            </p>
            <p className="mt-4 font-serif text-4xl font-semibold leading-tight text-anthracite-900 sm:text-5xl lg:text-6xl dark:text-stone-100">
              Nous le révélons.
            </p>

            <div className="rule-gold mx-auto mt-10" />

            <p className="mx-auto mt-10 max-w-xl font-sans text-sm leading-loose text-stone-500 dark:text-stone-400">
              Depuis 2018, notre agence accompagne une clientèle d&apos;exception dans
              ses projets immobiliers commerciaux à Paris et Île-de-France.
              Chaque mandat reçoit une attention singulière, chaque client
              mérite une réponse sur-mesure.
            </p>
          </div>

          {/* Stats row */}
          <div className="mt-28 grid grid-cols-2 border-t border-stone-200 md:grid-cols-4 dark:border-stone-800">
            {stats.map((stat, i) => (
              <div
                key={stat.line1}
                className={`px-4 py-12 text-center ${
                  i > 0 ? "border-l border-stone-200 dark:border-stone-800" : ""
                }`}
              >
                <p className="font-serif text-5xl font-normal text-anthracite-900 lg:text-6xl dark:text-stone-100">
                  {stat.value}
                </p>
                <p className="mt-4 font-sans text-[10px] tracking-[0.3em] uppercase text-stone-400 dark:text-stone-500">
                  {stat.line1}
                  <br />
                  {stat.line2}
                </p>
              </div>
            ))}
          </div>

          {/* Commitments */}
          <div className="mt-24 grid grid-cols-1 gap-14 border-t border-stone-200 pt-20 md:grid-cols-3 dark:border-stone-800">
            {commitments.map((item) => (
              <div key={item.title}>
                <h3 className="font-serif text-xl font-semibold text-anthracite-900 dark:text-stone-100">
                  {item.title}
                </h3>
                <span className="rule-brand mt-5" />
                <p className="mt-5 font-sans text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ══════════════════════════════════════════════
          § 3 — SÉLECTION EXCLUSIVE
          Editorial property grid. Asymmetric layout:
          one hero card + two secondary + four smaller.
      ══════════════════════════════════════════════ */}
      {featuredProperties.length > 0 && (
        <section className="bg-brand-50 py-24 sm:py-32 dark:bg-anthracite-950">
          <div className="mx-auto max-w-7xl px-6">

            {/* Section header */}
            <div className="mb-16 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-4">
                  <span className="rule-brand" />
                  <p className="label-overline">Sélection Exclusive</p>
                </div>
                <h2 className="mt-5 font-serif text-4xl font-normal text-anthracite-900 sm:text-5xl dark:text-stone-100">
                  Biens d&apos;exception
                </h2>
              </div>
              <Link
                href="/biens"
                className="hidden items-center gap-2 font-sans text-[10px] tracking-[0.25em] uppercase text-brand-600 transition-colors hover:text-brand-800 sm:inline-flex dark:text-brand-400 dark:hover:text-brand-200"
              >
                Voir tout
                <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
                </svg>
              </Link>
            </div>

            {/* ── Hero card — spans full width ── */}
            {hero && (
              <Link href={`/biens/${hero.id}`} className="group mb-5 block">
                <div className="relative overflow-hidden bg-stone-200 dark:bg-anthracite-900" style={{ aspectRatio: "21/9" }}>
                  {hero.media[0] ? (
                    <img
                      src={hero.media[0].url}
                      alt={hero.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300 dark:from-anthracite-800 dark:to-anthracite-700">
                      <svg className="h-16 w-16 text-stone-300 dark:text-anthracite-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21" />
                      </svg>
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  {/* Info overlay */}
                  <div className="absolute bottom-0 left-0 p-8 sm:p-14">
                    <span className="font-sans text-[9px] tracking-[0.4em] uppercase text-champagne-300">
                      {PROPERTY_TYPE_LABELS[hero.type] ?? hero.type}
                    </span>
                    <h3 className="mt-3 font-serif text-2xl font-semibold text-white transition-colors duration-500 group-hover:text-champagne-200 sm:text-3xl md:text-4xl">
                      {hero.title}
                    </h3>
                    <div className="mt-4 flex flex-wrap items-center gap-5 font-sans text-xs text-stone-300">
                      {hero.surfaceTotal && (
                        <span>{formatSurface(hero.surfaceTotal)}</span>
                      )}
                      {(hero.district ?? hero.city) && (
                        <span>{hero.district ?? hero.city}</span>
                      )}
                      <span className="font-semibold text-white">
                        {hero.transactionType === "LOCATION"
                          ? `${formatPrice(hero.rentMonthly)} / mois`
                          : formatPrice(hero.price)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* ── Secondary row — two equal cards ── */}
            {secondary.length > 0 && (
              <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {secondary.map((property) => (
                  <Link key={property.id} href={`/biens/${property.id}`} className="group">
                    <div className="relative overflow-hidden bg-stone-200 dark:bg-anthracite-900" style={{ aspectRatio: "3/2" }}>
                      {property.media[0] ? (
                        <img
                          src={property.media[0].url}
                          alt={property.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-stone-200 to-stone-300 dark:from-anthracite-800 dark:to-anthracite-700" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 p-6">
                        <span className="font-sans text-[9px] tracking-[0.35em] uppercase text-champagne-300">
                          {PROPERTY_TYPE_LABELS[property.type] ?? property.type}
                        </span>
                        <h3 className="mt-2 font-serif text-xl font-semibold text-white transition-colors duration-500 group-hover:text-champagne-200">
                          {property.title}
                        </h3>
                        <p className="mt-1.5 font-sans text-xs text-stone-300">
                          {property.transactionType === "LOCATION"
                            ? `${formatPrice(property.rentMonthly)} / mois`
                            : formatPrice(property.price)}
                          {(property.district ?? property.city) && (
                            <> &nbsp;·&nbsp; {property.district ?? property.city}</>
                          )}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* ── Tertiary grid — smaller cards with caption below image ── */}
            {tertiary.length > 0 && (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                {tertiary.map((property) => (
                  <Link key={property.id} href={`/biens/${property.id}`} className="group">
                    <div className="overflow-hidden bg-stone-200 dark:bg-anthracite-900" style={{ aspectRatio: "4/3" }}>
                      {property.media[0] ? (
                        <img
                          src={property.media[0].url}
                          alt={property.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-stone-200 to-stone-300 dark:from-anthracite-800 dark:to-anthracite-700" />
                      )}
                    </div>
                    <div className="mt-3 px-0.5">
                      {/* Type badge */}
                      <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-brand-500 dark:text-brand-400">
                        {PROPERTY_TYPE_LABELS[property.type] ?? property.type}
                      </p>
                      <h3 className="mt-1.5 truncate font-serif text-base font-semibold text-anthracite-900 transition-colors group-hover:text-brand-700 dark:text-stone-100 dark:group-hover:text-brand-400">
                        {property.title}
                      </h3>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="font-sans text-xs font-semibold text-anthracite-800 dark:text-stone-200">
                          {property.transactionType === "LOCATION"
                            ? `${formatPrice(property.rentMonthly)}/mois`
                            : formatPrice(property.price)}
                        </span>
                        {property.surfaceTotal && (
                          <span className="font-sans text-[10px] text-stone-400 dark:text-stone-500">
                            {formatSurface(property.surfaceTotal)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Mobile — see all */}
            <div className="mt-10 text-center sm:hidden">
              <Link
                href="/biens"
                className="font-sans text-[10px] tracking-[0.3em] uppercase text-brand-600 dark:text-brand-400"
              >
                Voir toute la sélection →
              </Link>
            </div>

          </div>
        </section>
      )}


      {/* ══════════════════════════════════════════════
          § 4 — SAVOIR-FAIRE
          Four disciplines, numbered in bronze.
          No icons — pure typography & hierarchy.
      ══════════════════════════════════════════════ */}
      <section className="bg-white py-24 sm:py-32 dark:bg-anthracite-950">
        <div className="mx-auto max-w-7xl px-6">

          {/* Section header */}
          <div className="mb-20">
            <div className="flex items-center gap-4">
              <span className="rule-brand" />
              <p className="label-overline">Nos Savoir-Faire</p>
            </div>
            <h2 className="mt-5 max-w-xl font-serif text-4xl font-normal text-anthracite-900 sm:text-5xl dark:text-stone-100">
              Un accompagnement<br />
              de haute précision
            </h2>
          </div>

          {/* Four disciplines */}
          <div className="grid grid-cols-1 border-t border-stone-200 sm:grid-cols-2 lg:grid-cols-4 dark:border-stone-800">
            {services.map((service, i) => (
              <div
                key={service.title}
                className={`py-12 pr-6 ${
                  i > 0
                    ? "sm:pl-8 sm:border-l border-stone-200 dark:border-stone-800"
                    : ""
                }`}
              >
                {/* Bronze ordinal */}
                <p className="font-serif text-6xl font-normal leading-none text-stone-150 dark:text-anthracite-800"
                   style={{ color: "#e8dfd2" }}>
                  {service.num}
                </p>
                <h3 className="mt-7 font-serif text-xl font-semibold text-anthracite-900 dark:text-stone-100">
                  {service.title}
                </h3>
                <span className="rule-brand mt-5" />
                <p className="mt-5 font-sans text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                  {service.description}
                </p>
              </div>
            ))}
          </div>

          {/* Link to services page */}
          <div className="mt-16 border-t border-stone-200 pt-10 dark:border-stone-800">
            <Link
              href="/agence"
              className="inline-flex items-center gap-3 font-sans text-[10px] tracking-[0.3em] uppercase text-anthracite-700 transition-colors hover:text-brand-600 dark:text-stone-400 dark:hover:text-brand-400"
            >
              En savoir plus sur nos services
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
              </svg>
            </Link>
          </div>

        </div>
      </section>


      {/* ══════════════════════════════════════════════
          § 5 — PRISE DE CONTACT
          Dark section. Dramatic typography.
          A conversation — not a form.
      ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-anthracite-950 py-40 sm:py-48">

        {/* Subtle dot grid texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #d4b87a 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Warm glow, off-center */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(163,129,90,0.12) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">

          <p className="font-sans text-[10px] tracking-[0.55em] uppercase text-champagne-400">
            Contact Privé
          </p>

          {/* Headline */}
          <h2 className="mt-10 font-serif text-5xl font-normal italic leading-tight text-white sm:text-6xl lg:text-7xl">
            Une conversation
            <br />
            <em className="not-italic font-semibold text-champagne-300">
              discrète et sur-mesure
            </em>
          </h2>

          <div className="rule-gold mx-auto mt-10" />

          <p className="mx-auto mt-10 max-w-lg font-sans text-sm leading-loose text-stone-400">
            Chaque projet mérite une attention singulière. Notre équipe vous répond
            avec la discrétion et l&apos;excellence qui vous sont dues — sous 24 heures.
          </p>

          {/* CTAs */}
          <div className="mt-14 flex flex-col items-center justify-center gap-5 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center bg-champagne-500 px-12 py-4 font-sans text-[11px] tracking-[0.3em] uppercase text-anthracite-900 transition-colors duration-300 hover:bg-champagne-400"
            >
              Prendre Contact
            </Link>
            <Link
              href="/biens"
              className="inline-flex items-center gap-2 font-sans text-[11px] tracking-[0.25em] uppercase text-stone-400 transition-colors duration-300 hover:text-white"
            >
              Parcourir la sélection
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
              </svg>
            </Link>
          </div>

          {/* Divider + contact info */}
          <div className="mt-20 border-t border-white/10 pt-12 text-stone-500">
            <p className="font-sans text-[10px] tracking-[0.3em] uppercase">
              Ou contactez-nous directement
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-10">
              <Link
                href="tel:+33100000000"
                className="font-sans text-sm text-stone-400 transition-colors hover:text-white"
              >
                +33 (0)1 00 00 00 00
              </Link>
              <span className="hidden h-px w-4 bg-stone-700 sm:block" />
              <Link
                href="mailto:contact@retailavenue.fr"
                className="font-sans text-sm text-stone-400 transition-colors hover:text-white"
              >
                contact@retailavenue.fr
              </Link>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
