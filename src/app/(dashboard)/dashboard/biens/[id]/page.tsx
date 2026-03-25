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

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await findPropertyById(id);

  if (!property) notFound();

  const features = [
    property.hasExtraction && "Extraction",
    property.hasTerrace && "Terrasse",
    property.hasParking && "Parking",
    property.hasLoadingDock && "Quai de chargement",
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/biens"
              className="text-sm text-stone-400 hover:text-anthracite-700"
            >
              Biens
            </Link>
            <span className="text-stone-300">/</span>
            <span className="text-sm text-anthracite-700">
              {property.reference}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-anthracite-900">
            {property.title}
          </h1>
          <p className="text-sm text-stone-500">
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
                  <dd className="mt-1 text-sm font-medium text-anthracite-800">
                    {PROPERTY_TYPE_LABELS[property.type]}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption">Transaction</dt>
                  <dd className="mt-1 text-sm font-medium text-anthracite-800">
                    {TRANSACTION_TYPE_LABELS[property.transactionType]}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption">Surface</dt>
                  <dd className="mt-1 text-sm font-medium text-anthracite-800">
                    {formatSurface(property.surfaceTotal)}
                  </dd>
                </div>
                {property.floor != null && (
                  <div>
                    <dt className="text-caption">Étage</dt>
                    <dd className="mt-1 text-sm font-medium text-anthracite-800">
                      {property.floor === 0 ? "RDC" : `${property.floor}e`}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-caption">Prix / Loyer</dt>
                  <dd className="mt-1 text-sm font-medium text-anthracite-800">
                    {property.transactionType === "LOCATION"
                      ? `${formatPrice(property.rentMonthly)}/mois`
                      : formatPrice(property.price)}
                  </dd>
                </div>
                {property.charges && (
                  <div>
                    <dt className="text-caption">Charges</dt>
                    <dd className="mt-1 text-sm font-medium text-anthracite-800">
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
                <div className="mt-6 border-t border-stone-100 pt-4">
                  <p className="whitespace-pre-line text-sm text-anthracite-600">
                    {property.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media */}
          {property.media.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="heading-card">Médias ({property.media.length})</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {property.media.map((m) => (
                    <div
                      key={m.id}
                      className="aspect-square overflow-hidden rounded-lg bg-stone-100"
                    >
                      <img
                        src={m.url}
                        alt={m.title || property.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="heading-card">Actions</h2>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Modifier
              </Button>
              <Button variant="outline" className="w-full justify-start">
                {property.isPublished ? "Dépublier" : "Publier"}
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Lancer le matching
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="heading-card">Assignation</h2>
            </CardHeader>
            <CardContent>
              {property.assignedTo ? (
                <p className="text-sm text-anthracite-700">
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
