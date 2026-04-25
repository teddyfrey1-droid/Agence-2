import { notFound } from "next/navigation";
import Link from "next/link";
import { findPropertyById } from "@/modules/properties";
import { formatPrice, formatSurface, formatDate } from "@/lib/utils";
import {
  PROPERTY_TYPE_LABELS,
  TRANSACTION_TYPE_LABELS,
  PROPERTY_STATUS_LABELS,
} from "@/lib/constants";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PropertyPdfButton } from "@/components/property-pdf-button";
import { PropertyContractButton } from "@/components/property-contract-button";
import { PhotoUploader } from "@/components/photo-uploader";
import { DeleteButton } from "@/components/delete-button";
import { PublishButton } from "@/components/publish-button";
import { PropertyShareButton } from "@/components/property-share-button";
import { PropertyPanelsCard } from "@/components/property-panels-card";
import { PropertyMobileActions } from "@/components/property-mobile-actions";
import { PropertyAiSuggestion } from "@/components/property-ai-suggestion";
import { prisma } from "@/lib/prisma";
import { getAgencyInfo } from "@/lib/agency";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agency = await getAgencyInfo();
  const [property, matches, attachedPanels, availablePanels] = await Promise.all([
    findPropertyById(id),
    prisma.match.findMany({
      where: { propertyId: id },
      include: {
        searchRequest: {
          include: {
            contact: true,
          },
        },
      },
      orderBy: { score: "desc" },
    }),
    prisma.panel.findMany({
      where: { propertyId: id },
      select: {
        id: true,
        code: true,
        label: true,
        _count: { select: { scans: true } },
      },
      orderBy: { code: "asc" },
    }),
    prisma.panel.findMany({
      where: { status: "DISPONIBLE" },
      select: { id: true, code: true, label: true },
      orderBy: { code: "asc" },
      take: 50,
    }),
  ]);

  if (!property) notFound();

  const features = [
    property.hasExtraction && "Extraction",
    property.hasTerrace && "Terrasse",
    property.hasParking && "Parking",
    property.hasLoadingDock && "Quai de chargement",
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <PropertyMobileActions
        propertyId={id}
        reference={property.reference}
        isPublished={property.isPublished}
      />
      <PropertyAiSuggestion
        propertyId={id}
        type={property.type}
        transactionType={property.transactionType}
        district={property.district}
        city={property.city}
        quarter={property.quarter}
        surface={property.surfaceTotal}
        hasExtraction={property.hasExtraction}
        hasTerrace={property.hasTerrace}
        hasParking={property.hasParking}
        hasLoadingDock={property.hasLoadingDock}
        hasDescription={Boolean(property.description && property.description.length > 20)}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/biens"
              className="text-sm text-stone-400 hover:text-anthracite-700 dark:hover:text-stone-200"
            >
              Biens
            </Link>
            <span className="text-stone-300 dark:text-stone-600">/</span>
            <span className="text-sm text-anthracite-700 dark:text-stone-300">
              {property.reference}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-anthracite-900 dark:text-stone-100">
            {property.title}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {property.address && `${property.address}, `}
            {property.district || property.city}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(property.status)}>
            {PROPERTY_STATUS_LABELS[property.status]}
          </Badge>
          {property.isPublished && <Badge variant="success">Publié</Badge>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="heading-card">Informations</h2>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-caption">Type</dt>
                  <dd className="mt-1 text-sm font-medium text-anthracite-800 dark:text-stone-200">
                    {PROPERTY_TYPE_LABELS[property.type]}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption">Transaction</dt>
                  <dd className="mt-1 text-sm font-medium text-anthracite-800 dark:text-stone-200">
                    {TRANSACTION_TYPE_LABELS[property.transactionType]}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption">Surface</dt>
                  <dd className="mt-1 text-sm font-medium text-anthracite-800 dark:text-stone-200">
                    {formatSurface(property.surfaceTotal)}
                  </dd>
                </div>
                {property.floor != null && (
                  <div>
                    <dt className="text-caption">Etage</dt>
                    <dd className="mt-1 text-sm font-medium text-anthracite-800 dark:text-stone-200">
                      {property.floor === 0 ? "RDC" : `${property.floor}e`}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-caption">Prix / Loyer</dt>
                  <dd className="mt-1 text-sm font-medium text-anthracite-800 dark:text-stone-200">
                    {property.transactionType === "LOCATION"
                      ? `${formatPrice(property.rentMonthly)}/mois`
                      : formatPrice(property.price)}
                  </dd>
                </div>
                {property.charges && (
                  <div>
                    <dt className="text-caption">Charges</dt>
                    <dd className="mt-1 text-sm font-medium text-anthracite-800 dark:text-stone-200">
                      {formatPrice(property.charges)}/mois
                    </dd>
                  </div>
                )}
              </dl>

              {features.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {features.map((f) => (
                    <Badge key={f as string} variant="success">
                      {f as string}
                    </Badge>
                  ))}
                </div>
              )}

              {property.description && (
                <div className="mt-6 border-t border-stone-100 dark:border-stone-800 pt-4">
                  <p className="whitespace-pre-line text-sm text-anthracite-600 dark:text-stone-300">
                    {property.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media — Upload & Gallery */}
          <Card>
            <CardHeader>
              <h2 className="heading-card">Photos ({property.media.length})</h2>
            </CardHeader>
            <CardContent>
              <PhotoUploader
                entityType="property"
                entityId={id}
                watermarkLabel={agency.name}
                existingPhotos={property.media.map((m) => ({
                  id: m.id,
                  url: m.url,
                  title: m.title,
                  isPrimary: m.isPrimary,
                  sortOrder: m.sortOrder,
                }))}
              />
            </CardContent>
          </Card>

          {/* Prospects - Score de matching */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="heading-card">Prospects - Score de matching</h2>
                <span className="text-sm text-stone-500">
                  {matches.length} prospect{matches.length !== 1 ? "s" : ""} a
                  contacter
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {matches.length === 0 ? (
                <p className="text-sm text-stone-400">
                  Aucun prospect ne correspond pour le moment.
                </p>
              ) : (
                <div className="space-y-3">
                  {matches.map((match, index) => {
                    const contact = match.searchRequest.contact;
                    const scoreColor =
                      match.score >= 70
                        ? "text-emerald-600 border-emerald-500 bg-emerald-50"
                        : match.score >= 40
                          ? "text-orange-600 border-orange-400 bg-orange-50"
                          : "text-red-600 border-red-400 bg-red-50";
                    const phone = contact?.mobile || contact?.phone;

                    return (
                      <div
                        key={match.id}
                        className="flex items-center gap-4 rounded-lg border border-stone-100 dark:border-stone-800 p-3"
                      >
                        {/* Rank */}
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-500">
                          {index + 1}
                        </span>

                        {/* Score indicator */}
                        <div
                          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 ${scoreColor}`}
                        >
                          <span className="text-sm font-bold">
                            {match.score}
                          </span>
                        </div>

                        {/* Contact info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {contact ? (
                              <Link
                                href={`/dashboard/contacts/${contact.id}`}
                                className="truncate text-sm font-medium text-brand-600 hover:underline"
                              >
                                {contact.firstName} {contact.lastName}
                              </Link>
                            ) : (
                              <span className="text-sm text-stone-400">
                                Contact inconnu
                              </span>
                            )}
                          </div>
                          {match.searchRequest.activity && (
                            <p className="truncate text-xs text-stone-500">
                              {match.searchRequest.activity}
                            </p>
                          )}
                          {contact?.company && !match.searchRequest.activity && (
                            <p className="truncate text-xs text-stone-500">
                              {contact.company}
                            </p>
                          )}
                          {match.reasons.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {match.reasons.map((reason) => (
                                <span
                                  key={reason}
                                  className="inline-block rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600"
                                >
                                  {reason}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Call button */}
                        {phone && (
                          <a
                            href={`tel:${phone}`}
                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-stone-200 text-stone-500 transition-colors hover:bg-stone-50 hover:text-anthracite-700"
                            title={`Appeler ${phone}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="h-4 w-4"
                            >
                              <path
                                fillRule="evenodd"
                                d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="heading-card">Actions</h2>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/dashboard/biens/${id}/modifier`}>
                <Button variant="outline" className="w-full justify-start">
                  Modifier
                </Button>
              </Link>
              <PublishButton propertyId={id} isPublished={property.isPublished} />
              <PropertyShareButton propertyId={id} />
              <Button variant="outline" className="w-full justify-start">
                Lancer le matching
              </Button>
              <PropertyPdfButton propertyId={id} />
              <PropertyContractButton propertyId={id} />
              <DeleteButton entityId={id} entityType="properties" entityLabel="Bien" redirectTo="/dashboard/biens" />
            </CardContent>
          </Card>

          {property.isCoMandat && (
            <Card>
              <CardHeader>
                <h2 className="heading-card">Co-mandat</h2>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="info">Co-mandat</Badge>
                  {property.coMandatAgency && (
                    <span className="text-sm text-anthracite-700 dark:text-stone-300">
                      {property.coMandatAgency}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h2 className="heading-card">Assignation</h2>
            </CardHeader>
            <CardContent>
              {property.assignedTo ? (
                <p className="text-sm text-anthracite-700 dark:text-stone-300">
                  {property.assignedTo.firstName} {property.assignedTo.lastName}
                </p>
              ) : (
                <p className="text-sm text-stone-400">Non assigné</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="heading-card">Propriétaire</h2>
            </CardHeader>
            <CardContent>
              {property.owner ? (
                <Link
                  href={`/dashboard/contacts/${property.owner.id}`}
                  className="text-sm font-medium text-brand-600 hover:underline"
                >
                  {property.owner.firstName} {property.owner.lastName}
                </Link>
              ) : (
                <p className="text-sm text-stone-400">Non renseigné</p>
              )}
            </CardContent>
          </Card>

          <PropertyPanelsCard
            propertyId={id}
            attached={attachedPanels.map((p) => ({
              id: p.id,
              code: p.code,
              label: p.label,
              scanCount: p._count.scans,
            }))}
            available={availablePanels}
          />

          <Card>
            <CardHeader>
              <h2 className="heading-card">Statistiques</h2>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone-500">Dossiers</dt>
                  <dd className="font-medium text-anthracite-800">{property._count.deals}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Matches</dt>
                  <dd className="font-medium text-anthracite-800">{property._count.matches}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Tâches</dt>
                  <dd className="font-medium text-anthracite-800">{property._count.tasks}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Créé le</dt>
                  <dd className="font-medium text-anthracite-800">{formatDate(property.createdAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
