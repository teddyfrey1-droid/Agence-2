"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS, PARIS_DISTRICTS, FIELD_SPOTTING_STATUS_LABELS } from "@/lib/constants";

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
  isCoMandat?: boolean;
  media?: { url: string }[];
}

interface MapSpotting {
  id: string;
  address: string;
  city: string;
  zipCode: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  photoUrl: string | null;
  status: string;
  propertyType: string | null;
  surface: number | null;
  notes: string | null;
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

type Layer = "biens" | "terrain" | "tous";

export default function CartePage() {
  const mapRef = useRef<HTMLDivElement>(null);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const leafletRef = useRef<any>(null);
  const drawLayerRef = useRef<any>(null);
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const [properties, setProperties] = useState<MapProperty[]>([]);
  const [spottings, setSpottings] = useState<MapSpotting[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [activeLayer, setActiveLayer] = useState<Layer>("tous");
  type DrawMode = "off" | "rect" | "circle" | "free";
  const [drawMode, setDrawMode] = useState<DrawMode>("off");
  // Generic shape: polygon points used for point-in-polygon test
  const [drawnPolygon, setDrawnPolygon] = useState<{ lat: number; lng: number }[] | null>(null);
  const drawStartRef = useRef<{ lat: number; lng: number } | null>(null);
  const drawShapeRef = useRef<any>(null);
  const freePointsRef = useRef<{ lat: number; lng: number }[]>([]);

  // Load data
  useEffect(() => {
    (async () => {
      try {
        const [propRes, spotRes] = await Promise.all([
          fetch("/api/properties?published=true"),
          fetch("/api/field-spotting?perPage=200"),
        ]);
        if (propRes.ok) {
          const data = await propRes.json();
          setProperties(data.items || []);
        }
        if (spotRes.ok) {
          const data = await spotRes.json();
          setSpottings(data.items || []);
        }
      } catch { /* */ }
      finally { setLoading(false); }
    })();
  }, []);

  // Filter properties
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

  // Point-in-polygon (ray casting) for freehand; bounding box for rect/circle
  const inDrawnArea = useCallback((lat: number | null, lng: number | null) => {
    if (!drawnPolygon || drawnPolygon.length < 3 || !lat || !lng) return true;
    // Ray casting algorithm
    let inside = false;
    const pts = drawnPolygon;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i].lng, yi = pts[i].lat;
      const xj = pts[j].lng, yj = pts[j].lat;
      const intersect = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }, [drawnPolygon]);

  const propsWithCoords = filtered.filter((p) => p.latitude && p.longitude && inDrawnArea(p.latitude, p.longitude));
  const spotsWithCoords = spottings.filter((s) => s.latitude && s.longitude && inDrawnArea(s.latitude, s.longitude));

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

    const initMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as any).L;
      if (!L) return;
      leafletRef.current = L;

