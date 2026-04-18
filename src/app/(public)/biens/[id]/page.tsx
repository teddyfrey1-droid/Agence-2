import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { findPropertyById } from "@/modules/properties";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatSurface, formatDate } from "@/lib/utils";
import {
  PROPERTY_TYPE_LABELS,
  TRANSACTION_TYPE_LABELS,
  PROPERTY_STATUS_LABELS,
} from "@/lib/constants";
import { Badge } from "@/components/ui";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await findPropertyById(id);

  if (!property || !property.isPublished) {
    // Legacy fallback: older emails linked /biens/<shareToken>. Redirect to the new share view.
    const share = await prisma.propertyShare.findUnique({
      where: { shareToken: id },
      select: { shareToken: true },
    });
    if (share) {
      redirect(`/biens/partage/${share.shareToken}`);
    }
    notFound();
  }

  const features = [
    property.hasExtraction && "Extraction",
    property.hasTerrace && "Terrasse",
    property.hasParking && "Parking",
    property.hasLoadingDock && "Quai de chargement",
  ].filter(Boolean);

  return (
    <section className="section-padding">
      <div className="container-page">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-stone-500">
          <Link href="/biens" className="hover:text-anthracite-700">
            Nos biens
          </Link>
          <span>/</span>
          <span className="text-anthracite-700">{property.title}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Gallery */}
            <div className="aspect-[16/9] overflow-hidden rounded-premium bg-stone-100">
              {property.media.length > 0 ? (
                <img
                  src={property.media[0].url}
                  alt={property.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-stone-300">
                  <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>
                  {PROPERTY_TYPE_LABELS[property.type] || property.type}
                </Badge>
                <Badge variant="neutral">
                  {TRANSACTION_TYPE_LABELS[property.transactionType]}
                </Badge>
              </div>

              <h1 className="mt-4 font-serif text-3xl font-semibold text-anthracite-900">
                {property.title}
              </h1>

              <p className="mt-2 text-lg text-stone-500">
                {property.district || property.city}
              </p>
              <p className="mt-1 text-xs italic text-stone-400">
                Localisation approximative — l&apos;adresse exacte est communiquée aux candidats qualifiés après prise de contact.
              </p>

              {property.description && (
                <div className="mt-8">
                  <h2 className="heading-card">Description</h2>
                  <p className="mt-3 whitespace-pre-line text-body">
                    {property.description}
                  </p>
                </div>
              )}

              {/* Characteristics */}
              <div className="mt-8">
                <h2 className="heading-card">Caractéristiques</h2>
                <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {property.surfaceTotal && (
                    <div>
                      <dt className="text-caption">Surface</dt>
                      <dd className="mt-1 font-medium text-anthracite-800">
                        {formatSurface(property.surfaceTotal)}
                      </dd>
                    </div>
                  )}
                  {property.floor != null && (
                    <div>
                      <dt className="text-caption">Étage</dt>
                      <dd className="mt-1 font-medium text-anthracite-800">
                        {property.floor === 0
                          ? "Rez-de-chaussée"
                          : `${property.floor}e étage`}
                      </dd>
                    </div>
                  )}
                  {property.facadeLength && (
                    <div>
                      <dt className="text-caption">Linéaire de façade</dt>
                      <dd className="mt-1 font-medium text-anthracite-800">
                        {property.facadeLength} m
                      </dd>
                    </div>
                  )}
                  {property.ceilingHeight && (
                    <div>
                      <dt className="text-caption">Hauteur sous plafond</dt>
                      <dd className="mt-1 font-medium text-anthracite-800">
                        {property.ceilingHeight} m
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {features.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-anthracite-700">
                    Équipements
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {features.map((f) => (
                      <Badge key={f as string} variant="success">
                        {f as string}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-premium border border-stone-200 bg-white p-6 shadow-card">
              <div className="text-center">
                {property.transactionType === "LOCATION" ? (
                  <>
                    <p className="text-3xl font-bold text-anthracite-900">
                      {formatPrice(property.rentMonthly)}
                    </p>
                    <p className="text-sm text-stone-500">par mois HT HC</p>
                    {property.charges && (
                      <p className="mt-1 text-sm text-stone-400">
                        Charges : {formatPrice(property.charges)}/mois
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-anthracite-900">
                      {formatPrice(property.price)}
                    </p>
                    {property.pricePerSqm && (
                      <p className="text-sm text-stone-500">
                        {formatPrice(property.pricePerSqm)}/m²
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <p className="text-sm text-stone-500">
                  Référence :{" "}
                  <span className="font-medium text-anthracite-700">
                    {property.reference}
                  </span>
                </p>
                <p className="text-sm text-stone-500">
                  Publié le :{" "}
                  <span className="font-medium text-anthracite-700">
                    {formatDate(property.publishedAt)}
                  </span>
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <Link
                  href="/contact"
                  className="flex w-full items-center justify-center rounded-premium bg-anthracite-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-anthracite-800"
                >
                  Nous contacter
                </Link>
                <Link
                  href="/recherche-local"
                  className="flex w-full items-center justify-center rounded-premium border border-stone-300 py-3 text-sm font-semibold text-anthracite-800 transition-colors hover:bg-stone-50"
                >
                  Décrire ma recherche
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
