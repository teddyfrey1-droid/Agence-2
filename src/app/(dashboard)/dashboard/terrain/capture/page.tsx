"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type GeoStatus = "idle" | "loading" | "ready" | "denied" | "error";

interface GeoInfo {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  zipCode?: string;
  district?: string;
  accuracy?: number;
}

async function compressImage(file: File, maxWidth = 1920, quality = 0.82): Promise<File> {
  if (file.type === "image/heic" || file.type === "image/heif") return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (b) => resolve(b ? new File([b], "photo.jpg", { type: "image/jpeg" }) : file),
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

export default function TerrainCapturePage() {
  const { addToast } = useToast();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [geo, setGeo] = useState<GeoInfo | null>(null);
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ id: string; address: string } | null>(null);

  // Start the location lookup immediately — by the time the user tapped twice,
  // coords are ready. This is what makes the 2-click flow actually possible.
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const base: GeoInfo = { lat: latitude, lng: longitude, accuracy };
        try {
          const res = await fetch(
            `https://api-adresse.data.gouv.fr/reverse/?lon=${longitude}&lat=${latitude}`
          );
          if (res.ok) {
            const data = await res.json();
            const props = data.features?.[0]?.properties;
            if (props) {
              const arrNum = props.postcode?.startsWith("75") ? props.postcode.slice(-2) : "";
              base.address = props.name || props.label;
              base.city = props.city || "Paris";
              base.zipCode = props.postcode;
              base.district = arrNum
                ? `${parseInt(arrNum)}${parseInt(arrNum) === 1 ? "er" : "e"} arrondissement`
                : undefined;
            }
          }
        } catch {
          /* reverse geocoding failed, we still keep coords */
        }
        setGeo(base);
        setGeoStatus("ready");
      },
      (err) => {
        setGeoStatus(err.code === 1 ? "denied" : "error");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  }, []);

  function onFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const next = Array.from(files).slice(0, 10 - photos.length).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...next]);
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(photos[i].url);
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    if (!photos.length && !geo) {
      addToast("Ajoutez une photo ou validez la localisation", "info");
      return;
    }
    setSaving(true);
    try {
      const address = geo?.address || "Repérage rapide";
      const res = await fetch("/api/field-spotting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          city: geo?.city || "Paris",
          zipCode: geo?.zipCode,
          district: geo?.district,
          latitude: geo?.lat,
          longitude: geo?.lng,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur");
      }
      const spot = await res.json();

      if (photos.length) {
        await Promise.allSettled(
          photos.map(async (p) => {
            const compressed = await compressImage(p.file);
            const fd = new FormData();
            fd.append("file", compressed);
            fd.append("entityType", "fieldSpotting");
            fd.append("entityId", spot.id);
            return fetch("/api/upload", { method: "POST", body: fd });
          })
        );
      }

      setSaved({ id: spot.id, address });
      photos.forEach((p) => URL.revokeObjectURL(p.url));
      setPhotos([]);
      addToast("Repérage enregistré !", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setSaving(false);
    }
  }

  function startOver() {
    setSaved(null);
    // Re-acquire position (user likely moved)
    setGeoStatus("loading");
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        try {
          const res = await fetch(
            `https://api-adresse.data.gouv.fr/reverse/?lon=${pos.coords.longitude}&lat=${pos.coords.latitude}`
          );
          if (res.ok) {
            const data = await res.json();
            const props = data.features?.[0]?.properties;
            if (props) {
              const arrNum = props.postcode?.startsWith("75") ? props.postcode.slice(-2) : "";
              setGeo({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                address: props.name || props.label,
                city: props.city || "Paris",
                zipCode: props.postcode,
                district: arrNum
                  ? `${parseInt(arrNum)}${parseInt(arrNum) === 1 ? "er" : "e"} arrondissement`
                  : undefined,
              });
            }
          }
        } catch {
          /* ignore */
        }
        setGeoStatus("ready");
      },
      () => setGeoStatus("error"),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  // Success state after save — offer next action
  if (saved) {
    return (
      <div className="mx-auto max-w-md py-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
          <svg className="h-10 w-10 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-anthracite-900 dark:text-stone-100">Repérage enregistré</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{saved.address}</p>
        <div className="mt-6 grid gap-2">
          <Button onClick={startOver} size="lg">Nouveau repérage</Button>
          <Link href={`/dashboard/terrain/${saved.id}`}>
            <Button variant="outline" className="w-full">Ouvrir la fiche</Button>
          </Link>
          <Link href="/dashboard/terrain">
            <Button variant="ghost" className="w-full">Retour à la liste</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-5 pb-10">
      {/* Location banner — always visible, reassures the user the address is captured */}
      <div
        className={`flex items-start gap-3 rounded-2xl border p-4 ${
          geoStatus === "ready"
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-900/20"
            : geoStatus === "loading"
            ? "border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-anthracite-800"
            : "border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20"
        }`}
      >
        <div className="mt-0.5 flex-shrink-0">
          {geoStatus === "loading" && (
            <svg className="h-5 w-5 animate-spin text-stone-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {geoStatus === "ready" && (
            <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          )}
          {(geoStatus === "denied" || geoStatus === "error") && (
            <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007m8.464-7.5a8.25 8.25 0 11-16.5 0 8.25 8.25 0 0116.5 0z" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {geoStatus === "loading" && <p className="text-sm text-stone-600 dark:text-stone-300">Localisation en cours…</p>}
          {geoStatus === "ready" && geo && (
            <>
              <p className="truncate text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                {geo.address || `${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)}`}
              </p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-300/70">
                {geo.city} {geo.zipCode}
                {geo.accuracy ? ` · précision ±${Math.round(geo.accuracy)} m` : ""}
              </p>
            </>
          )}
          {geoStatus === "denied" && (
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Autorisez la localisation pour capturer l&apos;adresse automatiquement.
            </p>
          )}
          {geoStatus === "error" && (
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Position indisponible. Vous pouvez toujours enregistrer la photo.
            </p>
          )}
        </div>
      </div>

      {/* Big camera button — tap 1 */}
      <button
        type="button"
        onClick={() => cameraRef.current?.click()}
        className="flex w-full flex-col items-center gap-3 rounded-3xl bg-gradient-to-br from-anthracite-900 to-anthracite-800 px-6 py-10 text-white shadow-xl active:scale-[0.98] transition-transform dark:from-brand-500 dark:to-brand-600 dark:text-anthracite-950"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-4 ring-white/10 dark:bg-anthracite-950/20 dark:ring-anthracite-950/10">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold leading-tight">Prendre une photo</p>
          <p className="text-xs opacity-80">La position est déjà enregistrée</p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => galleryRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-anthracite-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-anthracite-800 dark:text-stone-200"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
        </svg>
        Depuis la galerie
      </button>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <div key={p.url} className="group relative aspect-square overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700">
              <img src={p.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label="Retirer la photo"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save — tap 2 */}
      <div className="sticky bottom-4 space-y-2">
        <Button
          onClick={save}
          isLoading={saving}
          size="lg"
          className="w-full text-base"
          disabled={saving || (photos.length === 0 && geoStatus !== "ready")}
        >
          {saving ? "Enregistrement…" : photos.length > 0 ? `Enregistrer (${photos.length})` : "Enregistrer"}
        </Button>
        <Link href="/dashboard/terrain/nouveau" className="block">
          <Button variant="ghost" className="w-full text-xs">
            Mode détaillé (type, surface, notes…)
          </Button>
        </Link>
      </div>

      {/* Hidden inputs — one forces the camera, one opens the gallery */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
