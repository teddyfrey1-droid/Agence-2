import Link from "next/link";
import { findFieldSpottings } from "@/modules/field-spotting";
import { formatDateShort } from "@/lib/utils";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

const statusLabels: Record<string, string> = {
  REPERE: "Repéré",
  A_QUALIFIER: "À qualifier",
  QUALIFIE: "Qualifié",
  CONVERTI: "Converti",
  REJETE: "Rejeté",
};

export default async function TerrainPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const { items, total } = await findFieldSpottings({ status: params.status }, page);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-anthracite-900">Repérages terrain</h1>
          <p className="text-sm text-stone-500">{total} repérage(s)</p>
        </div>
        <Link href="/dashboard/terrain/nouveau">
          <Button>Nouveau repérage</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Aucun repérage" description="Ajoutez un repérage terrain depuis le bureau ou le mobile." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((spot) => (
            <Card key={spot.id} hover className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-anthracite-800">{spot.address}</p>
                  <p className="text-xs text-stone-400">{spot.city} {spot.zipCode}</p>
                </div>
                <Badge variant={getStatusBadgeVariant(spot.status)}>
                  {statusLabels[spot.status] || spot.status}
                </Badge>
              </div>
              {spot.propertyType && (
                <p className="mt-2 text-xs text-stone-500">
                  {PROPERTY_TYPE_LABELS[spot.propertyType] || spot.propertyType}
                  {spot.surface && ` · ${spot.surface} m²`}
                </p>
              )}
              {spot.notes && (
                <p className="mt-2 text-sm text-anthracite-600 line-clamp-2">{spot.notes}</p>
              )}
              <div className="mt-3 flex items-center justify-between text-xs text-stone-400">
                <span>
                  {spot.assignedTo
                    ? `${spot.assignedTo.firstName} ${spot.assignedTo.lastName}`
                    : "Non assigné"}
                </span>
                <span>{formatDateShort(spot.createdAt)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
