import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatSurface } from "@/lib/utils";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";

const services = [
  {
    title: "Location commerciale",
    description:
      "Trouvez le local idéal pour votre activité parmi notre sélection de biens en location à Paris et Île-de-France.",
    icon: "M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819",
  },
  {
    title: "Vente de murs",
    description:
      "Investissez dans des murs commerciaux de qualité. Nous vous accompagnons dans l'acquisition et la valorisation de vos actifs.",
    icon: "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21",
  },
  {
    title: "Fonds de commerce",
    description:
      "Cession et acquisition de fonds de commerce : restaurants, boutiques, commerces de proximité et enseignes.",
    icon: "M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z",
  },
  {
    title: "Conseil & expertise",
    description:
      "Bénéficiez de notre expertise du marché parisien pour évaluer, négocier et sécuriser vos projets immobiliers commerciaux.",
    icon: "M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18",
  },
];

const stats = [
  { value: "6+", label: "Années d'expérience" },
  { value: "120+", label: "Transactions réalisées" },
  { value: "20", label: "Arrondissements couverts" },
  { value: "98%", label: "Clients satisfaits" },
];

const commitments = [
  {
    title: "Expertise locale",
    description:
      "Une connaissance fine du marché parisien, quartier par quartier, pour identifier les meilleures opportunités.",
    icon: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z",
  },
  {
    title: "Accompagnement dédié",
    description:
      "Un interlocuteur unique qui suit votre projet de A à Z, de la recherche à la signature.",
    icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  },
  {
    title: "Réseau qualifié",
    description:
      "Un portefeuille d'offres exclusives et un réseau de décideurs pour concrétiser rapidement.",
    icon: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418",
  },
];

