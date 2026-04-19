import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { formatPrice } from "@/lib/utils";
import { PARIS_DISTRICTS } from "@/lib/constants";

interface DistrictStats {
  district: string;
  count: number;
  avgPricePerSqm: number | null;
  avgRentPerSqm: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  avgSurface: number | null;
  totalProperties: number;
  activeProperties: number;
}

export default async function MarketStatsPage() {
  // Get all properties with price and surface data
  const properties = await prisma.property.findMany({
    where: {
      status: { in: ["ACTIF", "EN_NEGOCIATION", "SOUS_COMPROMIS", "VENDU", "LOUE"] },
      district: { not: null },
    },
    select: {
      district: true,
      price: true,
      rentMonthly: true,
      surfaceTotal: true,
      pricePerSqm: true,
      transactionType: true,
      status: true,
      type: true,
    },
  });

  // Compute stats per district
  const districtMap = new Map<string, DistrictStats>();

  for (const dist of PARIS_DISTRICTS) {
    districtMap.set(dist, {
      district: dist,
      count: 0,
      avgPricePerSqm: null,
      avgRentPerSqm: null,
      minPrice: null,
      maxPrice: null,
      avgSurface: null,
      totalProperties: 0,
      activeProperties: 0,
    });
  }

  // Group properties by district
  for (const p of properties) {
    if (!p.district) continue;
    const stats = districtMap.get(p.district);
    if (!stats) continue;
    stats.totalProperties++;
    if (p.status === "ACTIF" || p.status === "EN_NEGOCIATION") stats.activeProperties++;
  }

  // Calculate averages per district
  for (const dist of PARIS_DISTRICTS) {
    const distProperties = properties.filter((p) => p.district === dist);
    const stats = districtMap.get(dist)!;
    stats.count = distProperties.length;

    const withPriceSqm = distProperties.filter((p) => {
      if (p.pricePerSqm) return true;
      if (p.price && p.surfaceTotal && p.surfaceTotal > 0 && p.transactionType === "VENTE") return true;
      return false;
    });
    if (withPriceSqm.length > 0) {
      const total = withPriceSqm.reduce((sum, p) => {
        const ppsqm = p.pricePerSqm || (p.price && p.surfaceTotal ? p.price / p.surfaceTotal : 0);
        return sum + ppsqm;
      }, 0);
      stats.avgPricePerSqm = Math.round(total / withPriceSqm.length);
    }

    const withRent = distProperties.filter((p) => p.rentMonthly && p.surfaceTotal && p.surfaceTotal > 0);
    if (withRent.length > 0) {
      const total = withRent.reduce((sum, p) => sum + (p.rentMonthly! / p.surfaceTotal!), 0);
      stats.avgRentPerSqm = Math.round(total / withRent.length);
    }

    const withPrice = distProperties.filter((p) => p.price);
    if (withPrice.length > 0) {
      stats.minPrice = Math.min(...withPrice.map((p) => p.price!));
      stats.maxPrice = Math.max(...withPrice.map((p) => p.price!));
    }

    const withSurface = distProperties.filter((p) => p.surfaceTotal);
    if (withSurface.length > 0) {
      stats.avgSurface = Math.round(withSurface.reduce((sum, p) => sum + p.surfaceTotal!, 0) / withSurface.length);
    }
  }

  const allStats = Array.from(districtMap.values());
  const totalProperties = properties.length;
  const avgPriceAll = allStats.filter((s) => s.avgPricePerSqm).length > 0
    ? Math.round(allStats.filter((s) => s.avgPricePerSqm).reduce((sum, s) => sum + s.avgPricePerSqm!, 0) / allStats.filter((s) => s.avgPricePerSqm).length)
    : 0;
  const avgRentAll = allStats.filter((s) => s.avgRentPerSqm).length > 0
    ? Math.round(allStats.filter((s) => s.avgRentPerSqm).reduce((sum, s) => sum + s.avgRentPerSqm!, 0) / allStats.filter((s) => s.avgRentPerSqm).length)
    : 0;
  const maxPricePerSqm = Math.max(...allStats.filter((s) => s.avgPricePerSqm).map((s) => s.avgPricePerSqm!), 1);

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Veille"
        title="Marché"
        description="Prix au m² par arrondissement — données issues de votre portefeuille."
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
          </svg>
        }
      />

      {/* Global KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Biens analyses"
          value={totalProperties}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75" />
            </svg>
          }
        />
        <StatCard
          label="Prix moyen / m² (vente)"
          value={avgPriceAll > 0 ? `${avgPriceAll.toLocaleString("fr-FR")} €` : "—"}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Loyer moyen / m² / mois"
          value={avgRentAll > 0 ? `${avgRentAll.toLocaleString("fr-FR")} €` : "—"}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          }
        />
        <StatCard
          label="Arrondissements couverts"
          value={`${allStats.filter((s) => s.count > 0).length} / 20`}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
          }
        />
      </div>

      {/* District Grid */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-anthracite-900 dark:text-stone-100">
            Prix par arrondissement
          </h2>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 dark:border-stone-700/50">
                  <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Arrondissement</th>
                  <th className="px-4 py-3 text-right font-medium text-stone-500 dark:text-stone-400">Biens</th>
                  <th className="px-4 py-3 text-right font-medium text-stone-500 dark:text-stone-400">Prix / m²</th>
                  <th className="hidden px-4 py-3 text-right font-medium text-stone-500 dark:text-stone-400 sm:table-cell">Loyer / m² / mois</th>
                  <th className="hidden px-4 py-3 text-right font-medium text-stone-500 dark:text-stone-400 md:table-cell">Surface moy.</th>
                  <th className="hidden px-4 py-3 text-right font-medium text-stone-500 dark:text-stone-400 lg:table-cell">Fourchette prix</th>
                  <th className="px-4 py-3 font-medium text-stone-500 dark:text-stone-400">Niveau</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
                {allStats.map((stats) => {
                  const barWidth = stats.avgPricePerSqm ? (stats.avgPricePerSqm / maxPricePerSqm) * 100 : 0;
                  const barColor = stats.avgPricePerSqm
                    ? stats.avgPricePerSqm >= avgPriceAll * 1.3
                      ? "bg-red-400 dark:bg-red-500"
                      : stats.avgPricePerSqm >= avgPriceAll * 0.8
                        ? "bg-amber-400 dark:bg-amber-500"
                        : "bg-emerald-400 dark:bg-emerald-500"
                    : "bg-stone-200 dark:bg-stone-700";

                  return (
                    <tr key={stats.district} className="transition-colors hover:bg-stone-50 dark:hover:bg-anthracite-800/50">
                      <td className="px-4 py-3 font-medium text-anthracite-800 dark:text-stone-200">
                        {stats.district}
                      </td>
                      <td className="px-4 py-3 text-right text-anthracite-700 dark:text-stone-300">
                        {stats.count > 0 ? stats.count : <span className="text-stone-300 dark:text-stone-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-anthracite-900 dark:text-stone-100">
                        {stats.avgPricePerSqm
                          ? `${stats.avgPricePerSqm.toLocaleString("fr-FR")} €`
                          : <span className="text-stone-300 dark:text-stone-600">—</span>}
                      </td>
                      <td className="hidden px-4 py-3 text-right text-anthracite-700 sm:table-cell dark:text-stone-300">
                        {stats.avgRentPerSqm
                          ? `${stats.avgRentPerSqm.toLocaleString("fr-FR")} €`
                          : <span className="text-stone-300 dark:text-stone-600">—</span>}
                      </td>
                      <td className="hidden px-4 py-3 text-right text-anthracite-700 md:table-cell dark:text-stone-300">
                        {stats.avgSurface
                          ? `${stats.avgSurface} m²`
                          : <span className="text-stone-300 dark:text-stone-600">—</span>}
                      </td>
                      <td className="hidden px-4 py-3 text-right text-xs text-stone-500 lg:table-cell dark:text-stone-400">
                        {stats.minPrice && stats.maxPrice
                          ? `${formatPrice(stats.minPrice)} — ${formatPrice(stats.maxPrice)}`
                          : <span className="text-stone-300 dark:text-stone-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                          <div
                            className={`h-full rounded-full transition-all ${barColor}`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 dark:text-stone-400">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          Sous la moyenne
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          Dans la moyenne
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          Au-dessus de la moyenne
        </div>
        <span className="ml-auto italic">
          Donnees calculees a partir de votre portefeuille ({totalProperties} biens)
        </span>
      </div>
    </div>
  );
}
