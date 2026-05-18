"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PROPERTY_TYPE_LABELS,
  TRANSACTION_TYPE_LABELS,
  PARIS_DISTRICTS,
  FIELD_SPOTTING_STATUS_LABELS,
} from "@/lib/constants";
import { haptic } from "@/lib/haptics";
import { useToast } from "@/components/ui/toast";
import {
  PROSPECTION_BRANDS,
  PROSPECTION_MANDATES,
  getBrandById,
  type ProspectionMandate,
} from "@/lib/prospection-data";

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
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(val);
}

const COLOR_MAP: Record<string, string> = {
  VENTE: "#886a4b",
  LOCATION: "#2563eb",
  CESSION_BAIL: "#d97706",
  FOND_DE_COMMERCE: "#7c3aed",
};

type Layer = "biens" | "terrain" | "tous";
type DrawMode = "off" | "rect" | "circle" | "free";

/* eslint-disable @typescript-eslint/no-explicit-any */
type LeafletNs = any;
type LeafletMap = any;
type LeafletLayer = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

type ProspectionView = "map" | "list";

export default function CartePage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletLayer[]>([]);
  const prospectionLayersRef = useRef<LeafletLayer[]>([]);
  const leafletRef = useRef<LeafletNs | null>(null);
  const drawShapeRef = useRef<LeafletLayer | null>(null);
  const userMarkerRef = useRef<LeafletLayer | null>(null);
  const userCircleRef = useRef<LeafletLayer | null>(null);

  const [properties, setProperties] = useState<MapProperty[]>([]);
  const [spottings, setSpottings] = useState<MapSpotting[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [activeLayer, setActiveLayer] = useState<Layer>("tous");
  const [drawMode, setDrawMode] = useState<DrawMode>("off");
  const [drawnPolygon, setDrawnPolygon] = useState<{ lat: number; lng: number }[] | null>(null);
  const [locating, setLocating] = useState(false);

  // ── Prospection mode (mandats de recherche retail) ──
  const [prospectionMode, setProspectionMode] = useState(false);
  const [prospectionView, setProspectionView] = useState<ProspectionView>("map");
  const [prospectionSearch, setProspectionSearch] = useState("");
  const [prospectionBrand, setProspectionBrand] = useState<string>("");
  const [prospectionDistrict, setProspectionDistrict] = useState<string>("");
  const [selectedMandateId, setSelectedMandateId] = useState<string | null>(null);

  const { addToast } = useToast();

  // Load data — best-effort, non-blocking
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [propRes, spotRes] = await Promise.all([
          fetch("/api/properties?published=true"),
          fetch("/api/field-spotting?perPage=200"),
        ]);
        if (cancelled) return;
        if (propRes.ok) {
          const data = await propRes.json();
          setProperties(data.items || []);
        }
        if (spotRes.ok) {
          const data = await spotRes.json();
          setSpottings(data.items || []);
        }
      } catch {
        /* network / auth — leave lists empty */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Filter logic — applied to BOTH layers where the field maps cleanly ──
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
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
  }, [properties, filters]);

  const filteredSpots = useMemo(() => {
    return spottings.filter((s) => {
      // Property-type filter applies if the spot has the field set
      if (filters.propertyType && s.propertyType !== filters.propertyType) return false;
      if (filters.district && s.district !== filters.district) return false;
      if (filters.surfaceMin && (!s.surface || s.surface < Number(filters.surfaceMin))) return false;
      if (filters.surfaceMax && (!s.surface || s.surface > Number(filters.surfaceMax))) return false;
      // Transaction type & price filters don't apply to terrain spots — skip them
      return true;
    });
  }, [spottings, filters]);

  // Point-in-polygon (ray casting) for any drawn shape
  const inDrawnArea = useCallback(
    (lat: number | null, lng: number | null) => {
      if (!drawnPolygon || drawnPolygon.length < 3 || !lat || !lng) return true;
      let inside = false;
      const pts = drawnPolygon;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const xi = pts[i].lng,
          yi = pts[i].lat;
        const xj = pts[j].lng,
          yj = pts[j].lat;
        const intersect =
          yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }
      return inside;
    },
    [drawnPolygon]
  );

  const propsWithCoords = useMemo(
    () => filteredProperties.filter((p) => p.latitude && p.longitude && inDrawnArea(p.latitude, p.longitude)),
    [filteredProperties, inDrawnArea]
  );
  const spotsWithCoords = useMemo(
    () => filteredSpots.filter((s) => s.latitude && s.longitude && inDrawnArea(s.latitude, s.longitude)),
    [filteredSpots, inDrawnArea]
  );

  // ── Init Leaflet — lazy-imported, fully cleaned on unmount ──
  useEffect(() => {
    if (mapInstanceRef.current) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let darkObserver: MutationObserver | null = null;
    let lightTiles: LeafletLayer | null = null;
    let darkTiles: LeafletLayer | null = null;

    (async () => {
      const { default: L } = await import("leaflet");
      if (cancelled || !mapRef.current || mapInstanceRef.current) return;
      leafletRef.current = L;

      // Workaround for Leaflet's default marker icon path under bundlers
      // — but we use divIcons everywhere so it's not strictly required.

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: true,
        // Better mobile feel — disable scroll-wheel zoom unless ctrl held;
        // tap is allowed; touchZoom + dragging stay default-on.
        scrollWheelZoom: true,
        worldCopyJump: true,
      }).setView([48.8566, 2.3522], 12);

      // Pretty tiles — CartoDB Voyager (light) and DarkMatter (dark).
      // Both retina-aware and Paris-friendly.
      const lightUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
      const darkUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
      const tileOptions = {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      } as const;

      lightTiles = L.tileLayer(lightUrl, tileOptions);
      darkTiles = L.tileLayer(darkUrl, tileOptions);
      const isDark = document.documentElement.classList.contains("dark");
      (isDark ? darkTiles : lightTiles).addTo(map);

      // Watch theme switches and swap tiles seamlessly
      darkObserver = new MutationObserver(() => {
        const nowDark = document.documentElement.classList.contains("dark");
        if (nowDark) {
          map.removeLayer(lightTiles);
          if (!map.hasLayer(darkTiles)) darkTiles.addTo(map);
        } else {
          map.removeLayer(darkTiles);
          if (!map.hasLayer(lightTiles)) lightTiles.addTo(map);
        }
      });
      darkObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      // Bottom-right zoom controls so they don't collide with our top toolbar
      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
      // Tiles & sizing settle after layout
      setTimeout(() => map.invalidateSize(), 80);
      setTimeout(() => map.invalidateSize(), 400);

      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
      });
      if (mapRef.current) resizeObserver.observe(mapRef.current);
    })();

    return () => {
      cancelled = true;
      if (resizeObserver) resizeObserver.disconnect();
      if (darkObserver) darkObserver.disconnect();
      // Always tear down the map on unmount — guarantees no zombie listener
      // keeps gestures captured on the body when navigating away.
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          /* ignore */
        }
        mapInstanceRef.current = null;
      }
      // Reset body styles in case a draw gesture was interrupted
      document.body.style.touchAction = "";
      document.body.style.userSelect = "";
    };
  }, []);

  // ── Drawing — Pointer Events, single code-path for desktop + mobile ──
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!L) return;

    const container: HTMLElement = map.getContainer();
    const shapeStyle = {
      color: "#886a4b",
      weight: 2,
      fillOpacity: 0.15,
      dashArray: "6",
    };

    if (drawMode === "off") {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      container.style.cursor = "";
      container.style.touchAction = "";
      return;
    }

    // Drawing is active — disable map gestures and tell the browser not to scroll
    map.dragging.disable();
    map.doubleClickZoom.disable();
    container.style.cursor = "crosshair";
    container.style.touchAction = "none";

    let drawing = false;
    let activePointerId: number | null = null;
    let start: { lat: number; lng: number } | null = null;
    const freePoints: { lat: number; lng: number }[] = [];

    function clientToLatLng(e: PointerEvent): { lat: number; lng: number } {
      const rect = container.getBoundingClientRect();
      const point = L.point(e.clientX - rect.left, e.clientY - rect.top);
      const ll = map.containerPointToLatLng(point);
      return { lat: ll.lat, lng: ll.lng };
    }

    function clearShape() {
      if (drawShapeRef.current) {
        try {
          drawShapeRef.current.remove();
        } catch {
          /* ignore */
        }
        drawShapeRef.current = null;
      }
    }

    function onPointerDown(e: PointerEvent) {
      // Only primary button / first touch
      if (e.button && e.button !== 0) return;
      if (drawing) return;
      drawing = true;
      activePointerId = e.pointerId;
      try {
        container.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      e.preventDefault();
      e.stopPropagation();

      const cur = clientToLatLng(e);
      start = cur;
      clearShape();
      if (drawMode === "free") {
        freePoints.length = 0;
        freePoints.push(cur);
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (!drawing || e.pointerId !== activePointerId || !start) return;
      e.preventDefault();
      const cur = clientToLatLng(e);

      if (drawMode === "rect") {
        const bounds = L.latLngBounds([start.lat, start.lng], [cur.lat, cur.lng]);
        if (drawShapeRef.current) drawShapeRef.current.setBounds(bounds);
        else drawShapeRef.current = L.rectangle(bounds, shapeStyle).addTo(map);
      } else if (drawMode === "circle") {
        const dx = cur.lat - start.lat;
        const dy = cur.lng - start.lng;
        const radius = Math.sqrt(dx * dx + dy * dy) * 111320;
        if (drawShapeRef.current) drawShapeRef.current.setRadius(radius);
        else drawShapeRef.current = L.circle([start.lat, start.lng], { radius, ...shapeStyle }).addTo(map);
      } else if (drawMode === "free") {
        freePoints.push(cur);
        const latlngs = freePoints.map((p) => [p.lat, p.lng]);
        if (drawShapeRef.current) drawShapeRef.current.setLatLngs(latlngs);
        else drawShapeRef.current = L.polygon(latlngs, shapeStyle).addTo(map);
      }
    }

    function onPointerUpOrCancel(e: PointerEvent) {
      if (!drawing || e.pointerId !== activePointerId) return;
      drawing = false;
      try {
        if (container.hasPointerCapture(e.pointerId)) container.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      const cur = clientToLatLng(e);
      if (start) {
        if (drawMode === "rect") {
          const s = start;
          const pts = [
            { lat: s.lat, lng: s.lng },
            { lat: s.lat, lng: cur.lng },
            { lat: cur.lat, lng: cur.lng },
            { lat: cur.lat, lng: s.lng },
          ];
          // Sanity check: minimal area to avoid accidental taps clearing nothing
          const area = Math.abs((cur.lat - s.lat) * (cur.lng - s.lng));
          if (area > 1e-8) setDrawnPolygon(pts);
          else clearShape();
        } else if (drawMode === "circle") {
          const dx = cur.lat - start.lat;
          const dy = cur.lng - start.lng;
          const r = Math.sqrt(dx * dx + dy * dy);
          if (r > 1e-5) {
            const n = 36;
            const pts: { lat: number; lng: number }[] = [];
            for (let i = 0; i < n; i++) {
              const a = (2 * Math.PI * i) / n;
              pts.push({ lat: start.lat + r * Math.sin(a), lng: start.lng + r * Math.cos(a) });
            }
            setDrawnPolygon(pts);
          } else clearShape();
        } else if (drawMode === "free") {
          if (freePoints.length > 2) {
            setDrawnPolygon([...freePoints]);
          } else clearShape();
        }
      }
      start = null;
      activePointerId = null;
      // After a successful draw, drop back to "off" so the user can pan again
      setDrawMode("off");
    }

    container.addEventListener("pointerdown", onPointerDown, { passive: false });
    container.addEventListener("pointermove", onPointerMove, { passive: false });
    container.addEventListener("pointerup", onPointerUpOrCancel, { passive: false });
    container.addEventListener("pointercancel", onPointerUpOrCancel, { passive: false });

    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUpOrCancel);
      container.removeEventListener("pointercancel", onPointerUpOrCancel);
      // Always restore navigation gestures — even if the effect tears down
      // mid-draw, the user must never end up with a frozen map.
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      container.style.cursor = "";
      container.style.touchAction = "";
    };
  }, [drawMode, mapReady]);

  // ── Update markers ──
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !leafletRef.current) return;
    const L = leafletRef.current;
    const map = mapInstanceRef.current;

    for (const m of markersRef.current) {
      try {
        m.remove();
      } catch {
        /* ignore */
      }
    }
    markersRef.current = [];

    // In prospection mode, hide biens/terrain markers so the map stays clean
    if (prospectionMode) return;

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
        const priceStr =
          p.transactionType === "LOCATION"
            ? p.rentMonthly
              ? `${fmtPrice(p.rentMonthly)}/mois`
              : fmtPrice(p.price)
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
  }, [propsWithCoords, spotsWithCoords, mapReady, activeLayer, prospectionMode]);

  // ── Prospection filtering ──
  const filteredMandates = useMemo<ProspectionMandate[]>(() => {
    const q = prospectionSearch.trim().toLowerCase();
    return PROSPECTION_MANDATES.filter((m) => {
      if (prospectionBrand && m.brandId !== prospectionBrand) return false;
      if (prospectionDistrict && m.district !== prospectionDistrict) return false;
      if (q) {
        const brand = getBrandById(m.brandId);
        const haystack = [
          m.street,
          m.district,
          m.notes || "",
          brand?.name || "",
          brand?.sector || "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [prospectionSearch, prospectionBrand, prospectionDistrict]);

  // ── Render prospection markers + polylines ──
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !leafletRef.current) return;
    const L = leafletRef.current;
    const map = mapInstanceRef.current;

    // Always clear previous prospection layers
    for (const l of prospectionLayersRef.current) {
      try {
        l.remove();
      } catch {
        /* ignore */
      }
    }
    prospectionLayersRef.current = [];

    if (!prospectionMode) return;

    filteredMandates.forEach((m, idx) => {
      const brand = getBrandById(m.brandId);
      const color = brand?.color || "#886a4b";
      const number = idx + 1;

      // Polyline along the street segment
      const line = L.polyline(m.polyline, {
        color,
        weight: 5,
        opacity: 0.7,
        lineCap: "round",
      }).addTo(map);
      prospectionLayersRef.current.push(line);

      // Numbered pastille at center
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:30px;height:30px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:12px;font-family:system-ui;">${number}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const fmtRange = (a: number, b: number, suffix: string) =>
        `${a.toLocaleString("fr-FR")} – ${b.toLocaleString("fr-FR")} ${suffix}`;

      const popup = `
        <div style="font-family:system-ui;min-width:240px;max-width:280px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};"></span>
            <span style="font-weight:700;font-size:13px;">${brand?.name || m.brandId}</span>
          </div>
          <p style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px;">${brand?.sector || ""}</p>
          <p style="font-weight:600;font-size:13px;margin:0 0 2px;">${m.street}</p>
          <p style="color:#666;font-size:11px;margin:0 0 6px;">n° ${m.numberFrom} – ${m.numberTo} · ${m.district}</p>
          <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 8px;font-size:11px;color:#444;">
            <span style="color:#888;">Surface</span><span>${fmtRange(m.surfaceMin, m.surfaceMax, "m²")}</span>
            <span style="color:#888;">Budget</span><span>${fmtRange(m.budgetMin, m.budgetMax, "€/mois")}</span>
          </div>
          ${m.notes ? `<p style="margin-top:8px;padding-top:6px;border-top:1px solid #eee;color:#555;font-size:11px;font-style:italic;">${m.notes}</p>` : ""}
        </div>`;

      const marker = L.marker([m.center.lat, m.center.lng], { icon })
        .bindPopup(popup)
        .on("popupopen", () => setSelectedMandateId(m.id))
        .addTo(map);
      prospectionLayersRef.current.push(marker);
    });
  }, [filteredMandates, prospectionMode, mapReady]);

  // When activating prospection mode, suppress other layers/draw to avoid conflicts
  useEffect(() => {
    if (prospectionMode && drawMode !== "off") setDrawMode("off");
  }, [prospectionMode, drawMode]);

  const activeFilterCount =
    Object.values(filters).filter(Boolean).length + (drawnPolygon ? 1 : 0);

  const prospectionFilterCount =
    (prospectionBrand ? 1 : 0) +
    (prospectionDistrict ? 1 : 0) +
    (prospectionSearch.trim() ? 1 : 0);

  const selectClass =
    "h-9 rounded-lg border border-stone-300 bg-white px-2.5 text-sm text-anthracite-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-anthracite-700 dark:bg-anthracite-900 dark:text-stone-200";
  const inputClass =
    "h-9 w-full rounded-lg border border-stone-300 bg-white px-2.5 text-sm text-anthracite-800 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-anthracite-700 dark:bg-anthracite-900 dark:text-stone-200 dark:placeholder:text-stone-500";

  function flyToMandate(mandateId: string) {
    const m = PROSPECTION_MANDATES.find((x) => x.id === mandateId);
    if (!m || !mapInstanceRef.current) return;
    setSelectedMandateId(mandateId);
    setProspectionView("map");
    // The map may need a frame to become visible again
    setTimeout(() => {
      const map = mapInstanceRef.current;
      if (!map) return;
      map.invalidateSize();
      map.flyTo([m.center.lat, m.center.lng], 16, { duration: 0.8 });
      // Open the matching marker's popup
      const layers = prospectionLayersRef.current;
      for (const layer of layers) {
        if (
          layer.getLatLng &&
          Math.abs(layer.getLatLng().lat - m.center.lat) < 1e-6 &&
          Math.abs(layer.getLatLng().lng - m.center.lng) < 1e-6 &&
          layer.openPopup
        ) {
          layer.openPopup();
          break;
        }
      }
    }, 80);
  }

  // Recompute map size when switching back to map view (display toggling can affect Leaflet)
  useEffect(() => {
    if (prospectionMode && prospectionView === "map" && mapInstanceRef.current) {
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 80);
    }
  }, [prospectionMode, prospectionView]);

  function clearDrawnZone() {
    setDrawnPolygon(null);
    if (drawShapeRef.current) {
      try {
        drawShapeRef.current.remove();
      } catch {
        /* ignore */
      }
      drawShapeRef.current = null;
    }
  }

  function findNearby(radiusMeters = 500) {
    if (!navigator.geolocation) {
      addToast("Géolocalisation non supportée", "error");
      return;
    }
    if (!mapInstanceRef.current || !leafletRef.current) {
      addToast("Carte non prête", "error");
      return;
    }
    setLocating(true);
    haptic("tap");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const map = mapInstanceRef.current;
        const L = leafletRef.current;
        if (userMarkerRef.current) {
          try {
            userMarkerRef.current.remove();
          } catch {
            /* ignore */
          }
        }
        if (userCircleRef.current) {
          try {
            userCircleRef.current.remove();
          } catch {
            /* ignore */
          }
        }
        userMarkerRef.current = L.circleMarker([latitude, longitude], {
          radius: 8,
          color: "#fff",
          weight: 2,
          fillColor: "#3b82f6",
          fillOpacity: 1,
        }).addTo(map);
        userCircleRef.current = L.circle([latitude, longitude], {
          radius: radiusMeters,
          color: "#3b82f6",
          weight: 1.5,
          fillColor: "#3b82f6",
          fillOpacity: 0.08,
          dashArray: "4 6",
        }).addTo(map);
        const radiusLat = radiusMeters / 111_320;
        const radiusLng = radiusMeters / (111_320 * Math.cos((latitude * Math.PI) / 180));
        const n = 36;
        const pts: { lat: number; lng: number }[] = [];
        for (let i = 0; i < n; i++) {
          const a = (2 * Math.PI * i) / n;
          pts.push({
            lat: latitude + radiusLat * Math.sin(a),
            lng: longitude + radiusLng * Math.cos(a),
          });
        }
        setDrawnPolygon(pts);
        map.flyTo([latitude, longitude], 16, { duration: 0.8 });
        haptic("success");
        addToast(`Filtré à ${radiusMeters} m de votre position`, "success");
        setLocating(false);
      },
      () => {
        setLocating(false);
        addToast("Impossible de récupérer votre position", "error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const totalShown = propsWithCoords.length + spotsWithCoords.length;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-anthracite-900 sm:text-2xl dark:text-stone-100">
            {prospectionMode ? "Prospection retail" : "Carte"}
          </h1>
          <p className="text-xs text-stone-500 sm:text-sm dark:text-stone-400">
            {prospectionMode ? (
              <>
                {filteredMandates.length} mandat{filteredMandates.length !== 1 ? "s" : ""} ·{" "}
                {PROSPECTION_BRANDS.length} marques mandataires
              </>
            ) : loading ? (
              "Chargement…"
            ) : (
              <>
                {(activeLayer === "biens" || activeLayer === "tous") &&
                  `${propsWithCoords.length} bien${propsWithCoords.length !== 1 ? "s" : ""}`}
                {activeLayer === "tous" && " · "}
                {(activeLayer === "terrain" || activeLayer === "tous") &&
                  `${spotsWithCoords.length} repérage${spotsWithCoords.length !== 1 ? "s" : ""}`}
                {drawnPolygon && " (zone filtrée)"}
              </>
            )}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={prospectionMode ? "primary" : "outline"}
            size="sm"
            onClick={() => {
              setProspectionMode((v) => !v);
              haptic("tap");
            }}
            title="Activer le mode Prospection (mandats retail)"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            <span className="ml-1 hidden sm:inline">Prospection</span>
          </Button>
          {!prospectionMode && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => findNearby(500)}
                disabled={locating}
                title="Filtrer dans un rayon de 500 m autour de moi"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span className="ml-1 hidden sm:inline">{locating ? "Localisation…" : "Près de moi"}</span>
              </Button>
              <Button
                variant={activeFilterCount > 0 ? "primary" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                </svg>
                <span className="ml-1">Filtres{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Prospection toolbar */}
      {prospectionMode && (
        <Card className="p-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* List/Map view toggle */}
              <div className="inline-flex flex-shrink-0 rounded-lg border border-stone-200 dark:border-anthracite-800 overflow-hidden">
                {(["map", "list"] as ProspectionView[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setProspectionView(v)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      prospectionView === v
                        ? "bg-anthracite-900 text-white dark:bg-brand-500 dark:text-anthracite-950"
                        : "bg-white text-stone-600 hover:bg-stone-50 dark:bg-anthracite-900 dark:text-stone-400"
                    }`}
                  >
                    {v === "map" ? "Carte" : "Liste"}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <svg
                  className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  value={prospectionSearch}
                  onChange={(e) => setProspectionSearch(e.target.value)}
                  placeholder="Rue, quartier, marque…"
                  className={inputClass + " pl-8"}
                />
              </div>

              {prospectionFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setProspectionBrand("");
                    setProspectionDistrict("");
                    setProspectionSearch("");
                  }}
                >
                  Réinitialiser
                </Button>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">
                  Marque
                </label>
                <select
                  value={prospectionBrand}
                  onChange={(e) => setProspectionBrand(e.target.value)}
                  className={selectClass + " w-full"}
                >
                  <option value="">Toutes les marques</option>
                  {PROSPECTION_BRANDS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} — {b.sector}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">
                  Arrondissement
                </label>
                <select
                  value={prospectionDistrict}
                  onChange={(e) => setProspectionDistrict(e.target.value)}
                  className={selectClass + " w-full"}
                >
                  <option value="">Tous</option>
                  {PARIS_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Brand legend */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-stone-100 dark:border-stone-800/60 pt-2 text-xs text-stone-500 dark:text-stone-400">
              {PROSPECTION_BRANDS.map((b) => (
                <button
                  key={b.id}
                  onClick={() =>
                    setProspectionBrand((curr) => (curr === b.id ? "" : b.id))
                  }
                  className={`flex items-center gap-1.5 transition-opacity ${
                    prospectionBrand && prospectionBrand !== b.id ? "opacity-40" : ""
                  } hover:opacity-100`}
                >
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ background: b.color }}
                  />
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Toolbar — layers & draw modes, scrollable on mobile (hidden in prospection mode) */}
      <div
        className={`-mx-1 ${prospectionMode ? "hidden" : "flex"} items-center gap-2 overflow-x-auto px-1 pb-1`}
      >
        {/* Layer toggle */}
        <div className="inline-flex flex-shrink-0 rounded-lg border border-stone-200 dark:border-anthracite-800 overflow-hidden">
          {(["tous", "biens", "terrain"] as Layer[]).map((l) => (
            <button
              key={l}
              onClick={() => setActiveLayer(l)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                activeLayer === l
                  ? "bg-anthracite-900 text-white dark:bg-brand-500 dark:text-anthracite-950"
                  : "bg-white text-stone-600 hover:bg-stone-50 dark:bg-anthracite-900 dark:text-stone-400"
              }`}
            >
              {l === "tous" ? "Tous" : l === "biens" ? "Biens" : "Terrain"}
            </button>
          ))}
        </div>

        {/* Draw modes */}
        <div className="inline-flex flex-shrink-0 rounded-lg border border-stone-200 dark:border-anthracite-800 overflow-hidden">
          {(
            [
              { mode: "rect" as DrawMode, label: "Rectangle", icon: "M4 5h16v14H4z" },
              { mode: "circle" as DrawMode, label: "Cercle", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" },
              { mode: "free" as DrawMode, label: "Libre", icon: "M3 17c3-3 5-8 9-8s5 5 9 2" },
            ]
          ).map(({ mode, label, icon }) => (
            <button
              key={mode}
              onClick={() => {
                if (drawMode === mode) {
                  setDrawMode("off");
                } else {
                  clearDrawnZone();
                  setDrawMode(mode);
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
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
          <Button variant="ghost" size="sm" onClick={clearDrawnZone} className="flex-shrink-0 whitespace-nowrap">
            Effacer la zone
          </Button>
        )}
      </div>

      {/* Filters drawer (hidden in prospection mode) */}
      {showFilters && !prospectionMode && (
        <Card className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">
                Transaction
              </label>
              <select
                value={filters.transactionType}
                onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
                className={selectClass + " w-full"}
              >
                <option value="">Toutes</option>
                {Object.entries(TRANSACTION_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">
                Type de bien
              </label>
              <select
                value={filters.propertyType}
                onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}
                className={selectClass + " w-full"}
              >
                <option value="">Tous</option>
                {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">
                Prix min
              </label>
              <input
                type="number"
                value={filters.priceMin}
                onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                placeholder="Min €"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">
                Prix max
              </label>
              <input
                type="number"
                value={filters.priceMax}
                onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                placeholder="Max €"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">
                Surface min
              </label>
              <input
                type="number"
                value={filters.surfaceMin}
                onChange={(e) => setFilters({ ...filters, surfaceMin: e.target.value })}
                placeholder="Min m²"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">
                Surface max
              </label>
              <input
                type="number"
                value={filters.surfaceMax}
                onChange={(e) => setFilters({ ...filters, surfaceMax: e.target.value })}
                placeholder="Max m²"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">
                Arrondissement
              </label>
              <select
                value={filters.district}
                onChange={(e) => setFilters({ ...filters, district: e.target.value })}
                className={selectClass + " w-full"}
              >
                <option value="">Tous</option>
                {PARIS_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilters(defaultFilters);
                  clearDrawnZone();
                }}
                className="w-full"
              >
                Réinitialiser
              </Button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-stone-100 dark:border-stone-800/60 pt-3 text-xs text-stone-500 dark:text-stone-400">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full" style={{ background: "#886a4b" }} />
              Vente
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full" style={{ background: "#2563eb" }} />
              Location
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full" style={{ background: "#d97706" }} />
              Cession de bail
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full" style={{ background: "#7c3aed" }} />
              Fond de commerce
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm" style={{ background: "#ef4444" }} />
              Repérage terrain
            </div>
          </div>
        </Card>
      )}

      {/* Drawing instructions banner */}
      {drawMode !== "off" && (
        <div className="rounded-lg border-2 border-dashed border-brand-400 bg-brand-50 dark:bg-brand-950/20 p-3 text-center text-sm text-brand-700 dark:text-brand-400">
          {drawMode === "rect" && "Touchez et glissez pour tracer un rectangle."}
          {drawMode === "circle" && "Touchez le centre puis glissez pour le rayon."}
          {drawMode === "free" && "Tracez librement votre zone avec le doigt."}
          <button
            type="button"
            onClick={() => setDrawMode("off")}
            className="ml-3 underline underline-offset-2"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Prospection list view */}
      {prospectionMode && prospectionView === "list" && (
        <Card className="overflow-hidden">
          {filteredMandates.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">
                Aucun mandat ne correspond à vos critères
              </p>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                Essayez d&apos;élargir la marque, l&apos;arrondissement ou la recherche.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100 dark:divide-anthracite-800">
              {filteredMandates.map((m, idx) => {
                const brand = getBrandById(m.brandId);
                const color = brand?.color || "#886a4b";
                const isSelected = selectedMandateId === m.id;
                return (
                  <li key={m.id}>
                    <button
                      onClick={() => flyToMandate(m.id)}
                      className={`flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-stone-50 dark:hover:bg-anthracite-800/60 ${
                        isSelected ? "bg-brand-50/60 dark:bg-brand-950/20" : ""
                      }`}
                    >
                      <span
                        className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow"
                        style={{ background: color }}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-anthracite-900 dark:text-stone-100">
                            {brand?.name || m.brandId}
                          </span>
                          <span className="text-[10px] uppercase tracking-wide text-stone-500 dark:text-stone-400">
                            {brand?.sector}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-anthracite-800 dark:text-stone-200">
                          {m.street}{" "}
                          <span className="text-stone-500 dark:text-stone-400">
                            n° {m.numberFrom}–{m.numberTo}
                          </span>
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {m.district}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-stone-600 dark:text-stone-300">
                          <span>
                            <span className="text-stone-400">Surface </span>
                            {m.surfaceMin}–{m.surfaceMax} m²
                          </span>
                          <span>
                            <span className="text-stone-400">Budget </span>
                            {m.budgetMin.toLocaleString("fr-FR")}–
                            {m.budgetMax.toLocaleString("fr-FR")} €/mois
                          </span>
                        </div>
                        {m.notes && (
                          <p className="mt-1 text-xs italic text-stone-500 dark:text-stone-400">
                            {m.notes}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      {/* The map — fixed dvh height for stable mobile sizing.
          Stays mounted at all times to preserve Leaflet state; hidden via CSS in list view. */}
      <Card
        className={`overflow-hidden ${
          prospectionMode && prospectionView === "list" ? "hidden" : ""
        }`}
      >
        <div
          ref={mapRef}
          className="h-[60vh] min-h-[420px] w-full sm:h-[calc(100dvh-260px)]"
          style={{ touchAction: drawMode === "off" ? "" : "none" }}
        />
      </Card>

      {/* Empty state under map (only in normal mode) */}
      {!prospectionMode && !loading && totalShown === 0 && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 text-center dark:border-anthracite-800 dark:bg-anthracite-900">
          <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">
            Aucun résultat dans la zone visible
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {drawnPolygon
              ? "Effacez la zone dessinée ou réinitialisez les filtres."
              : "Ajustez vos filtres ou changez de calque."}
          </p>
        </div>
      )}

      {/* Empty state under map (prospection map view) */}
      {prospectionMode && prospectionView === "map" && filteredMandates.length === 0 && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 text-center dark:border-anthracite-800 dark:bg-anthracite-900">
          <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">
            Aucun mandat ne correspond à vos critères
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Essayez d&apos;élargir la marque, l&apos;arrondissement ou la recherche.
          </p>
        </div>
      )}
    </div>
  );
}
