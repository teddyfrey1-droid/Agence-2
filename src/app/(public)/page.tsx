import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const expertiseAreas = [
  {
    title: "Boutiques",
    description: "Emplacements premium en pied d'immeuble sur les artères les plus prisées de Paris.",
    icon: "M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z",
  },
  {
    title: "Bureaux",
    description: "Espaces de travail modernes et fonctionnels, du bureau indépendant au plateau entier.",
    icon: "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21",
  },
  {
    title: "Locaux commerciaux",
    description: "Surfaces commerciales adaptées à tous types d'activités et de projets.",
    icon: "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z",
  },
  {
    title: "Restaurants",
    description: "Fonds de commerce et locaux avec extraction, terrasse et aménagements dédiés.",
    icon: "M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265z",
  },
  {
    title: "Locaux d'activité",
    description: "Entrepôts, ateliers et locaux mixtes pour vos besoins logistiques et artisanaux.",
    icon: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12",
  },
  {
    title: "Immeubles",
    description: "Immeubles entiers à usage commercial ou mixte, opportunités d'investissement.",
    icon: "M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z",
  },
];

const stats = [
  { value: "15+", label: "Années d'expérience" },
  { value: "500+", label: "Transactions réalisées" },
  { value: "20", label: "Arrondissements couverts" },
  { value: "98%", label: "Clients satisfaits" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-champagne-50 dark:from-anthracite-950 dark:via-anthracite-900 dark:to-anthracite-950" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23886a4b' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

        <div className="container-page relative py-20 sm:py-28 md:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 flex justify-center">
              <Logo size="lg" showText={false} />
            </div>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-brand-600 dark:text-brand-400">
              Immobilier commercial &amp; professionnel
            </p>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-anthracite-900 sm:text-5xl md:text-6xl dark:text-stone-100">
              La Place,
              <br />
              <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">votre partenaire</span>
              <br />
              immobilier à Paris
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-anthracite-500 sm:text-lg dark:text-stone-400">
              Nous accompagnons entreprises, enseignes et investisseurs dans la
              recherche, la cession et la valorisation de locaux commerciaux et
              professionnels au cœur de Paris.
            </p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/recherche-local"
                className="inline-flex items-center gap-2 rounded-xl bg-anthracite-900 px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-anthracite-800 hover:shadow-xl hover:-translate-y-0.5 dark:bg-brand-600 dark:hover:bg-brand-500"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                Rechercher un local
              </Link>
              <Link
                href="/proposer-bien"
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white/80 px-7 py-3.5 text-sm font-semibold text-anthracite-800 backdrop-blur-sm transition-all hover:bg-white hover:shadow-md dark:border-stone-700 dark:bg-anthracite-800/80 dark:text-stone-200 dark:hover:bg-anthracite-800"
              >
                Proposer un bien
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-stone-200/80 bg-white dark:border-stone-800 dark:bg-anthracite-900">
        <div className="container-page">
          <div className="grid grid-cols-2 divide-x divide-stone-200/80 sm:grid-cols-4 dark:divide-stone-800">
            {stats.map((stat) => (
              <div key={stat.label} className="px-4 py-8 text-center sm:py-10">
                <p className="text-2xl font-bold text-brand-600 sm:text-3xl dark:text-brand-400">{stat.value}</p>
                <p className="mt-1 text-xs text-stone-500 sm:text-sm dark:text-stone-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expertise */}
      <section className="section-padding bg-white dark:bg-anthracite-950">
        <div className="container-page">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
              Notre expertise
            </p>
            <h2 className="heading-section mt-3">
              Tous types de locaux professionnels
            </h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {expertiseAreas.map((area) => (
              <div
                key={area.title}
                className="group rounded-xl border border-stone-200/80 bg-white p-6 transition-all hover:border-brand-200 hover:shadow-lg hover:-translate-y-0.5 dark:border-stone-800 dark:bg-anthracite-900 dark:hover:border-brand-800"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={area.icon} />
                  </svg>
                </div>
                <h3 className="font-serif text-lg font-semibold text-anthracite-900 dark:text-stone-100">
                  {area.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                  {area.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="relative overflow-hidden bg-anthracite-900 py-16 sm:py-20">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4b87a' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="container-page relative text-center">
          <h2 className="font-serif text-2xl font-bold text-white md:text-3xl lg:text-4xl">
            Un projet immobilier commercial ?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-stone-400">
            Décrivez votre recherche et notre équipe vous recontacte sous 24h.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/recherche-local"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-champagne-400 px-8 py-3.5 text-sm font-semibold text-anthracite-900 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              Rechercher un local
            </Link>
            <Link
              href="/proposer-bien"
              className="inline-flex items-center rounded-xl border border-stone-600 px-8 py-3.5 text-sm font-semibold text-stone-200 transition-colors hover:bg-anthracite-800"
            >
              Proposer un bien
            </Link>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="section-padding dark:bg-anthracite-950">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
              Nos engagements
            </p>
            <h2 className="heading-section mt-3">
              Pourquoi choisir La Place ?
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {[
                {
                  title: "Expertise locale",
                  description: "Une connaissance fine du marché parisien, quartier par quartier.",
                  icon: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z",
                },
                {
                  title: "Accompagnement dédié",
                  description: "Un interlocuteur unique qui suit votre projet de A à Z.",
                  icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
                },
                {
                  title: "Réseau qualifié",
                  description: "Un portefeuille d'offres exclusives et un réseau de décideurs.",
                  icon: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418",
                },
              ].map((item) => (
                <div key={item.title} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
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
    </>
  );
}