export default async function HomePage() {
  const featuredProperties = await prisma.property.findMany({
    where: { status: "ACTIF", isPublished: true, confidentiality: "PUBLIC" },
    include: { media: { where: { isPrimary: true }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <>
      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden">
        {/* Background gradient simulating warm Parisian atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3a2617] via-[#5b4837] to-[#886a4b]" />
        {/* Decorative pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4b87a' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20.5h18V22H22v18h-2V22H2v-1.5h18z'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        {/* Warm light gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

        <div className="container-page relative z-10 py-20 sm:py-28 md:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
              L&apos;Immobilier Commercial
              <br />
              de Qualité à Paris
              <br />
              <span className="text-champagne-300">&amp; Île-de-France</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-stone-300 sm:text-lg">
              Votre expert pour la Location, la Vente de Murs et Fonds de
              Commerce de Proximité
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/recherche-local"
                className="inline-flex items-center gap-2.5 rounded-xl bg-white px-8 py-4 text-sm font-semibold text-anthracite-900 shadow-lg transition-all hover:bg-stone-50 hover:shadow-xl hover:-translate-y-0.5"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                Rechercher un bien
              </Link>
              <Link
                href="/proposer-bien"
                className="inline-flex items-center gap-2.5 rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white/50"
              >
                Proposer un bien
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ STATS ══════════════════ */}
      <section className="relative z-10 -mt-8">
        <div className="container-page">
          <div className="mx-auto max-w-4xl rounded-2xl border border-stone-200/80 bg-white shadow-premium dark:border-stone-800 dark:bg-anthracite-900">
            <div className="grid grid-cols-2 divide-x divide-stone-200/60 sm:grid-cols-4 dark:divide-stone-800">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="px-4 py-6 text-center sm:py-8"
                >
                  <p className="text-2xl font-bold text-brand-600 sm:text-3xl dark:text-brand-400">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[11px] text-stone-500 sm:text-xs dark:text-stone-400">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURED PROPERTIES ══════════════════ */}
      {featuredProperties.length > 0 && (
        <section className="section-padding bg-white dark:bg-anthracite-950">
          <div className="container-page">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
                  Nos biens
                </p>
                <h2 className="heading-section mt-2">
                  Sélection à la une
                </h2>
              </div>
              <Link
                href="/biens"
                className="hidden items-center gap-1 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 sm:flex dark:text-brand-400 dark:hover:text-brand-300"
              >
                Voir tous les biens
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProperties.map((property) => (
                <Link
                  key={property.id}
                  href={`/biens/${property.id}`}
                  className="group"
                >
                  <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white transition-all hover:shadow-card-hover hover:-translate-y-1 dark:border-stone-800 dark:bg-anthracite-900">
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/40">
                      {property.media[0] ? (
                        <img
                          src={property.media[0].url}
                          alt={property.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <svg
                            className="h-10 w-10 text-brand-300 dark:text-brand-700"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21"
                            />
                          </svg>
                        </div>
                      )}
                      {/* Type badge */}
                      <div className="absolute top-3 left-3">
                        <span className="rounded-lg bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-anthracite-800 shadow-sm backdrop-blur-sm dark:bg-anthracite-900/90 dark:text-stone-200">
                          {PROPERTY_TYPE_LABELS[property.type] || property.type}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="truncate text-sm font-semibold text-anthracite-800 group-hover:text-brand-700 dark:text-stone-200 dark:group-hover:text-brand-400">
                        {property.title}
                      </h3>
                      {property.surfaceTotal && (
                        <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
                          Surface : {formatSurface(property.surfaceTotal)}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-bold text-anthracite-900 dark:text-stone-100">
                          {property.transactionType === "LOCATION"
                            ? formatPrice(property.rentMonthly)
                            : formatPrice(property.price)}
                          {property.transactionType === "LOCATION" && (
                            <span className="text-xs font-normal text-stone-400">
                              /mois
                            </span>
                          )}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-stone-400 dark:text-stone-500">
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                            />
                          </svg>
                          {property.district || property.city}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/biens"
                className="text-sm font-medium text-brand-600 dark:text-brand-400"
              >
                Voir tous les biens &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════ SERVICES ══════════════════ */}
      <section className="section-padding bg-brand-50/50 dark:bg-anthracite-900">
        <div className="container-page">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
              Nos services
            </p>
            <h2 className="heading-section mt-3">
              Un accompagnement complet
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-stone-500 dark:text-stone-400">
              De la recherche à la signature, nous vous guidons à chaque étape de
              votre projet immobilier commercial.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <div
                key={service.title}
                className="group rounded-2xl border border-stone-200/80 bg-white p-6 transition-all hover:border-brand-200 hover:shadow-card-hover hover:-translate-y-1 dark:border-stone-800 dark:bg-anthracite-950 dark:hover:border-brand-800"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-champagne-100 text-brand-700 transition-colors group-hover:from-brand-200 group-hover:to-champagne-200 dark:from-brand-900/30 dark:to-champagne-900/30 dark:text-brand-400">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={service.icon}
                    />
                  </svg>
                </div>
                <h3 className="font-serif text-lg font-semibold text-anthracite-900 dark:text-stone-100">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA BAND ══════════════════ */}
      <section className="relative overflow-hidden bg-anthracite-900 py-20 sm:py-24">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4b87a' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="container-page relative text-center">
          <h2 className="font-serif text-2xl font-bold text-white md:text-3xl lg:text-4xl">
            Un projet immobilier commercial ?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-stone-400">
            Décrivez votre recherche et notre équipe vous recontacte sous 24h
            avec des propositions adaptées.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/recherche-local"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-champagne-400 px-8 py-4 text-sm font-semibold text-anthracite-900 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              Rechercher un bien
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-xl border border-stone-600 px-8 py-4 text-sm font-semibold text-stone-200 transition-colors hover:bg-anthracite-800"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════ COMMITMENTS ══════════════════ */}
      <section className="section-padding bg-white dark:bg-anthracite-950">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
              Nos engagements
            </p>
            <h2 className="heading-section mt-3">
              Pourquoi choisir Retail Avenue ?
            </h2>
            <div className="mt-12 grid gap-10 sm:grid-cols-3">
              {commitments.map((item) => (
                <div key={item.title} className="text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-champagne-100 text-brand-700 dark:from-brand-900/30 dark:to-champagne-900/30 dark:text-brand-400">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={item.icon}
                      />
                    </svg>
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-anthracite-900 dark:text-stone-100">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ BOTTOM BANNER ══════════════════ */}
      <section className="border-t border-stone-200/80 bg-brand-50 py-12 dark:border-stone-800 dark:bg-anthracite-900">
        <div className="container-page">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <p className="text-lg font-semibold text-anthracite-900 dark:text-stone-100">
                Retail Avenue a su trouver l&apos;emplacement idéal pour votre
                commerce
              </p>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                Boulangeries, Boutiques de Quartier de Paris et Île-de-France
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-anthracite-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-anthracite-800 dark:bg-brand-600 dark:hover:bg-brand-500"
            >
              Contactez-nous
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