      const isDark = document.documentElement.classList.contains("dark");
      const tileUrl = isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      const map = L.map(mapRef.current, { zoomControl: false }).setView([48.8566, 2.3522], 12);
      L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">Carto</a>',
        maxZoom: 19,
      }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapInstanceRef.current = map;
      drawLayerRef.current = L.layerGroup().addTo(map);
      setMapReady(true);
      // Ensure tiles render correctly after the container reaches its final size
      setTimeout(() => map.invalidateSize(), 150);
      setTimeout(() => map.invalidateSize(), 500);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).L) {
      initMap();
    } else {
      let script = document.getElementById("leaflet-js") as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", initMap);
    }

    // React-to-resize: some flex layouts mount the container with 0px height
    const ro = new ResizeObserver(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    });
    if (mapRef.current) ro.observe(mapRef.current);

    return () => {
      ro.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Helper: generate polygon points from a circle
  function circleToPolygon(center: { lat: number; lng: number }, radiusLat: number, radiusLng: number, n = 36) {
    const pts: { lat: number; lng: number }[] = [];
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i) / n;
      pts.push({ lat: center.lat + radiusLat * Math.sin(angle), lng: center.lng + radiusLng * Math.cos(angle) });
    }
    return pts;
  }

  // Draw mode handlers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    const shapeStyle = { color: "#886a4b", weight: 2, fillOpacity: 0.15, dashArray: "6" };

    if (drawMode === "off") {
      map.dragging.enable();
      map.getContainer().style.cursor = "";
      return;
    }

    map.dragging.disable();
    map.getContainer().style.cursor = "crosshair";

    const onDown = (e: any) => {
      drawStartRef.current = { lat: e.latlng.lat, lng: e.latlng.lng };
      if (drawShapeRef.current) { drawShapeRef.current.remove(); drawShapeRef.current = null; }
      if (drawMode === "free") {
        freePointsRef.current = [{ lat: e.latlng.lat, lng: e.latlng.lng }];
      }
    };

    const onMove = (e: any) => {
      if (!drawStartRef.current) return;
      const cur = { lat: e.latlng.lat, lng: e.latlng.lng };

      if (drawMode === "rect") {
        const bounds = L.latLngBounds([drawStartRef.current.lat, drawStartRef.current.lng], [cur.lat, cur.lng]);
        if (drawShapeRef.current) drawShapeRef.current.setBounds(bounds);
        else drawShapeRef.current = L.rectangle(bounds, shapeStyle).addTo(map);
      } else if (drawMode === "circle") {
        const dx = cur.lat - drawStartRef.current.lat;
        const dy = cur.lng - drawStartRef.current.lng;
        const radius = Math.sqrt(dx * dx + dy * dy) * 111320;
        if (drawShapeRef.current) drawShapeRef.current.setRadius(radius);
        else drawShapeRef.current = L.circle([drawStartRef.current.lat, drawStartRef.current.lng], { radius, ...shapeStyle }).addTo(map);
      } else if (drawMode === "free") {
        freePointsRef.current.push(cur);
        if (drawShapeRef.current) drawShapeRef.current.setLatLngs(freePointsRef.current.map(p => [p.lat, p.lng]));
        else drawShapeRef.current = L.polyline(freePointsRef.current.map(p => [p.lat, p.lng]), { ...shapeStyle, fill: true }).addTo(map);
      }
    };

    const onUp = (e: any) => {
      if (!drawStartRef.current) return;
      const cur = { lat: e.latlng.lat, lng: e.latlng.lng };

      if (drawMode === "rect") {
        const s = drawStartRef.current;
        const pts = [
          { lat: s.lat, lng: s.lng }, { lat: s.lat, lng: cur.lng },
          { lat: cur.lat, lng: cur.lng }, { lat: cur.lat, lng: s.lng },
        ];
        setDrawnPolygon(pts);
      } else if (drawMode === "circle") {
        const dx = cur.lat - drawStartRef.current.lat;
        const dy = cur.lng - drawStartRef.current.lng;
        const rLat = Math.sqrt(dx * dx + dy * dy);
        const rLng = rLat;
        setDrawnPolygon(circleToPolygon(drawStartRef.current, rLat, rLng));
      } else if (drawMode === "free") {
        if (freePointsRef.current.length > 2) {
          setDrawnPolygon([...freePointsRef.current]);
          // Close the polygon visually
          if (drawShapeRef.current) {
            drawShapeRef.current.setLatLngs([...freePointsRef.current, freePointsRef.current[0]].map(p => [p.lat, p.lng]));
          }
        }
      }
      drawStartRef.current = null;
      setDrawMode("off");
    };

    map.on("mousedown", onDown);
    map.on("mousemove", onMove);
    map.on("mouseup", onUp);
    // Touch
    map.on("touchstart", (e: any) => { if (e.originalEvent.touches?.length === 1) onDown({ latlng: e.latlng }); });
    map.on("touchmove", (e: any) => { if (e.originalEvent.touches?.length === 1) onMove({ latlng: e.latlng }); });
    map.on("touchend", (e: any) => { if (drawStartRef.current) onUp({ latlng: e.latlng || drawStartRef.current }); });

    return () => {
      map.off("mousedown", onDown); map.off("mousemove", onMove); map.off("mouseup", onUp);
      map.off("touchstart"); map.off("touchmove"); map.off("touchend");
      map.dragging.enable();
      map.getContainer().style.cursor = "";
    };
  }, [drawMode, mapReady]);

  // Update markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !leafletRef.current) return;
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    // Property markers
    if (activeLayer === "biens" || activeLayer === "tous") {
      for (const p of propsWithCoords) {
        const color = COLOR_MAP[p.transactionType] || "#886a4b";
        const photoHtml = p.media?.[0]?.url
          ? `<img src="${p.media[0].url}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;margin-bottom:6px;" />`
          : "";
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:28px;height:28px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const priceStr = p.transactionType === "LOCATION"
          ? (p.rentMonthly ? `${fmtPrice(p.rentMonthly)}/mois` : fmtPrice(p.price))
          : fmtPrice(p.price);
        const popup = `
          <div style="font-family:system-ui;min-width:200px;max-width:260px;">
            ${photoHtml}
            <p style="font-weight:600;font-size:13px;margin:0 0 4px;">${p.title}</p>
            <p style="color:#888;font-size:11px;margin:0 0 2px;">${p.district || p.city}${p.address ? " — " + p.address : ""}</p>
            <p style="font-weight:700;font-size:14px;margin:4px 0 2px;color:#886a4b;">${priceStr}</p>
            ${p.surfaceTotal ? `<p style="color:#888;font-size:11px;margin:0;">${p.surfaceTotal} m²</p>` : ""}
            <p style="color:#999;font-size:10px;margin:4px 0 0;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:4px;"></span>${TRANSACTION_TYPE_LABELS[p.transactionType] || p.transactionType} — ${PROPERTY_TYPE_LABELS[p.type] || p.type}</p>
            ${p.isCoMandat ? '<p style="color:#2563eb;font-size:10px;font-weight:600;margin:4px 0 0;">Co-mandat</p>' : ""}
            <a href="/dashboard/biens/${p.id}" style="display:block;margin-top:8px;font-size:11px;color:#886a4b;text-decoration:none;font-weight:600;">Voir le bien →</a>
          </div>`;
        const marker = L.marker([p.latitude!, p.longitude!], { icon }).bindPopup(popup).addTo(map);
        markersRef.current.push(marker);
      }
    }

    // Field spotting markers
    if (activeLayer === "terrain" || activeLayer === "tous") {
      for (const s of spotsWithCoords) {
        const photoHtml = s.photoUrl
          ? `<img src="${s.photoUrl}" style="width:100%;height:80px;object-fit:cover;border-radius:6px;margin-bottom:6px;" />`
          : "";
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:28px;height:28px;background:#ef4444;border:3px solid white;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
          </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const popup = `
          <div style="font-family:system-ui;min-width:200px;max-width:260px;">
            ${photoHtml}
            <p style="font-size:10px;color:#ef4444;font-weight:700;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Repérage terrain</p>
            <p style="font-weight:600;font-size:13px;margin:0 0 4px;">${s.address}</p>
            <p style="color:#888;font-size:11px;margin:0 0 2px;">${s.city} ${s.zipCode || ""} ${s.district ? "· " + s.district : ""}</p>
            <p style="color:#888;font-size:11px;margin:4px 0 0;">Statut : <strong>${FIELD_SPOTTING_STATUS_LABELS[s.status] || s.status}</strong></p>
            ${s.propertyType ? `<p style="color:#888;font-size:11px;margin:2px 0 0;">${PROPERTY_TYPE_LABELS[s.propertyType] || s.propertyType}${s.surface ? ` · ${s.surface} m²` : ""}</p>` : ""}
            ${s.notes ? `<p style="color:#666;font-size:11px;margin:4px 0 0;font-style:italic;">${s.notes.substring(0, 100)}${s.notes.length > 100 ? "..." : ""}</p>` : ""}
            <a href="/dashboard/terrain/${s.id}" style="display:block;margin-top:8px;font-size:11px;color:#ef4444;text-decoration:none;font-weight:600;">Voir le repérage →</a>
          </div>`;
        const marker = L.marker([s.latitude!, s.longitude!], { icon }).bindPopup(popup).addTo(map);
        markersRef.current.push(marker);
      }
    }
  }, [propsWithCoords, spotsWithCoords, mapReady, activeLayer]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (drawnPolygon ? 1 : 0);
  const selectClass = "h-9 rounded-lg border border-stone-300 bg-white px-2.5 text-sm text-anthracite-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-anthracite-700 dark:bg-anthracite-900 dark:text-stone-200";
  const inputClass = "h-9 w-full rounded-lg border border-stone-300 bg-white px-2.5 text-sm text-anthracite-800 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-anthracite-700 dark:bg-anthracite-900 dark:text-stone-200 dark:placeholder:text-stone-500";

  function clearDrawnZone() {
    setDrawnPolygon(null);
    if (drawShapeRef.current) {
      drawShapeRef.current.remove();
      drawShapeRef.current = null;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">Carte</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {loading ? "Chargement..." : (
              <>
                {(activeLayer === "biens" || activeLayer === "tous") && `${propsWithCoords.length} bien${propsWithCoords.length !== 1 ? "s" : ""}`}
                {activeLayer === "tous" && " · "}
                {(activeLayer === "terrain" || activeLayer === "tous") && `${spotsWithCoords.length} repérage${spotsWithCoords.length !== 1 ? "s" : ""}`}
                {drawnPolygon && " (zone filtrée)"}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Layer toggle */}
          <div className="flex rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
            {(["tous", "biens", "terrain"] as Layer[]).map((l) => (
              <button
                key={l}
                onClick={() => setActiveLayer(l)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                  activeLayer === l
                    ? "bg-anthracite-900 text-white dark:bg-brand-500 dark:text-anthracite-950"
                    : "bg-white text-stone-600 hover:bg-stone-50 dark:bg-[#1a1a1f] dark:text-stone-400"
                }`}
              >
                {l === "tous" ? "Tous" : l === "biens" ? "Biens" : "Terrain"}
              </button>
            ))}
          </div>

          {/* Draw zone buttons */}
          <div className="flex rounded-lg border border-stone-200 dark:border-anthracite-800 overflow-hidden">
            {([
              { mode: "rect" as DrawMode, label: "Rectangle", icon: "M4 5h16v14H4z" },
              { mode: "circle" as DrawMode, label: "Cercle", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" },
              { mode: "free" as DrawMode, label: "Libre", icon: "M3 17c3-3 5-8 9-8s5 5 9 2" },
            ]).map(({ mode, label, icon }) => (
              <button
                key={mode}
                onClick={() => {
                  if (drawMode === mode) { setDrawMode("off"); }
                  else { clearDrawnZone(); setDrawMode(mode); }
                }}
                className={`px-2.5 py-1.5 text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  drawMode === mode
                    ? "bg-anthracite-900 text-white dark:bg-brand-500 dark:text-anthracite-950"
                    : "bg-white text-stone-600 hover:bg-stone-50 dark:bg-anthracite-900 dark:text-stone-400"
                }`}
                title={label}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {drawnPolygon && (
            <Button variant="ghost" size="sm" onClick={clearDrawnZone}>
              Effacer zone
            </Button>
          )}

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
              <Button variant="ghost" size="sm" onClick={() => { setFilters(defaultFilters); clearDrawnZone(); }} className="w-full">Réinitialiser</Button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-stone-100 dark:border-stone-800/60 pt-3 text-xs text-stone-500 dark:text-stone-400">
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full" style={{ background: "#886a4b" }} />Vente</div>
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full" style={{ background: "#2563eb" }} />Location</div>
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full" style={{ background: "#d97706" }} />Cession de bail</div>
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full" style={{ background: "#7c3aed" }} />Fond de commerce</div>
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm" style={{ background: "#ef4444" }} />Repérage terrain</div>
          </div>
        </Card>
      )}

      {drawMode !== "off" && (
        <div className="rounded-lg border-2 border-dashed border-brand-400 bg-brand-50 dark:bg-brand-950/20 p-3 text-center text-sm text-brand-700 dark:text-brand-400">
          {drawMode === "rect" && "Dessinez un rectangle sur la carte avec la souris ou le doigt"}
          {drawMode === "circle" && "Dessinez un cercle : cliquez au centre puis glissez pour le rayon"}
          {drawMode === "free" && "Dessinez librement une zone sur la carte avec le doigt ou la souris"}
        </div>
      )}

      <Card className="overflow-hidden">
        <div ref={mapRef} className="h-[calc(100vh-240px)] min-h-[400px] w-full" />
      </Card>
    </div>
  );
}
