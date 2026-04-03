import { notFound } from "next/navigation";
import Link from "next/link";
import { findFieldSpottingById } from "@/modules/field-spotting";
import { formatDate } from "@/lib/utils";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SinglePhotoUploader } from "@/components/photo-uploader";
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
            <span className="text-sm text-anthracite-700 dark:text-stone-300">
              Détail
            </span>
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
        {/* Photo */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">Photo</h2>
          </CardHeader>
          <CardContent>
            <SinglePhotoUploader
              entityId={id}
              currentPhotoUrl={spot.photoUrl}
            />
          </CardContent>
        </Card>

        {/* Details */}
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
              {spot.surface && (
                <div>
                  <dt className="text-caption">Surface estimée</dt>
                  <dd className="mt-0.5 text-sm font-medium text-anthracite-800 dark:text-stone-200">
                    {spot.surface} m²
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

      {/* Pipeline de suivi */}
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
              surface={spot.surface}
              latitude={spot.latitude}
              longitude={spot.longitude}
              notes={spot.notes}
            />
          )}
          {spot.status === "CONVERTI" && (
            <p className="text-center text-sm text-emerald-600 dark:text-emerald-400 font-medium py-2">
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
