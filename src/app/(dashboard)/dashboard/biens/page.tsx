import Link from "next/link";
import { findProperties } from "@/modules/properties";
import { formatPrice, formatSurface } from "@/lib/utils";
import { PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function BiensListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; type?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const { items: properties, total, totalPages } = await findProperties(
    {
      status: params.status,
      type: params.type,
      search: params.search,
    },
    page
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-anthracite-900 sm:text-2xl">Biens</h1>
          <p className="text-sm text-stone-500">{total} bien(s)</p>
        </div>
        <Link href="/dashboard/biens/nouveau">
          <Button className="whitespace-nowrap">
            <span className="hidden sm:inline">Nouveau bien</span>
            <span className="sm:hidden">+ Bien</span>
          </Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <EmptyState
          title="Aucun bien"
          description="Commencez par ajouter votre premier bien immobilier."
          action={
            <Link href="/dashboard/biens/nouveau">
              <Button>Ajouter un bien</Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Mobile: card view */}
          <div className="space-y-3 lg:hidden">
            {properties.map((property) => (
              <Link key={property.id} href={`/dashboard/biens/${property.id}`}>
                <Card className="p-4 active:bg-stone-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-anthracite-800 truncate">{property.title}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {property.district || property.city} · {PROPERTY_TYPE_LABELS[property.type]}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(property.status)}>
                      {PROPERTY_STATUS_LABELS[property.status]}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span className="text-stone-500">{TRANSACTION_TYPE_LABELS[property.transactionType]}</span>
                    {property.surfaceTotal && (
                      <span className="text-stone-500">{formatSurface(property.surfaceTotal)}</span>
                    )}
                    <span className="ml-auto font-semibold text-anthracite-800">
                      {property.transactionType === "LOCATION"
                        ? formatPrice(property.rentMonthly)
                        : formatPrice(property.price)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-stone-400">
                    <span className="font-mono">{property.reference}</span>
                    <span>{property._count.matches} match{property._count.matches !== 1 ? "es" : ""}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Desktop: table view */}
          <Card className="hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Référence</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Titre</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Transaction</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Surface</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Prix/Loyer</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Statut</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-500">Matches</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {properties.map((property) => (
                    <tr key={property.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/biens/${property.id}`} className="font-mono text-xs text-brand-600 hover:underline">
                          {property.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/biens/${property.id}`} className="font-medium text-anthracite-800 hover:text-brand-700">
                          {property.title}
                        </Link>
                        <p className="text-xs text-stone-400">{property.district || property.city}</p>
                      </td>
                      <td className="px-4 py-3 text-stone-600">{PROPERTY_TYPE_LABELS[property.type]}</td>
                      <td className="px-4 py-3 text-stone-600">{TRANSACTION_TYPE_LABELS[property.transactionType]}</td>
                      <td className="px-4 py-3 text-stone-600">{formatSurface(property.surfaceTotal)}</td>
                      <td className="px-4 py-3 font-medium text-anthracite-800">
                        {property.transactionType === "LOCATION" ? formatPrice(property.rentMonthly) : formatPrice(property.price)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusBadgeVariant(property.status)}>
                          {PROPERTY_STATUS_LABELS[property.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center text-stone-500">{property._count.matches}</td>
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
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/dashboard/biens?page=${p}${params.status ? `&status=${params.status}` : ""}`}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                p === page
                  ? "bg-anthracite-900 text-white"
                  : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
