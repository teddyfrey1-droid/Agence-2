import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatSurface } from "@/lib/utils";
import {
  PROPERTY_TYPE_LABELS,
  TRANSACTION_TYPE_LABELS,
} from "@/lib/constants";
import Link from "next/link";

export default async function ClientPropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const property = await prisma.property.findFirst({
    where: {
      id,
      status: "ACTIF",
      isPublished: true,
      confidentiality: "PUBLIC",
    },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!property) notFound();

  const photos = property.media.filter((m) => m.type === "PHOTO");
  const displayPrice =
    property.transactionType === "LOCATION"
      ? property.rentMonthly
        ? `${formatPrice(property.rentMonthly)}/mois`
        : formatPrice(property.price)
      : formatPrice(property.price);

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/espace-client/biens"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-anthracite-800 dark:text-stone-400 dark:hover:text-stone-200"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
        Retour aux biens
      </Link>

      {/* Photo Gallery */}
      {photos.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {/* Main photo */}
          <div className="overflow-hidden rounded-xl sm:row-span-2">
            <img
              src={photos[0].url}
              alt={photos[0].title || property.title}
              className="h-full w-full object-cover"
              style={{ minHeight: "280px", maxHeight: "420px" }}
            />
          </div>
          {/* Secondary photos */}
          {photos.slice(1, 3).map((photo) => (
            <div
              key={photo.id}
              className="hidden overflow-hidden rounded-xl sm:block"
            >
              <img
                src={photo.url}
                alt={photo.title || property.title}
                className="h-full w-full object-cover"
                style={{ minHeight: "136px", maxHeight: "206px" }}
              />
            </div>
          ))}
          {photos.length > 3 && (
            <div className="relative hidden overflow-hidden rounded-xl sm:block">
              <img
                src={photos[3].url}
                alt={photos[3].title || property.title}
                className="h-full w-full object-cover brightness-50"
                style={{ minHeight: "136px", maxHeight: "206px" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-semibold text-white">
                  +{photos.length - 3} photos
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 via-brand-50 to-champagne-100 dark:from-brand-900/40 dark:via-anthracite-800 dark:to-champagne-900/20">
          <svg
            className="h-16 w-16 text-brand-300 dark:text-brand-700"
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

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Title & Location */}
          <Card>
            <CardContent className="space-y-4 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-anthracite-900 dark:text-stone-100 sm:text-2xl">
                    {property.title}
                  </h1>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                    {property.address && `${property.address}, `}
                    {property.district && `${property.district}, `}
                    {property.city}
                    {property.zipCode && ` ${property.zipCode}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-anthracite-900 dark:text-stone-100 sm:text-2xl">
                    {displayPrice}
                  </p>
                  {property.transactionType === "LOCATION" &&
                    property.rentYearly && (
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {formatPrice(property.rentYearly)}/an
                      </p>
                    )}
                  {property.pricePerSqm && (
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      {formatPrice(property.pricePerSqm)}/m2
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="default">
                  {TRANSACTION_TYPE_LABELS[property.transactionType] ||
                    property.transactionType}
                </Badge>
                <Badge variant="neutral">
                  {PROPERTY_TYPE_LABELS[property.type] || property.type}
                </Badge>
                {property.reference && (
                  <Badge variant="neutral">Ref. {property.reference}</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {property.description && (
            <Card>
              <CardContent className="py-5">
                <h2 className="mb-3 text-base font-semibold text-anthracite-900 dark:text-stone-100">
                  Description
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                  {property.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Location */}
          <Card>
            <CardContent className="py-5">
              <h2 className="mb-3 text-base font-semibold text-anthracite-900 dark:text-stone-100">
                Localisation
              </h2>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                {property.address && (
                  <div>
                    <span className="text-stone-400 dark:text-stone-500">
                      Adresse
                    </span>
                    <p className="font-medium text-anthracite-800 dark:text-stone-200">
                      {property.address}
                    </p>
                  </div>
                )}
                {property.district && (
                  <div>
                    <span className="text-stone-400 dark:text-stone-500">
                      Quartier
                    </span>
                    <p className="font-medium text-anthracite-800 dark:text-stone-200">
                      {property.district}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-stone-400 dark:text-stone-500">
                    Ville
                  </span>
                  <p className="font-medium text-anthracite-800 dark:text-stone-200">
                    {property.city}
                    {property.zipCode && ` (${property.zipCode})`}
                  </p>
                </div>
                {property.quarter && (
                  <div>
                    <span className="text-stone-400 dark:text-stone-500">
                      Secteur
                    </span>
                    <p className="font-medium text-anthracite-800 dark:text-stone-200">
                      {property.quarter}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar (1 col) */}
        <div className="space-y-6">
          {/* Characteristics */}
          <Card>
            <CardContent className="py-5">
              <h2 className="mb-4 text-base font-semibold text-anthracite-900 dark:text-stone-100">
                Caracteristiques
              </h2>
              <dl className="space-y-3 text-sm">
                {property.surfaceTotal && (
                  <div className="flex items-center justify-between">
                    <dt className="text-stone-500 dark:text-stone-400">
                      Surface totale
                    </dt>
                    <dd className="font-medium text-anthracite-800 dark:text-stone-200">
                      {formatSurface(property.surfaceTotal)}
                    </dd>
                  </div>
                )}
                {property.surfaceMin && property.surfaceMax && (
                  <div className="flex items-center justify-between">
                    <dt className="text-stone-500 dark:text-stone-400">
                      Surface
                    </dt>
                    <dd className="font-medium text-anthracite-800 dark:text-stone-200">
                      {formatSurface(property.surfaceMin)} -{" "}
                      {formatSurface(property.surfaceMax)}
                    </dd>
                  </div>
                )}
                {property.floor != null && (
                  <div className="flex items-center justify-between">
                    <dt className="text-stone-500 dark:text-stone-400">
                      Etage
                    </dt>
                    <dd className="font-medium text-anthracite-800 dark:text-stone-200">
                      {property.floor === 0
                        ? "RDC"
                        : `${property.floor}${property.totalFloors ? `/${property.totalFloors}` : ""}`}
                    </dd>
                  </div>
                )}
                {property.facadeLength && (
                  <div className="flex items-center justify-between">
                    <dt className="text-stone-500 dark:text-stone-400">
                      Facade
                    </dt>
                    <dd className="font-medium text-anthracite-800 dark:text-stone-200">
                      {property.facadeLength} m
                    </dd>
                  </div>
                )}
                {property.ceilingHeight && (
                  <div className="flex items-center justify-between">
                    <dt className="text-stone-500 dark:text-stone-400">
                      Hauteur sous plafond
                    </dt>
                    <dd className="font-medium text-anthracite-800 dark:text-stone-200">
                      {property.ceilingHeight} m
                    </dd>
                  </div>
                )}
                {(property.charges != null || property.deposit != null) && (
                  <div className="border-t border-stone-100 pt-3 dark:border-stone-700/50">
                    {property.charges != null && (
                      <div className="flex items-center justify-between">
                        <dt className="text-stone-500 dark:text-stone-400">
                          Charges
                        </dt>
                        <dd className="font-medium text-anthracite-800 dark:text-stone-200">
                          {formatPrice(property.charges)}/mois
                        </dd>
                      </div>
                    )}
                    {property.deposit != null && (
                      <div className="mt-2 flex items-center justify-between">
                        <dt className="text-stone-500 dark:text-stone-400">
                          Depot de garantie
                        </dt>
                        <dd className="font-medium text-anthracite-800 dark:text-stone-200">
                          {formatPrice(property.deposit)}
                        </dd>
                      </div>
                    )}
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardContent className="py-5">
              <h2 className="mb-4 text-base font-semibold text-anthracite-900 dark:text-stone-100">
                Equipements
              </h2>
              <div className="space-y-2.5">
                <FeatureRow
                  label="Extraction"
                  available={property.hasExtraction}
                />
                <FeatureRow
                  label="Terrasse"
                  available={property.hasTerrace}
                />
                <FeatureRow
                  label="Parking"
                  available={property.hasParking}
                />
                <FeatureRow
                  label="Quai de dechargement"
                  available={property.hasLoadingDock}
                />
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="border-brand-200 bg-brand-50/50 dark:border-brand-800/30 dark:bg-brand-950/20">
            <CardContent className="py-5 text-center">
              <h3 className="text-sm font-semibold text-anthracite-900 dark:text-stone-100">
                Ce bien vous interesse ?
              </h3>
              <p className="mb-4 mt-1 text-xs text-stone-500 dark:text-stone-400">
                Creez une demande de recherche pour que nous puissions vous
                accompagner.
              </p>
              <Link href="/espace-client/recherche">
                <Button variant="primary" size="md" className="w-full">
                  Je suis interesse
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({
  label,
  available,
}: {
  label: string;
  available: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      {available ? (
        <svg
          className="h-4 w-4 text-emerald-500 dark:text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
      ) : (
        <svg
          className="h-4 w-4 text-stone-300 dark:text-stone-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
      <span
        className={
          available
            ? "text-anthracite-800 dark:text-stone-200"
            : "text-stone-400 dark:text-stone-500"
        }
      >
        {label}
      </span>
    </div>
  );
}
