import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

const expertiseAreas = [
  {
    title: "Boutiques",
    description:
      "Emplacements premium en pied d'immeuble sur les artères les plus prisées de Paris.",
  },
  {
    title: "Bureaux",
    description:
      "Espaces de travail modernes et fonctionnels, du bureau indépendant au plateau entier.",
  },
  {
    title: "Locaux commerciaux",
    description:
      "Surfaces commerciales adaptées à tous types d'activités et de projets.",
  },
  {
    title: "Restaurants",
    description:
      "Fonds de commerce et locaux avec extraction, terrasse et aménagements dédiés.",
  },
  {
    title: "Locaux d'activité",
    description:
      "Entrepôts, ateliers et locaux mixtes pour vos besoins logistiques et artisanaux.",
  },
  {
    title: "Immeubles",
    description:
      "Immeubles entiers à usage commercial ou mixte, opportunités d'investissement.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-brand-50">
        <div className="container-page section-padding">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-brand-600">
              Immobilier commercial &amp; professionnel
            </p>
            <h1 className="heading-display">
              Votre partenaire immobilier
              <br />
              <span className="text-brand-600">à Paris</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-anthracite-500">
              Nous accompagnons entreprises, enseignes et investisseurs dans la
              recherche, la cession et la valorisation de locaux commerciaux et
              professionnels au cœur de Paris.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/recherche-local"
                className="inline-flex items-center rounded-premium bg-anthracite-900 px-8 py-3.5 text-sm font-semibold text-white shadow-premium transition-all hover:bg-anthracite-800 hover:shadow-lg"
              >
                Rechercher un local
              </Link>
              <Link
                href="/biens"
                className="inline-flex items-center rounded-premium border border-stone-300 bg-white px-8 py-3.5 text-sm font-semibold text-anthracite-800 transition-colors hover:bg-stone-50"
              >
                Voir nos biens
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Expertise */}
      <section className="section-padding bg-white">
        <div className="container-page">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-brand-600">
              Notre expertise
            </p>
            <h2 className="heading-section mt-2">
              Tous types de locaux professionnels
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {expertiseAreas.map((area) => (
              <div
                key={area.title}
                className="group rounded-premium border border-stone-200 bg-white p-6 shadow-card transition-all hover:shadow-card-hover"
              >
                <h3 className="font-serif text-lg font-semibold text-anthracite-900">
                  {area.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">
                  {area.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-anthracite-900 py-16">
        <div className="container-page text-center">
          <h2 className="font-serif text-2xl font-semibold text-white md:text-3xl">
            Un projet immobilier commercial ?
          </h2>
          <p className="mt-3 text-stone-300">
            Décrivez votre recherche et notre équipe vous recontacte sous 24h.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/recherche-local"
              className="inline-flex items-center rounded-premium bg-champagne-500 px-8 py-3 text-sm font-semibold text-anthracite-900 transition-colors hover:bg-champagne-400"
            >
              Rechercher un local
            </Link>
            <Link
              href="/proposer-bien"
              className="inline-flex items-center rounded-premium border border-stone-600 px-8 py-3 text-sm font-semibold text-stone-200 transition-colors hover:bg-anthracite-800"
            >
              Proposer un bien
            </Link>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="section-padding">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="heading-section">
              Pourquoi choisir {APP_NAME} ?
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {[
                {
                  title: "Expertise locale",
                  description:
                    "Une connaissance fine du marché parisien, quartier par quartier.",
                },
                {
                  title: "Accompagnement dédié",
                  description:
                    "Un interlocuteur unique qui suit votre projet de A à Z.",
                },
                {
                  title: "Réseau qualifié",
                  description:
                    "Un portefeuille d'offres exclusives et un réseau de décideurs.",
                },
              ].map((item) => (
                <div key={item.title} className="text-center">
                  <h3 className="font-serif text-lg font-semibold text-anthracite-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">
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
