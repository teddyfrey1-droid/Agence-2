import Link from "next/link";
import Image from "next/image";
import { findProperties } from "@/modules/properties";
import { formatPrice, formatSurface, formatRelativeDate } from "@/lib/utils";
import { PROPERTY_TYPE_LABELS, PROPERTY_STATUS_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { InlineStatusSelect } from "@/components/inline-status-select";

const SORT_OPTIONS = [
  { value: "newest", label: "Plus récent" },
  { value: "oldest", label: "Plus ancien" },
  { value: "updated", label: "Dernière modif." },
];

export default async function BiensListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; type?: string; search?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const sort = params.sort || "newest";
  const { items: properties, total, totalPages } = await findProperties(
    { status: params.status, type: params.type, search: params.search, sort },
    page
  );

  const hasFilters = !!(params.status || params.type || params.search);

  function sortHref(s: string) {
    const sp = new URLSearchParams();
    if (params.status) sp.set("status", params.status);
    if (params.type) sp.set("type", params.type);
    if (params.search) sp.set("search", params.search);
    sp.set("sort", s);
    return `/dashboard/biens?${sp.toString()}`;
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Biens"
        description={`${total} bien${total !== 1 ? "s" : ""} au total dans votre portefeuille.`}
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
          </svg>
        }
        actions={
          <>
            <a href="/api/export?type=properties" download>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                CSV
              </Button>
            </a>
            <Link href="/dashboard/biens/nouveau">
              <Button className="whitespace-nowrap">
                <span className="hidden sm:inline">Nouveau bien</span>
                <span className="sm:hidden">+ Bien</span>
              </Button>
            </Link>
          </>
        }
      />

      <FilterBar
        basePath="/dashboard/biens"
        searchPlaceholder="Rechercher un bien..."
        filters={[
          { name: "status", label: "Statut", options: Object.entries(PROPERTY_STATUS_LABELS).map(([value, label]) => ({ value, label })) },
          { name: "type", label: "Type", options: Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({ value, label })) },
        ]}
        currentParams={params}
      />

      {/* Sort bar — luxe segmented control */}
      <div className="flex items-center gap-3 text-xs">
        <span className="font-medium uppercase tracking-[0.14em] text-stone-400 dark:text-stone-500">
          Trier
        </span>
        <div className="inline-flex items-center gap-0.5 rounded-full border border-stone-200/70 bg-stone-50/60 p-1 dark:border-anthracite-800 dark:bg-anthracite-900/60">
          {SORT_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={sortHref(opt.value)}
              className={`rounded-full px-3.5 py-1 font-medium transition-all duration-200 ${
                sort === opt.value
                  ? "bg-white text-anthracite-900 shadow-card dark:bg-anthracite-700 dark:text-stone-100"
                  : "text-stone-500 hover:text-anthracite-800 dark:text-stone-400 dark:hover:text-stone-200"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

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
          {/* Mobile: card view with thumbnail */}
          <div className="space-y-3 lg:hidden">
            {properties.map((property) => {
              const thumb = property.media[0]?.url;
              return (
                <Link key={property.id} href={`/dashboard/biens/${property.id}`}>
                  <Card className="p-3 active:bg-stone-50 transition-colors dark:active:bg-anthracite-800" hover>
                    <div className="flex gap-3">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-stone-100 dark:bg-anthracite-800">
                        {thumb ? (
                          <Image
                            src={thumb}
                            alt={property.title}
                            fill
                            sizes="80px"
                            className="object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-stone-300 dark:text-stone-700">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-mono text-[10px] tracking-wider text-stone-400 dark:text-stone-500">
                              {property.reference}
                            </p>
                            <p className="mt-0.5 truncate text-sm font-semibold text-anthracite-800 dark:text-stone-200">
                              {property.title}
                            </p>
                            <p className="text-xs text-stone-500 dark:text-stone-400">
                              {property.district || property.city} · {PROPERTY_TYPE_LABELS[property.type] || property.type}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-xs">
                          <span className="text-stone-500 dark:text-stone-400">
                            {TRANSACTION_TYPE_LABELS[property.transactionType]}
                          </span>
                          {property.surfaceTotal && (
                            <span className="text-stone-500 dark:text-stone-400">
                              {formatSurface(property.surfaceTotal)}
                            </span>
                          )}
                          <span className="ml-auto font-display text-sm font-bold tabular-nums text-anthracite-900 dark:text-stone-100">
                            {property.transactionType === "LOCATION"
                              ? formatPrice(property.rentMonthly)
                              : formatPrice(property.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2.5 dark:border-anthracite-800">
                      <div onClick={(e) => e.stopPropagation()}>
                        <InlineStatusSelect
                          propertyId={property.id}
                          currentStatus={property.status}
                          isCoMandat={property.isCoMandat}
                        />
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-stone-400 dark:text-stone-500">
                        {property._count.matches > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                            <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 8 8" aria-hidden="true">
                              <circle cx="4" cy="4" r="3" />
                            </svg>
                            {property._count.matches}
                          </span>
                        )}
                        <span>{formatRelativeDate(property.updatedAt)}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Desktop: table view with thumbnails */}
          <Card className="hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200/70 bg-stone-50/60 dark:border-anthracite-800 dark:bg-anthracite-800/40">
                    <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">Bien</th>
                    <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">Type</th>
                    <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">Surface</th>
                    <th className="px-4 py-3 text-right text-[10.5px] font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">Prix / Loyer</th>
                    <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">Statut</th>
                    <th className="px-4 py-3 text-center text-[10.5px] font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">Matches</th>
                    <th className="px-4 py-3 text-right text-[10.5px] font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">MAJ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-anthracite-800">
                  {properties.map((property) => {
                    const thumb = property.media[0]?.url;
                    const matches = property._count.matches;
                    return (
                      <tr
                        key={property.id}
                        className="group/row transition-colors hover:bg-brand-50/40 dark:hover:bg-brand-900/10"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/dashboard/biens/${property.id}`}
                            className="flex items-center gap-3"
                          >
                            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-stone-100 ring-1 ring-stone-200/70 dark:bg-anthracite-800 dark:ring-anthracite-700">
                              {thumb ? (
                                <Image
                                  src={thumb}
                                  alt=""
                                  fill
                                  sizes="48px"
                                  className="object-cover transition-transform duration-300 group-hover/row:scale-105"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-stone-300 dark:text-stone-700">
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-mono text-[10px] tracking-wider text-stone-400 dark:text-stone-500">
                                {property.reference}
                              </p>
                              <p className="mt-0.5 truncate font-medium text-anthracite-800 transition-colors group-hover/row:text-brand-700 dark:text-stone-200 dark:group-hover/row:text-brand-400">
                                {property.title}
                              </p>
                              <p className="text-xs text-stone-500 dark:text-stone-400">
                                {property.district || property.city}
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-anthracite-800 dark:text-stone-200">
                            {PROPERTY_TYPE_LABELS[property.type] || property.type}
                          </p>
                          <p className="text-xs text-stone-400 dark:text-stone-500">
                            {TRANSACTION_TYPE_LABELS[property.transactionType]}
                          </p>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-stone-600 dark:text-stone-400">
                          {formatSurface(property.surfaceTotal)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-display text-base font-semibold tabular-nums text-anthracite-900 dark:text-stone-100">
                            {property.transactionType === "LOCATION" ? formatPrice(property.rentMonthly) : formatPrice(property.price)}
                          </p>
                          {property.transactionType === "LOCATION" && (
                            <p className="text-[10px] text-stone-400 dark:text-stone-500">/ mois</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <InlineStatusSelect
                            propertyId={property.id}
                            currentStatus={property.status}
                            isCoMandat={property.isCoMandat}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {matches > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 8 8" aria-hidden="true">
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                              {matches}
                            </span>
                          ) : (
                            <span className="text-stone-300 dark:text-stone-600">—</span>
                          )}
                        </td>
                        <td
                          className="px-4 py-3 text-right text-xs text-stone-400 dark:text-stone-500"
                          title={property.updatedAt ? new Date(property.updatedAt).toLocaleString("fr-FR") : ""}
                        >
                          {formatRelativeDate(property.updatedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath="/dashboard/biens" params={{ status: params.status, type: params.type, search: params.search, sort }} />
    </div>
  );
}
