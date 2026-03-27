import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatSurface } from "@/lib/utils";
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import Link from "next/link";

export default async function ClientPropertiesPage() {
  const properties = await prisma.property.findMany({
    where: {
      status: "ACTIF",
      isPublished: true,
      confidentiality: "PUBLIC",
    },
    include: {
      media: {
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
    },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">
          Biens disponibles
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          {properties.length} bien{properties.length !== 1 ? "s" : ""} disponible{properties.length !== 1 ? "s" : ""}
        </p>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent>
            <p className="py-12 text-center text-sm text-stone-400 dark:text-stone-500">
              Aucun bien disponible pour le moment. Revenez bientot.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id} hover className="flex flex-col overflow-hidden">
              {/* Photo */}
              <div className="relative aspect-[4/3] overflow-hidden">
                {property.media[0] ? (
                  <img
                    src={property.media[0].url}
                    alt={property.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 via-brand-50 to-champagne-100 dark:from-brand-900/40 dark:via-anthracite-800 dark:to-champagne-900/20">
                    <svg className="h-12 w-12 text-brand-300 dark:text-brand-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21" />
                    </svg>
                  </div>
                )}
                {/* Transaction badge */}
                <div className="absolute left-3 top-3">
                  <Badge variant="default" className="bg-white/90 text-anthracite-800 backdrop-blur-sm dark:bg-anthracite-900/90 dark:text-stone-200">
                    {TRANSACTION_TYPE_LABELS[property.transactionType] || property.transactionType}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <CardContent className="flex flex-1 flex-col gap-3 py-4">
                <div>
                  <h3 className="text-sm font-semibold text-anthracite-900 dark:text-stone-100">
                    {property.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                    {property.district ? `${property.district}, ` : ""}
                    {property.city}
                  </p>
                </div>

                {/* Price */}
                <div className="text-base font-bold text-anthracite-900 dark:text-stone-100">
                  {property.transactionType === "LOCATION"
                    ? property.rentMonthly
                      ? `${formatPrice(property.rentMonthly)}/mois`
                      : formatPrice(property.price)
                    : formatPrice(property.price)}
                </div>

                {/* Key Info */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                  {property.surfaceTotal && (
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                      </svg>
                      {formatSurface(property.surfaceTotal)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                    </svg>
                    {PROPERTY_TYPE_LABELS[property.type] || property.type}
                  </span>
                </div>

                {/* Feature icons */}
                <div className="flex gap-2">
                  {property.hasExtraction && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600 dark:bg-anthracite-800 dark:text-stone-400">
                      Extraction
                    </span>
                  )}
                  {property.hasTerrace && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600 dark:bg-anthracite-800 dark:text-stone-400">
                      Terrasse
                    </span>
                  )}
                  {property.hasParking && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600 dark:bg-anthracite-800 dark:text-stone-400">
                      Parking
                    </span>
                  )}
                </div>

                {/* CTA */}
                <div className="mt-auto pt-2">
                  <Link href={`/espace-client/biens/${property.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Voir details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
