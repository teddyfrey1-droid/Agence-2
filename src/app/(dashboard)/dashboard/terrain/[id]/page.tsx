import { notFound } from "next/navigation";
import Link from "next/link";
import { findFieldSpottingById } from "@/modules/field-spotting";
import { formatDate } from "@/lib/utils";
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TerrainPhotoUploader } from "@/components/photo-uploader";
import { StatusSelector } from "@/components/status-selector";
import { ConvertToPropertyButton } from "@/components/convert-to-property-button";
import { FIELD_SPOTTING_STATUS_LABELS } from "@/lib/constants";

export default async function TerrainDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const spot = await findFieldSpottingById(id);
  if (!spot) notFound();

  // Merge legacy photoUrl into photos array
  const photos: string[] = spot.photos?.length
    ? spot.photos
    : spot.photoUrl
    ? [spot.photoUrl]
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/terrain"
              className="text-sm text-stone-400 hover:text-anthracite-700 dark:hover:text-stone-200"
            >
              Terrain
            </Link>
            <span className="text-stone-300 dark:text-stone-600">/</span>
            <span className="text-sm text-anthracite-700 dark:text-stone-300">Détail</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-anthracite-900 dark:text-stone-100">
            {spot.address}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {spot.city} {spot.zipCode} {spot.district && `· ${spot.district}`}
          </p>
        </div>
        <Badge variant={getStatusBadgeVariant(spot.status)}>
          {FIELD_SPOTTING_STATUS_LABELS[spot.status] || spot.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Photos */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">Photos</h2>
            <p className="text-xs text-stone-400 dark:text-stone-500">
              {photos.length}/10 · compressées automatiquement
            </p>
          </CardHeader>
          <CardContent>
            <TerrainPhotoUploader entityId={id} initialPhotos={photos} />
          </CardContent>
        </Card>

        {/* Informations */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">Informations</h2>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {spot.propertyType && (
                <div>
                  <dt className="text-caption">Type estimé</dt>
                  <dd className="mt-0.5 text-sm font-medium text-anthracite-800 dark:text-stone-200">
                    {PROPERTY_TYPE_LABELS[spot.propertyType] || spot.propertyType}
                  </dd>
                </div>
              )}
              {spot.transactionType && (
                <div>
                  <dt className="text-caption">Transaction</dt>
                  <dd className="mt-0.5 text-sm font-medium text-anthracite-800 dark:text-stone-200">
                    {TRANSACTION_TYPE_LABELS[spot.transactionType] || spot.transactionType}
                  </dd>
                </div>
              )}
              {spot.surface && (
                <div>
                  <dt className="text-caption">Surface estimée</dt>
                  <dd className="mt-0.5 text-sm font-medium text-anthracite-800 dark:text-stone-200">
                    {spot.surface} m²
                  </dd>
                </div>
              )}
              {spot.facadeLength && (
                <div>
                  <dt className="text-caption">Linéaire de façade</dt>
                  <dd className="mt-0.5 text-sm font-medium text-anthracite-800 dark:text-stone-200">
                    {spot.facadeLength} m
                  </dd>
                </div>
              )}
              {spot.ceilingHeight && (
                <div>
                  <dt className="text-caption">Hauteur sous plafond</dt>
                  <dd className="mt-0.5 text-sm font-medium text-anthracite-800 dark:text-stone-200">
                    {spot.ceilingHeight} m
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-caption">Assigné à</dt>
                <dd className="mt-0.5 text-sm font-medium text-anthracite-800 dark:text-stone-200">
                  {spot.assignedTo
                    ? `${spot.assignedTo.firstName} ${spot.assignedTo.lastName}`
                    : "Non assigné"}
                </dd>
              </div>
              <div>
                <dt className="text-caption">Créé le</dt>
                <dd className="mt-0.5 text-sm font-medium text-anthracite-800 dark:text-stone-200">
                  {formatDate(spot.createdAt)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Suivi */}
      <Card>
        <CardHeader>
          <h2 className="heading-card">Suivi</h2>
        </CardHeader>
        <CardContent>
          <StatusSelector
            entityId={id}
            entityType="field-spotting"
            currentStatus={spot.status}
          />
        </CardContent>
      </Card>

      {/* Notes */}
      {spot.notes && (
        <Card>
          <CardHeader>
            <h2 className="heading-card">Notes</h2>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-anthracite-600 dark:text-stone-300">
              {spot.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="space-y-2">
          {spot.status !== "CONVERTI" && (
            <ConvertToPropertyButton
              spotId={id}
              address={spot.address}
              city={spot.city}
              zipCode={spot.zipCode}
              district={spot.district}
              propertyType={spot.propertyType}
              transactionType={spot.transactionType}
              surface={spot.surface}
              facadeLength={spot.facadeLength}
              ceilingHeight={spot.ceilingHeight}
              latitude={spot.latitude}
              longitude={spot.longitude}
              notes={spot.notes}
            />
          )}
          {spot.status === "CONVERTI" && (
            <p className="py-2 text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Ce repérage a été converti en bien
            </p>
          )}
          <Link href="/dashboard/terrain" className="block">
            <Button variant="outline" className="w-full">Retour</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
