"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";

export default function CartePage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || token.startsWith("pk.your")) {
      setError("Configurez NEXT_PUBLIC_MAPBOX_TOKEN dans votre fichier .env pour activer la carte.");
      return;
    }

    let map: unknown;

    async function initMap() {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;

        if (!mapContainer.current) return;

        mapboxgl.accessToken = token!;
        map = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/light-v11",
          center: [2.3522, 48.8566],
          zoom: 12,
        });

        setMapLoaded(true);

        // Load properties with coordinates
        const res = await fetch("/api/properties?published=true");
        if (res.ok) {
          const data = await res.json();
          const properties = data.items || [];

          for (const property of properties) {
            if (property.latitude && property.longitude) {
              const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<div style="font-family: sans-serif; padding: 4px;">
                  <strong>${property.title}</strong><br/>
                  <span style="color: #666; font-size: 12px;">${property.address || property.city}</span>
                </div>`
              );

              new mapboxgl.Marker({ color: "#886a4b" })
                .setLngLat([property.longitude, property.latitude])
                .setPopup(popup)
                .addTo(map as mapboxgl.Map);
            }
          }
        }
      } catch {
        setError("Erreur lors du chargement de la carte.");
      }
    }

    initMap();

    return () => {
      if (map && typeof (map as { remove: () => void }).remove === "function") {
        (map as { remove: () => void }).remove();
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900">Carte</h1>
        <p className="text-sm text-stone-500">Visualisez vos biens et repérages sur la carte.</p>
      </div>

      <Card className="overflow-hidden">
        {error ? (
          <div className="flex items-center justify-center py-24">
            <p className="text-sm text-stone-500">{error}</p>
          </div>
        ) : (
          <div ref={mapContainer} className="h-[600px] w-full" />
        )}
      </Card>
    </div>
  );
}
