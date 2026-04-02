"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS, PARIS_DISTRICTS } from "@/lib/constants";

interface MapProperty {
  id: string;
  title: string;
  type: string;
  transactionType: string;
  district: string | null;
  city: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  price: number | null;
  rentMonthly: number | null;
  surfaceTotal: number | null;
}

interface Filters {
  transactionType: string;
  propertyType: string;
  priceMin: string;
  priceMax: string;
  surfaceMin: string;
  surfaceMax: string;
  district: string;
}

const defaultFilters: Filters = {
  transactionType: "",
  propertyType: "",
  priceMin: "",
  priceMax: "",
  surfaceMin: "",
  surfaceMax: "",
  district: "",
};

function fmtPrice(val: number | null): string {
  if (!val) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val);
}

const COLOR_MAP: Record<string, string> = {
  VENTE: "#886a4b",
  LOCATION: "#2563eb",
  CESSION_BAIL: "#d97706",
  FOND_DE_COMMERCE: "#7c3aed",
};

export default function CartePage() {
  const mapRef = useRef<HTMLDivElement>(null);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const leafletRef = useRef<any>(null);
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const [properties, setProperties] = useState<MapProperty[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  // Load properties
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/properties?published=true");
        if (res.ok) {
          const data = await res.json();
          setProperties(data.items || []);
        }
      } catch { /* */ }
      finally { setLoading(false); }
    })();
  }, []);

  // Filter
  const filtered = properties.filter((p) => {
    if (filters.transactionType && p.transactionType !== filters.transactionType) return false;
    if (filters.propertyType && p.type !== filters.propertyType) return false;
    if (filters.district && p.district !== filters.district) return false;
    const price = p.transactionType === "LOCATION" ? p.rentMonthly : p.price;
    if (filters.priceMin && (!price || price < Number(filters.priceMin))) return false;
    if (filters.priceMax && (!price || price > Number(filters.priceMax))) return false;
    if (filters.surfaceMin && (!p.surfaceTotal || p.surfaceTotal < Number(filters.surfaceMin))) return false;
    if (filters.surfaceMax && (!p.surfaceTotal || p.surfaceTotal > Number(filters.surfaceMax))) return false;
    return true;
  });
  const withCoords = filtered.filter((p) => p.latitude && p.longitude);

  // Init Leaflet
  useEffect(() => {
    if (mapInstanceRef.current) return;
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      if (!mapRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as any).L;
      leafletRef.current = L;
      const map = L.map(mapRef.current).setView([48.8566, 2.3522], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19,
      }).addTo(map);
      mapInstanceRef.current = map;
      setMapReady(true);
    };
    document.head.appendChild(script);
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !leafletRef.current) return;
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    for (const p of withCoords) {
      const color = COLOR_MAP[p.transactionType] || "#886a4b";
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:26px;height:26px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      const priceStr = p.transactionType === "LOCATION"
        ? (p.rentMonthly ? `${fmtPrice(p.rentMonthly)}/mois` : fmtPrice(p.price))
        : fmtPrice(p.price);
      const popup = `
        <div style="font-family:system-ui;min-width:180px;">
          <p style="font-weight:600;font-size:13px;margin:0 0 4px;">${p.title}</p>
          <p style="color:#666;font-size:11px;margin:0 0 2px;">${p.district || p.city}${p.address ? " — " + p.address : ""}</p>
          <p style="font-weight:700;font-size:13px;margin:4px 0 2px;">${priceStr}</p>
          ${p.surfaceTotal ? `<p style="color:#888;font-size:11px;margin:0;">${p.surfaceTotal} m²</p>` : ""}
          <p style="color:#999;font-size:10px;margin:4px 0 0;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:4px;"></span>${TRANSACTION_TYPE_LABELS[p.transactionType] || p.transactionType} — ${PROPERTY_TYPE_LABELS[p.type] || p.type}</p>
          <a href="/dashboard/biens/${p.id}" style="display:block;margin-top:6px;font-size:11px;color:#886a4b;text-decoration:none;font-weight:500;">Voir le bien →</a>
        </div>`;
      const marker = L.marker([p.latitude!, p.longitude!], { icon }).bindPopup(popup).addTo(map);
      markersRef.current.push(marker);
    }
  }, [withCoords, mapReady]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const selectClass = "h-9 rounded-lg border border-stone-300 bg-white px-2.5 text-sm text-anthracite-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-200";
  const inputClass = "h-9 w-full rounded-lg border border-stone-300 bg-white px-2.5 text-sm text-anthracite-800 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-200 dark:placeholder:text-stone-500";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">Carte</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {loading ? "Chargement..." : `${withCoords.length} bien${withCoords.length !== 1 ? "s" : ""} sur la carte`}
            {filtered.length !== properties.length && ` (${filtered.length} après filtres)`}
          </p>
        </div>
        <Button
          variant={activeFilterCount > 0 ? "primary" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          Filtres{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </Button>
      </div>

      {showFilters && (
        <Card className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">Transaction</label>
              <select value={filters.transactionType} onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })} className={selectClass + " w-full"}>
                <option value="">Toutes</option>
                {Object.entries(TRANSACTION_TYPE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">Type de bien</label>
              <select value={filters.propertyType} onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })} className={selectClass + " w-full"}>
                <option value="">Tous</option>
                {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">Prix min</label>
              <input type="number" value={filters.priceMin} onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })} placeholder="Min €" className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">Prix max</label>
              <input type="number" value={filters.priceMax} onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })} placeholder="Max €" className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">Surface min</label>
              <input type="number" value={filters.surfaceMin} onChange={(e) => setFilters({ ...filters, surfaceMin: e.target.value })} placeholder="Min m²" className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">Surface max</label>
              <input type="number" value={filters.surfaceMax} onChange={(e) => setFilters({ ...filters, surfaceMax: e.target.value })} placeholder="Max m²" className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">Arrondissement</label>
              <select value={filters.district} onChange={(e) => setFilters({ ...filters, district: e.target.value })} className={selectClass + " w-full"}>
                <option value="">Tous</option>
                {PARIS_DISTRICTS.map((d) => (<option key={d} value={d}>{d}</option>))}
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="ghost" size="sm" onClick={() => setFilters(defaultFilters)} className="w-full">Réinitialiser</Button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-3 text-xs text-stone-500 dark:border-stone-700/50 dark:text-stone-400">
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full" style={{ background: "#886a4b" }} />Vente</div>
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full" style={{ background: "#2563eb" }} />Location</div>
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full" style={{ background: "#d97706" }} />Cession de bail</div>
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full" style={{ background: "#7c3aed" }} />Fond de commerce</div>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div ref={mapRef} className="h-[calc(100vh-280px)] min-h-[400px] w-full" />
      </Card>
    </div>
  );
}
