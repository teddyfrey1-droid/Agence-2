import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatSurface, formatDate } from "@/lib/utils";
import {
  PROPERTY_TYPE_LABELS,
  TRANSACTION_TYPE_LABELS,
} from "@/lib/constants";
import { Badge } from "@/components/ui";
import { ShareViewTracker } from "./tracker";

export default async function SharedPropertyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const share = await prisma.propertyShare.findUnique({
    where: { shareToken: token },
    include: {
      property: {
        include: {
          media: { orderBy: { sortOrder: "asc" } },
          assignedTo: { select: { firstName: true, lastName: true, email: true } },
        },
      },
      sentBy: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  if (!share || !share.property) notFound();
  const property = share.property;

  // Record the open server-side for analytics even if the client JS tracker doesn't run
  try {
    await prisma.propertyShare.update({
      where: { id: share.id },
      data: {
        openedAt: share.openedAt || new Date(),
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });
  } catch {
    /* silent — view tracking shouldn't break the page */
  }
  void headers; // keep next.js dynamic rendering

  const features = [
    property.hasExtraction && "Extraction",
    property.hasTerrace && "Terrasse",
    property.hasParking && "Parking",
    property.hasLoadingDock && "Quai de chargement",
  ].filter(Boolean) as string[];

  const photos = property.media.filter((m) => m.type === "PHOTO");
  const priceDisplay =
    property.transactionType === "LOCATION"
      ? property.rentMonthly
        ? `${formatPrice(property.rentMonthly)}/mois HT HC`
        : formatPrice(property.price)
      : formatPrice(property.price);

  return (
    <section className="section-padding">
      <ShareViewTracker token={token} />
      <div className="container-page">
        <div className="mb-6 rounded-premium border border-brand-200 bg-brand-50/60 px-4 py-3 text-sm text-anthracite-700">
          <span className="font-semibold">Proposition confidentielle</span> — transmise par
          {" "}
          <strong>
            {share.sentBy.firstName} {share.sentBy.lastName}
          </strong>
          {share.sentBy.email ? (
            <>
              {" "}
              (<a href={`mailto:${share.sentBy.email}`} className="text-brand-700 underline">
                {share.sentBy.email}
              </a>
              )
            </>
          ) : null}
          .
        </div>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="aspect-[16/9] overflow-hidden rounded-premium bg-stone-100">
              {photos.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photos[0].url}
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

            {photos.length > 1 && (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.slice(1, 8).map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={p.id}
                    src={p.url}
                    alt={p.title || property.title}
                    className="aspect-[4/3] h-auto w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            )}

            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{PROPERTY_TYPE_LABELS[property.type] || property.type}</Badge>
                <Badge variant="neutral">{TRANSACTION_TYPE_LABELS[property.transactionType]}</Badge>
                <Badge variant="neutral">Réf. {property.reference}</Badge>
              </div>

              <h1 className="mt-4 font-serif text-3xl font-semibold text-anthracite-900">
                {property.title}
              </h1>

              <p className="mt-2 text-lg text-stone-600">
                {property.address ? `${property.address}, ` : ""}
                {property.district ? `${property.district}, ` : ""}
                {property.city}
                {property.zipCode ? ` ${property.zipCode}` : ""}
              </p>

              {share.message && (
                <div className="mt-6 rounded-lg border-l-4 border-brand-500 bg-stone-50 px-4 py-3 text-sm italic text-anthracite-700 whitespace-pre-line">
                  {share.message}
                </div>
              )}

              {property.description && (
                <div className="mt-8">
                  <h2 className="heading-card">Description</h2>
                  <p className="mt-3 whitespace-pre-line text-body">
                    {property.description}
                  </p>
                </div>
              )}

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
                        {property.floor === 0 ? "Rez-de-chaussée" : `${property.floor}e étage`}
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
                  <h3 className="text-sm font-medium text-anthracite-700">Équipements</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {features.map((f) => (
                      <Badge key={f} variant="success">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-premium border border-stone-200 bg-white p-6 shadow-card">
              <div className="text-center">
                <p className="text-3xl font-bold text-anthracite-900">{priceDisplay}</p>
                {property.transactionType === "LOCATION" && property.charges ? (
                  <p className="mt-1 text-sm text-stone-400">
                    Charges : {formatPrice(property.charges)}/mois
                  </p>
                ) : null}
                {property.pricePerSqm && property.transactionType !== "LOCATION" ? (
                  <p className="text-sm text-stone-500">{formatPrice(property.pricePerSqm)}/m²</p>
                ) : null}
              </div>

              <div className="mt-6 space-y-2 text-sm text-stone-500">
                <p>
                  Référence : <span className="font-medium text-anthracite-700">{property.reference}</span>
                </p>
                {property.publishedAt && (
                  <p>
                    Publié le : <span className="font-medium text-anthracite-700">{formatDate(property.publishedAt)}</span>
                  </p>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <a
                  href={`mailto:${share.sentBy.email || ""}?subject=${encodeURIComponent(`Bien ${property.reference} — ${property.title}`)}`}
                  className="flex w-full items-center justify-center rounded-premium bg-anthracite-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-anthracite-800"
                >
                  Contacter {share.sentBy.firstName}
                </a>
                <Link
                  href="/contact"
                  className="flex w-full items-center justify-center rounded-premium border border-stone-300 py-3 text-sm font-semibold text-anthracite-800 transition-colors hover:bg-stone-50"
                >
                  Nous écrire
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
