import Link from "next/link";
import { findFieldSpottings } from "@/modules/field-spotting";
import { formatDateShort } from "@/lib/utils";
import { PROPERTY_TYPE_LABELS, FIELD_SPOTTING_STATUS_LABELS } from "@/lib/constants";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { TerrainKanban } from "@/components/terrain-kanban";

export default async function TerrainPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; view?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const view = params.view || "kanban";

  // For kanban, load all items (no pagination); for list, paginate
  const isKanban = view === "kanban";
  const { items, total, totalPages } = await findFieldSpottings(
    { status: params.status },
    isKanban ? 1 : page,
    isKanban ? 500 : 20
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Repérages"
        title="Terrain"
        description={`${total} repérage${total !== 1 ? "s" : ""} enregistré${total !== 1 ? "s" : ""}`}
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        }
        actions={
          <>
            {/* View toggle */}
            <div className="flex rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
              <Link
                href={`/dashboard/terrain?view=kanban${params.status ? `&status=${params.status}` : ""}`}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  isKanban
                    ? "bg-anthracite-900 text-white dark:bg-brand-500 dark:text-anthracite-950"
                    : "bg-white text-stone-600 hover:bg-stone-50 dark:bg-anthracite-800 dark:text-stone-400"
                }`}
              >
                Pipeline
              </Link>
              <Link
                href={`/dashboard/terrain?view=list${params.status ? `&status=${params.status}` : ""}`}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  !isKanban
                    ? "bg-anthracite-900 text-white dark:bg-brand-500 dark:text-anthracite-950"
                    : "bg-white text-stone-600 hover:bg-stone-50 dark:bg-anthracite-800 dark:text-stone-400"
                }`}
              >
                Liste
              </Link>
            </div>
            <Link href="/dashboard/terrain/nouveau">
              <Button>Nouveau repérage</Button>
            </Link>
          </>
        }
      />

      {items.length === 0 ? (
        <EmptyState title="Aucun repérage" description="Ajoutez un repérage terrain depuis le bureau ou le mobile." />
      ) : isKanban ? (
        <TerrainKanban items={items} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((spot) => (
              <Link key={spot.id} href={`/dashboard/terrain/${spot.id}`}>
                <Card hover className="overflow-hidden">
                  {spot.photoUrl && (
                    <div className="h-36 w-full">
                      <img src={spot.photoUrl} alt={spot.address} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-anthracite-800 dark:text-stone-200">{spot.address}</p>
                        <p className="text-xs text-stone-400 dark:text-stone-500">{spot.city} {spot.zipCode}</p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(spot.status)}>
                        {FIELD_SPOTTING_STATUS_LABELS[spot.status] || spot.status}
                      </Badge>
                    </div>
                    {spot.propertyType && (
                      <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                        {PROPERTY_TYPE_LABELS[spot.propertyType] || spot.propertyType}
                        {spot.surface && ` · ${spot.surface} m²`}
                      </p>
                    )}
                    {spot.notes && (
                      <p className="mt-2 text-sm text-anthracite-600 dark:text-stone-300 line-clamp-2">{spot.notes}</p>
                    )}
                    <div className="mt-3 flex items-center justify-between text-xs text-stone-400 dark:text-stone-500">
                      <span>
                        {spot.assignedTo
                          ? `${spot.assignedTo.firstName} ${spot.assignedTo.lastName}`
                          : "Non assigné"}
                      </span>
                      <span>{formatDateShort(spot.createdAt)}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} basePath="/dashboard/terrain" params={{ status: params.status, view: "list" }} />
        </>
      )}
    </div>
  );
}
