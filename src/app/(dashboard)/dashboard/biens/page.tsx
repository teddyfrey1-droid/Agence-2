import Link from "next/link";
import { findProperties } from "@/modules/properties";
import { formatPrice, formatSurface } from "@/lib/utils";
import { PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";

export default async function BiensListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; type?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const { items: properties, total, totalPages } = await findProperties(
    { status: params.status, type: params.type, search: params.search },
    page
  );

  const hasFilters = !!(params.status || params.type || params.search);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">Biens</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">{total} bien(s) au total</p>
        </div>
        <Link href="/dashboard/biens/nouveau">
          <Button>Nouveau bien</Button>
        </Link>
      </div>

      <FilterBar
        basePath="/dashboard/biens"
        searchPlaceholder="Rechercher un bien..."
        filters={[
          { name: "status", label: "Statut", options: Object.entries(PROPERTY_STATUS_LABELS).map(([value, label]) => ({ value, label })) },
          { name: "type", label: "Type", options: Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({ value, label })) },
        ]}
        currentParams={params}
      />

      {properties.length === 0 ? (
        <EmptyState
          title={hasFilters ? "Aucun résultat" : "Aucun bien"}
          description={hasFilters ? "Aucun bien ne correspond à vos filtres." : "Commencez par ajouter votre premier bien immobilier."}
          action={
            hasFilters ? (
              <Link href="/dashboard/biens"><Button variant="secondary">Effacer les filtres</Button></Link>
            ) : (
              <Link href="/dashboard/biens/nouveau"><Button>Ajouter un bien</Button></Link>
            )
          }
        />
      ) : (
        <>
          {/* Mobile card view */}
          <div className="space-y-3 md:hidden">
            {properties.map((property) => (
              <Link key={property.id} href={`/dashboard/biens/${property.id}`}>
                <Card hover className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[10px] text-stone-400 dark:text-stone-500">{property.reference}</p>
                      <p className="mt-0.5 truncate text-sm font-semibold text-anthracite-800 dark:text-stone-200">
                        {property.title}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {property.district || property.city}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(property.status)}>
                      {PROPERTY_STATUS_LABELS[property.status] || property.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                    <span>{PROPERTY_TYPE_LABELS[property.type] || property.type}</span>
                    <span>{TRANSACTION_TYPE_LABELS[property.transactionType]}</span>
                    {property.surfaceTotal && <span>{formatSurface(property.surfaceTotal)}</span>}
                    <span className="font-semibold text-anthracite-800 dark:text-stone-200">
                      {property.transactionType === "LOCATION" ? formatPrice(property.rentMonthly) : formatPrice(property.price)}
                    </span>
                    {property._count.matches > 0 && (
                      <span className="text-brand-600 dark:text-brand-400">{property._count.matches} match{property._count.matches > 1 ? "es" : ""}</span>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Desktop table view */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50 dark:border-stone-700/50 dark:bg-anthracite-800/50">
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Référence</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Titre</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Transaction</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Surface</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Prix/Loyer</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Statut</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Matches</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-700/50">
                  {properties.map((property) => (
                    <tr key={property.id} className="hover:bg-stone-50 dark:hover:bg-anthracite-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/biens/${property.id}`} className="font-mono text-xs text-brand-600 hover:underline dark:text-brand-400">
                          {property.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/biens/${property.id}`} className="font-medium text-anthracite-800 hover:text-brand-700 dark:text-stone-200 dark:hover:text-brand-400">
                          {property.title}
                        </Link>
                        <p className="text-xs text-stone-400 dark:text-stone-500">{property.district || property.city}</p>
                      </td>
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{PROPERTY_TYPE_LABELS[property.type] || property.type}</td>
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{TRANSACTION_TYPE_LABELS[property.transactionType]}</td>
                      <td className="px-4 py-3 text-stone-600 dark:text-stone-400">{formatSurface(property.surfaceTotal)}</td>
                      <td className="px-4 py-3 font-medium text-anthracite-800 dark:text-stone-200">
                        {property.transactionType === "LOCATION" ? formatPrice(property.rentMonthly) : formatPrice(property.price)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusBadgeVariant(property.status)}>
                          {PROPERTY_STATUS_LABELS[property.status] || property.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center text-stone-500 dark:text-stone-400">{property._count.matches}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const qp = new URLSearchParams();
            qp.set("page", String(p));
            if (params.status) qp.set("status", params.status);
            if (params.type) qp.set("type", params.type);
            if (params.search) qp.set("search", params.search);
            return (
              <Link key={p} href={`/dashboard/biens?${qp.toString()}`}
                className={`rounded-lg px-3 py-1.5 text-sm ${p === page
                  ? "bg-anthracite-900 text-white dark:bg-brand-600"
                  : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 dark:bg-anthracite-800 dark:text-stone-300 dark:border-stone-700 dark:hover:bg-anthracite-700"
                }`}
              >{p}</Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
