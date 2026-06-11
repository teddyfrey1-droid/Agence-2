"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useRef, useState } from "react";

export interface PublicMapProperty {
  id: string;
  title: string;
  typeLabel: string;
  priceLabel: string;
  location: string;
  surfaceLabel: string | null;
  latitude: number;
  longitude: number;
  photoUrl: string | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type LeafletMap = any;
type LeafletLayer = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Public-facing property map — luxury styling, read-only.
 * Anthracite price pills with a champagne border, photo popups,
 * light/dark tiles following the site theme.
 */
export function PublicPropertiesMap({ properties }: { properties: PublicMapProperty[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (mapInstanceRef.current) return;

    let cancelled = false;
    let darkObserver: MutationObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;

    (async () => {
      const { default: L } = await import("leaflet");
      if (cancelled || !mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false, // public page: don't hijack page scroll
      }).setView([48.8566, 2.3522], 12);

      const tileOptions = {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      } as const;
      const lightTiles = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        tileOptions
      );
      const darkTiles = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        tileOptions
      );
      const isDark = document.documentElement.classList.contains("dark");
      (isDark ? darkTiles : lightTiles).addTo(map);

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

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Markers — champagne-rimmed anthracite price pills
      const markers: LeafletLayer[] = [];
      for (const p of properties) {
        const icon = L.divIcon({
          className: "",
          html: `<div style="transform:translate(-50%,-50%);display:inline-flex;align-items:center;background:#1e1f27;color:#fff;font:600 11px system-ui;padding:4px 10px;border-radius:999px;border:2px solid #dcb87e;box-shadow:0 3px 10px rgba(0,0,0,0.35);white-space:nowrap;">${p.priceLabel}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
        const photoHtml = p.photoUrl
          ? `<img src="${p.photoUrl}" style="width:100%;height:96px;object-fit:cover;border-radius:6px;margin-bottom:8px;" />`
          : "";
        const popup = `
          <div style="font-family:system-ui;min-width:210px;max-width:260px;">
            ${photoHtml}
            <p style="font-size:9px;color:#a3815a;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;margin:0 0 4px;">${p.typeLabel}</p>
            <p style="font-weight:600;font-size:13.5px;margin:0 0 3px;color:#1e1f27;">${p.title}</p>
            <p style="color:#888;font-size:11px;margin:0 0 4px;">${p.location}${p.surfaceLabel ? " · " + p.surfaceLabel : ""}</p>
            <p style="font-weight:700;font-size:14px;margin:0;color:#886a4b;">${p.priceLabel}</p>
            <a href="/biens/${p.id}" style="display:block;margin-top:9px;font-size:11px;color:#886a4b;text-decoration:none;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Découvrir →</a>
          </div>`;
        markers.push(L.marker([p.latitude, p.longitude], { icon }).bindPopup(popup).addTo(map));
      }

      if (properties.length > 0) {
        map.fitBounds(
          L.latLngBounds(properties.map((p) => [p.latitude, p.longitude] as [number, number])),
          { padding: [48, 48], maxZoom: 16 }
        );
      }

      mapInstanceRef.current = map;
      setReady(true);
      setTimeout(() => map.invalidateSize(), 80);
      setTimeout(() => map.invalidateSize(), 400);

      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
      });
      if (mapRef.current) resizeObserver.observe(mapRef.current);
    })();

    return () => {
      cancelled = true;
      if (darkObserver) darkObserver.disconnect();
      if (resizeObserver) resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          /* ignore */
        }
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative overflow-hidden border border-stone-200 dark:border-stone-800">
      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-50 dark:bg-anthracite-900">
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-stone-400">
            Chargement de la carte…
          </p>
        </div>
      )}
      <div ref={mapRef} className="h-[65vh] min-h-[460px] w-full" />
    </div>
  );
}
