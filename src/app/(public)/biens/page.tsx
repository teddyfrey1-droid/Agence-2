import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { findPublishedProperties } from "@/modules/properties";
import { formatPrice, formatSurface } from "@/lib/utils";
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Nos biens",
  description:
    "Sélection de locaux commerciaux et professionnels à Paris : boutiques, restaurants, bureaux. Disponibles à la location ou à la vente.",
  alternates: { canonical: "/biens" },
};

export default async function BiensPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const { items: properties, total, totalPages } = await findPublishedProperties(page);

  return (
    <>
      {/* Hero — éditorial, pleine largeur */}
      <section className="relative isolate overflow-hidden bg-gradient-premium py-20 sm:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(176,146,106,0.12),transparent_55%)]" />
        <div className="container-page text-center">
          <p className="label-overline">La sélection</p>
          <h1 className="mt-5 font-serif text-4xl font-normal italic tracking-tight text-anthracite-900 sm:text-5xl md:text-6xl dark:text-stone-100">
            Locaux disponibles
            <span className="block not-italic font-semibold">à Paris</span>
          </h1>
          <div className="mx-auto mt-7 h-px w-12 bg-champagne-400" />
          <p className="mx-auto mt-7 max-w-xl font-sans text-base leading-relaxed text-anthracite-500 dark:text-stone-300">
            Boutiques, restaurants, bureaux et locaux d&apos;activité —
            curation continue, disponibilité vérifiée.
          </p>
          {total > 0 && (
            <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
              {total} bien{total > 1 ? "s" : ""} disponible{total > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20 dark:bg-anthracite-950">
        <div className="container-page">
          {properties.length === 0 ? (
            <div className="mx-auto max-w-md py-12 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-900/20 dark:text-brand-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-semibold text-anthracite-900 dark:text-stone-100">
                Aucun bien disponible pour le moment
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                Notre sélection est en cours de renouvellement. Décrivez-nous
                votre projet — nous vous proposerons des locaux dès qu&apos;un
                profil correspondant sera mandaté.
              </p>
              <Link
                href="/recherche-local"
                className="mt-7 inline-flex items-center gap-2 border border-anthracite-900 bg-anthracite-900 px-7 py-3 font-sans text-[11px] tracking-[0.25em] uppercase text-white transition-colors hover:bg-anthracite-800 dark:border-stone-100 dark:bg-stone-100 dark:text-anthracite-950 dark:hover:bg-stone-200"
              >
                Décrire ma recherche
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {properties.map((property) => {
                  const isLocation = property.transactionType === "LOCATION";
                  return (
                    <Link
                      key={property.id}
                      href={`/biens/${property.id}`}
                      className="group flex flex-col"
                    >
                      {/* Photo — clean rectangle, subtle hover */}
                      <div className="relative aspect-[4/5] overflow-hidden bg-stone-100 dark:bg-anthracite-900">
                        {property.media[0] ? (
                          <Image
                            src={property.media[0].url}
                            alt={property.title}
                            fill
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-stone-300 dark:text-stone-700">
                            <svg className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21" />
                            </svg>
                          </div>
                        )}
                        {/* Subtle overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                        {/* Top-right transaction tag */}
                        <span className="absolute right-3 top-3 inline-flex items-center bg-white/95 px-2.5 py-1 font-sans text-[9.5px] font-semibold uppercase tracking-[0.18em] text-anthracite-700 backdrop-blur-sm dark:bg-anthracite-950/80 dark:text-stone-200">
                          {TRANSACTION_TYPE_LABELS[property.transactionType]}
                        </span>
                      </div>

                      {/* Caption */}
                      <div className="mt-5 flex flex-1 flex-col">
                        <p className="font-sans text-[10.5px] font-medium uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
                          {PROPERTY_TYPE_LABELS[property.type] || property.type}
                          <span className="text-stone-300 dark:text-stone-600"> · </span>
                          <span className="text-stone-500 dark:text-stone-400">
                            {property.district || property.city}
                          </span>
                        </p>

                        <h3 className="mt-2 font-serif text-lg font-semibold leading-snug text-anthracite-900 transition-colors group-hover:text-brand-700 dark:text-stone-100 dark:group-hover:text-brand-300">
                          {property.title}
                        </h3>

                        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                          <div>
                            {isLocation ? (
                              <p className="font-display text-xl font-bold tracking-tight text-anthracite-900 dark:text-stone-100">
                                {formatPrice(property.rentMonthly)}
                                <span className="ml-0.5 text-xs font-normal text-stone-400">
                                  /mois
                                </span>
                              </p>
                            ) : (
                              <p className="font-display text-xl font-bold tracking-tight text-anthracite-900 dark:text-stone-100">
                                {formatPrice(property.price)}
                              </p>
                            )}
                          </div>
                          {property.surfaceTotal && (
                            <p className="text-sm tabular-nums text-stone-500 dark:text-stone-400">
                              {formatSurface(property.surfaceTotal)}
                            </p>
                          )}
                        </div>

                        {/* Hairline + tiny chevron on hover */}
                        <div className="mt-3 flex items-center gap-2 border-t border-stone-200/80 pt-3 dark:border-anthracite-800">
                          <span className="font-sans text-[10.5px] tracking-[0.2em] uppercase text-stone-500 transition-colors group-hover:text-brand-700 dark:text-stone-400 dark:group-hover:text-brand-400">
                            Découvrir
                          </span>
                          <span className="block h-px flex-1 bg-stone-200 transition-colors group-hover:bg-brand-300 dark:bg-anthracite-800 dark:group-hover:bg-brand-700" />
                          <svg className="h-3 w-3 text-stone-400 transition-all group-hover:translate-x-0.5 group-hover:text-brand-600 dark:text-stone-500 dark:group-hover:text-brand-400" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                            <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination — luxury minimal */}
              {totalPages > 1 && (
                <nav className="mt-16 flex items-center justify-center gap-1" aria-label="Pagination">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={`/biens?page=${p}`}
                      aria-current={p === page ? "page" : undefined}
                      className={
                        p === page
                          ? "min-w-[40px] border-b-2 border-brand-500 px-3 py-2 text-center font-sans text-sm font-semibold text-anthracite-900 dark:text-stone-100"
                          : "min-w-[40px] border-b-2 border-transparent px-3 py-2 text-center font-sans text-sm font-medium text-stone-500 transition-colors hover:border-stone-300 hover:text-anthracite-800 dark:text-stone-400 dark:hover:border-stone-600 dark:hover:text-stone-200"
                      }
                    >
                      {p}
                    </Link>
                  ))}
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
