import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { findPublishedProperties } from "@/modules/properties";
import { formatPrice, formatSurface } from "@/lib/utils";
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Nos biens",
};

export default async function BiensPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const { items: properties, totalPages } = await findPublishedProperties(page);

  return (
    <>
      <section className="bg-gradient-to-b from-white to-brand-50 py-12">
        <div className="container-page">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-brand-600">
              Nos biens
            </p>
            <h1 className="heading-display mt-2">
              Locaux disponibles à Paris
            </h1>
            <p className="mt-4 text-lg text-anthracite-500">
              Découvrez notre sélection de locaux commerciaux et professionnels.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-page">
          {properties.length === 0 ? (
            <div className="py-16 text-center">
              <h3 className="text-lg font-medium text-anthracite-700">
                Aucun bien disponible pour le moment
              </h3>
              <p className="mt-2 text-sm text-stone-500">
                Décrivez votre recherche et nous vous recontacterons dès qu&apos;un
                bien correspondant sera disponible.
              </p>
              <Link
                href="/recherche-local"
                className="mt-6 inline-flex rounded-premium bg-anthracite-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-anthracite-800"
              >
                Décrire ma recherche
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {properties.map((property) => (
                  <Link
                    key={property.id}
                    href={`/biens/${property.id}`}
                    className="group overflow-hidden rounded-premium border border-stone-200 bg-white shadow-card transition-all hover:shadow-card-hover"
                  >
                    {/* Image placeholder */}
                    <div className="relative aspect-[4/3] bg-stone-100">
                      {property.media[0] ? (
                        <Image
                          src={property.media[0].url}
                          alt={property.title}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-stone-300">
                          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge>
                            {PROPERTY_TYPE_LABELS[property.type] || property.type}
                          </Badge>
                          <h3 className="mt-2 font-serif text-lg font-semibold text-anthracite-900 group-hover:text-brand-700">
                            {property.title}
                          </h3>
                        </div>
                      </div>

                      <p className="mt-1 text-sm text-stone-500">
                        {property.district || property.city}
                      </p>

                      <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                        <div>
                          {property.transactionType === "LOCATION" ? (
                            <p className="text-lg font-semibold text-anthracite-900">
                              {formatPrice(property.rentMonthly)}
                              <span className="text-sm font-normal text-stone-400">
                                /mois
                              </span>
                            </p>
                          ) : (
                            <p className="text-lg font-semibold text-anthracite-900">
                              {formatPrice(property.price)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-stone-500">
                            {formatSurface(property.surfaceTotal)}
                          </p>
                          <p className="text-xs text-stone-400">
                            {TRANSACTION_TYPE_LABELS[property.transactionType]}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <Link
                        key={p}
                        href={`/biens?page=${p}`}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                          p === page
                            ? "bg-anthracite-900 text-white"
                            : "bg-white text-anthracite-700 hover:bg-stone-50"
                        }`}
                      >
                        {p}
                      </Link>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
