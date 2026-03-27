import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatSurface, formatDate } from "@/lib/utils";
import {
  PROPERTY_TYPE_LABELS,
  TRANSACTION_TYPE_LABELS,
  SEARCH_REQUEST_STATUS_LABELS,
} from "@/lib/constants";
import Link from "next/link";
import { SearchRequestForm } from "./search-request-form";

export default async function ClientSearchRequestPage() {
  const session = await getSession();
  if (!session) return null;

  const searchRequests = await prisma.searchRequest.findMany({
    where: {
      contact: { email: session.email },
    },
    include: {
      _count: { select: { matches: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">
            Ma recherche
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Gerez vos demandes de recherche et definissez vos criteres.
          </p>
        </div>
      </div>

      {/* Existing search requests */}
      {searchRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-anthracite-900 dark:text-stone-100">
            Mes demandes ({searchRequests.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {searchRequests.map((sr) => (
              <Card key={sr.id} hover>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-anthracite-900 dark:text-stone-100">
                          {sr.reference}
                        </p>
                        <Badge variant={getStatusBadgeVariant(sr.status)}>
                          {SEARCH_REQUEST_STATUS_LABELS[sr.status] || sr.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                        Creee le {formatDate(sr.createdAt)}
                      </p>
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                      {sr._count.matches}
                    </div>
                  </div>

                  {/* Criteria summary */}
                  <div className="mt-3 space-y-2">
                    {sr.propertyTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {sr.propertyTypes.map((pt) => (
                          <span
                            key={pt}
                            className="inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600 dark:bg-anthracite-800 dark:text-stone-400"
                          >
                            {PROPERTY_TYPE_LABELS[pt] || pt}
                          </span>
                        ))}
                      </div>
                    )}
                    {sr.transactionType && (
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        <span className="font-medium text-anthracite-700 dark:text-stone-300">
                          Transaction :
                        </span>{" "}
                        {TRANSACTION_TYPE_LABELS[sr.transactionType] ||
                          sr.transactionType}
                      </p>
                    )}
                    {(sr.budgetMin || sr.budgetMax) && (
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        <span className="font-medium text-anthracite-700 dark:text-stone-300">
                          Budget :
                        </span>{" "}
                        {sr.budgetMin ? formatPrice(sr.budgetMin) : "..."} -{" "}
                        {sr.budgetMax ? formatPrice(sr.budgetMax) : "..."}
                      </p>
                    )}
                    {(sr.surfaceMin || sr.surfaceMax) && (
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        <span className="font-medium text-anthracite-700 dark:text-stone-300">
                          Surface :
                        </span>{" "}
                        {sr.surfaceMin ? formatSurface(sr.surfaceMin) : "..."} -{" "}
                        {sr.surfaceMax ? formatSurface(sr.surfaceMax) : "..."}
                      </p>
                    )}
                    {sr.districts.length > 0 && (
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        <span className="font-medium text-anthracite-700 dark:text-stone-300">
                          Secteurs :
                        </span>{" "}
                        {sr.districts.join(", ")}
                      </p>
                    )}
                    {(sr.needsExtraction ||
                      sr.needsTerrace ||
                      sr.needsParking) && (
                      <div className="flex flex-wrap gap-1">
                        {sr.needsExtraction && (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Extraction
                          </span>
                        )}
                        {sr.needsTerrace && (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Terrasse
                          </span>
                        )}
                        {sr.needsParking && (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Parking
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-400 dark:text-stone-500">
                      {sr._count.matches} match
                      {sr._count.matches !== 1 ? "es" : ""}
                    </span>
                    <Link href="/espace-client/matches">
                      <Button variant="ghost" size="sm">
                        Voir les matches
                      </Button>
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* New search request form */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-anthracite-900 dark:text-stone-100">
            {searchRequests.length > 0
              ? "Nouvelle demande de recherche"
              : "Creer une demande de recherche"}
          </h2>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            Definissez vos criteres et nous trouverons les biens qui vous
            correspondent.
          </p>
        </CardHeader>
        <CardContent>
          <SearchRequestForm />
        </CardContent>
      </Card>
    </div>
  );
}
