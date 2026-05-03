"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { haptic } from "@/lib/haptics";
import { Confetti } from "@/components/confetti";
import { unlockAchievement } from "@/lib/achievements";
import { queueSpot } from "@/lib/offline-queue";

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

interface DetailsInfo {
  surface?: string;
  facadeLength?: string;
  ceilingHeight?: string;
  transactionType?: "" | "LOCATION" | "VENTE" | "CESSION_BAIL" | "FOND_DE_COMMERCE";
  notes?: string;
}

const TX_OPTIONS: { value: NonNullable<DetailsInfo["transactionType"]>; label: string }[] = [
  { value: "LOCATION", label: "Location" },
  { value: "VENTE", label: "Vente" },
  { value: "CESSION_BAIL", label: "Bail à céder" },
  { value: "FOND_DE_COMMERCE", label: "Fonds" },
];

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

async function reverseGeocode(lat: number, lng: number): Promise<Partial<GeoInfo>> {
  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/reverse/?lon=${lng}&lat=${lat}`
    );
    if (!res.ok) return {};
    const data = await res.json();
    const props = data.features?.[0]?.properties;
    if (!props) return {};
    const arrNum = props.postcode?.startsWith("75") ? props.postcode.slice(-2) : "";
    return {
      address: props.name || props.label,
      city: props.city || "Paris",
      zipCode: props.postcode,
      district: arrNum
        ? `${parseInt(arrNum)}${parseInt(arrNum) === 1 ? "er" : "e"} arrondissement`
        : undefined,
    };
  } catch {
    return {};
  }
}

export default function TerrainCapturePage() {
  const { addToast } = useToast();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [geo, setGeo] = useState<GeoInfo | null>(null);
  const [details, setDetails] = useState<DetailsInfo>({});
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ id: string; address: string } | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

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
        const reverse = await reverseGeocode(latitude, longitude);
        setGeo({ lat: latitude, lng: longitude, accuracy, ...reverse });
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
    haptic("success");
    // Open the editor on the first newly added photo so the user can confirm
    // the address and add details right away.
    setPreviewIndex(photos.length);
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(photos[i].url);
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
    if (previewIndex === i) setPreviewIndex(null);
  }

  async function save() {
    if (!photos.length && !geo) {
      addToast("Ajoutez une photo ou validez la localisation", "info");
      return;
    }
    setSaving(true);
    const address = geo?.address || "Repérage rapide";
    const payload = {
      address,
      city: geo?.city || "Paris",
      zipCode: geo?.zipCode ?? null,
      district: geo?.district ?? null,
      latitude: geo?.lat ?? null,
      longitude: geo?.lng ?? null,
      surface: details.surface ? Number(details.surface) : undefined,
      facadeLength: details.facadeLength ? Number(details.facadeLength) : undefined,
      ceilingHeight: details.ceilingHeight ? Number(details.ceilingHeight) : undefined,
      transactionType: details.transactionType || undefined,
      notes: details.notes || undefined,
    };

    // No network → queue locally and replay later via OfflineSync.
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      try {
        const compressedPhotos = await Promise.all(photos.map((p) => compressImage(p.file)));
        await queueSpot({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          payload,
          photos: compressedPhotos,
          createdAt: Date.now(),
        });
        setSaved({ id: "offline", address });
        photos.forEach((p) => URL.revokeObjectURL(p.url));
        setPhotos([]);
        setCelebrate(true);
        unlockAchievement("first_spot");
        addToast("Hors-ligne — sera synchronisé au retour du réseau", "info");
      } catch (err) {
        addToast(err instanceof Error ? err.message : "Erreur queue", "error");
      } finally {
        setSaving(false);
      }
      return;
    }

    try {
      const res = await fetch("/api/field-spotting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      setCelebrate(true);
      unlockAchievement("first_spot");
      addToast("Repérage enregistré !", "success");
    } catch (err) {
      // Network failure mid-call — fallback to queue
      try {
        const compressedPhotos = await Promise.all(photos.map((p) => compressImage(p.file)));
        await queueSpot({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          payload,
          photos: compressedPhotos,
          createdAt: Date.now(),
        });
        setSaved({ id: "offline", address });
        photos.forEach((p) => URL.revokeObjectURL(p.url));
        setPhotos([]);
        setCelebrate(true);
        addToast("Réseau capricieux — repérage mis en attente", "info");
      } catch {
        addToast(err instanceof Error ? err.message : "Erreur", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  function startOver() {
    setSaved(null);
    setDetails({});
    // Re-acquire position (user likely moved)
    setGeoStatus("loading");
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const reverse = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setGeo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          ...reverse,
        });
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
        <Confetti fire={celebrate} onDone={() => setCelebrate(false)} />
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

  const filledFields =
    (details.surface ? 1 : 0) +
    (details.facadeLength ? 1 : 0) +
    (details.ceilingHeight ? 1 : 0) +
    (details.transactionType ? 1 : 0) +
    (details.notes ? 1 : 0);

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
        {geoStatus === "ready" && (
          <button
            type="button"
            onClick={() => setPreviewIndex(photos.length > 0 ? 0 : -1)}
            className="flex-shrink-0 rounded-lg border border-emerald-300 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 transition-colors hover:bg-white dark:border-emerald-700 dark:bg-anthracite-900/60 dark:text-emerald-200 dark:hover:bg-anthracite-800"
          >
            Modifier
          </button>
        )}
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
              <button
                type="button"
                onClick={() => setPreviewIndex(i)}
                aria-label="Voir la photo et modifier les infos"
                className="h-full w-full"
              >
                <img src={p.url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              </button>
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
              {/* Tap hint badge */}
              <span className="pointer-events-none absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                Toucher
              </span>
            </div>
          ))}
        </div>
      )}

      {filledFields > 0 && (
        <div className="rounded-2xl border border-stone-200 bg-stone-50/60 p-3 text-xs text-stone-600 dark:border-anthracite-800 dark:bg-anthracite-900 dark:text-stone-300">
          <span className="font-semibold">{filledFields}</span> info{filledFields > 1 ? "s" : ""} renseignée{filledFields > 1 ? "s" : ""} ·{" "}
          <button
            type="button"
            onClick={() => setPreviewIndex(photos.length > 0 ? 0 : -1)}
            className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Modifier
          </button>
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
            Mode formulaire complet
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

      {/* Photo preview + edit modal */}
      {previewIndex !== null && (
        <PreviewEditor
          photo={previewIndex >= 0 ? photos[previewIndex] : null}
          geo={geo}
          geoStatus={geoStatus}
          details={details}
          onChangeGeo={setGeo}
          onChangeDetails={setDetails}
          onClose={() => setPreviewIndex(null)}
          onSkip={() => setPreviewIndex(null)}
          onRemovePhoto={
            previewIndex >= 0
              ? () => {
                  removePhoto(previewIndex);
                  setPreviewIndex(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

interface PreviewEditorProps {
  photo: { file: File; url: string } | null;
  geo: GeoInfo | null;
  geoStatus: GeoStatus;
  details: DetailsInfo;
  onChangeGeo: (g: GeoInfo) => void;
  onChangeDetails: (d: DetailsInfo) => void;
  onClose: () => void;
  onSkip: () => void;
  onRemovePhoto?: () => void;
}

function PreviewEditor({
  photo,
  geo,
  geoStatus,
  details,
  onChangeGeo,
  onChangeDetails,
  onClose,
  onSkip,
  onRemovePhoto,
}: PreviewEditorProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState({
    address: geo?.address ?? "",
    city: geo?.city ?? "",
    zipCode: geo?.zipCode ?? "",
  });

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function refreshLocation() {
    if (!navigator.geolocation) return;
    setRefreshing(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const reverse = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        const next: GeoInfo = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          ...reverse,
        };
        onChangeGeo(next);
        setAddressDraft({
          address: next.address ?? "",
          city: next.city ?? "",
          zipCode: next.zipCode ?? "",
        });
        setRefreshing(false);
      },
      () => setRefreshing(false),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function commitAddress() {
    onChangeGeo({
      lat: geo?.lat ?? 0,
      lng: geo?.lng ?? 0,
      accuracy: geo?.accuracy,
      address: addressDraft.address.trim(),
      city: addressDraft.city.trim() || "Paris",
      zipCode: addressDraft.zipCode.trim() || undefined,
      district: geo?.district,
    });
    setEditingAddress(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center">
      {/* Sheet */}
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl dark:bg-anthracite-900">
        {/* Drag handle (mobile sheet hint) */}
        <div className="mx-auto mt-2 h-1 w-10 flex-shrink-0 rounded-full bg-stone-300 sm:hidden dark:bg-stone-600" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 dark:border-anthracite-800">
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
              {photo ? "Photo & infos" : "Infos du repérage"}
            </p>
            <p className="text-sm font-semibold text-anthracite-900 dark:text-stone-100">
              Tout est facultatif — passez à tout moment.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-anthracite-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Photo */}
          {photo && (
            <div className="relative aspect-[4/3] w-full bg-stone-900">
              <img src={photo.url} alt="" className="absolute inset-0 h-full w-full object-contain" />
              {onRemovePhoto && (
                <button
                  type="button"
                  onClick={onRemovePhoto}
                  className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                  </svg>
                  Supprimer
                </button>
              )}
            </div>
          )}

          <div className="space-y-5 p-4 sm:p-5">
            {/* Address block — view + edit */}
            <section>
              <div className="flex items-center justify-between">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                  Adresse géolocalisée
                </p>
                <button
                  type="button"
                  onClick={refreshLocation}
                  disabled={refreshing}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline disabled:opacity-50 dark:text-brand-400"
                >
                  {refreshing ? (
                    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  )}
                  Re-localiser
                </button>
              </div>

              {!editingAddress ? (
                <button
                  type="button"
                  onClick={() => {
                    setAddressDraft({
                      address: geo?.address ?? "",
                      city: geo?.city ?? "",
                      zipCode: geo?.zipCode ?? "",
                    });
                    setEditingAddress(true);
                  }}
                  className="mt-2 flex w-full items-start gap-3 rounded-xl border border-stone-200 bg-stone-50/60 p-3 text-left transition-colors hover:border-brand-300 hover:bg-white dark:border-anthracite-800 dark:bg-anthracite-800/40 dark:hover:border-brand-700 dark:hover:bg-anthracite-800"
                >
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    {geoStatus === "ready" && geo?.address ? (
                      <>
                        <p className="text-sm font-medium text-anthracite-900 dark:text-stone-100">
                          {geo.address}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {geo.city} {geo.zipCode}
                          {geo.accuracy ? ` · ±${Math.round(geo.accuracy)} m` : ""}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-stone-500 dark:text-stone-400">
                        {geoStatus === "loading"
                          ? "Localisation en cours…"
                          : "Adresse non capturée — touchez pour saisir."}
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    Modifier
                  </span>
                </button>
              ) : (
                <div className="mt-2 space-y-2 rounded-xl border border-brand-200 bg-brand-50/40 p-3 dark:border-brand-800/50 dark:bg-brand-900/10">
                  <input
                    type="text"
                    value={addressDraft.address}
                    onChange={(e) => setAddressDraft((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Numéro et rue"
                    className="block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-900 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-100"
                    autoFocus
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={addressDraft.city}
                      onChange={(e) => setAddressDraft((p) => ({ ...p, city: e.target.value }))}
                      placeholder="Ville"
                      className="block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-100"
                    />
                    <input
                      type="text"
                      value={addressDraft.zipCode}
                      onChange={(e) => setAddressDraft((p) => ({ ...p, zipCode: e.target.value }))}
                      placeholder="Code postal"
                      inputMode="numeric"
                      className="block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-100"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={commitAddress}
                      className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                    >
                      Valider l&apos;adresse
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingAddress(false)}
                      className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-anthracite-800"
                    >
                      Annuler
                    </button>
                  </div>
                  {geo && (
                    <p className="text-[10.5px] text-stone-500 dark:text-stone-400">
                      GPS conservé : {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* Optional details */}
            <section>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-stone-500 dark:text-stone-400">
                Détails du local <span className="font-normal text-stone-400">— facultatifs</span>
              </p>

              <div className="mt-2 grid grid-cols-3 gap-2">
                <NumberField
                  id="surface"
                  label="Surface"
                  unit="m²"
                  value={details.surface ?? ""}
                  onChange={(v) => onChangeDetails({ ...details, surface: v })}
                />
                <NumberField
                  id="facade"
                  label="Linéaire"
                  unit="m"
                  value={details.facadeLength ?? ""}
                  onChange={(v) => onChangeDetails({ ...details, facadeLength: v })}
                />
                <NumberField
                  id="ceiling"
                  label="Hauteur"
                  unit="m"
                  value={details.ceilingHeight ?? ""}
                  onChange={(v) => onChangeDetails({ ...details, ceilingHeight: v })}
                />
              </div>

              <div className="mt-3">
                <p className="mb-1.5 text-[11px] font-medium text-stone-500 dark:text-stone-400">Type de transaction</p>
                <div className="grid grid-cols-2 gap-2">
                  {TX_OPTIONS.map((opt) => {
                    const active = details.transactionType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          onChangeDetails({
                            ...details,
                            transactionType: active ? "" : opt.value,
                          })
                        }
                        className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                          active
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-stone-200 bg-white text-anthracite-700 hover:border-brand-300 hover:bg-brand-50 dark:border-anthracite-800 dark:bg-anthracite-800 dark:text-stone-200 dark:hover:border-brand-700 dark:hover:bg-brand-900/20"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3">
                <label htmlFor="capture-notes" className="mb-1.5 block text-[11px] font-medium text-stone-500 dark:text-stone-400">
                  Notes
                </label>
                <textarea
                  id="capture-notes"
                  rows={3}
                  value={details.notes ?? ""}
                  onChange={(e) => onChangeDetails({ ...details, notes: e.target.value })}
                  placeholder="Vitrine en travaux, enseigne « ABC », accès par cour…"
                  className="block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-900 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-100"
                />
              </div>
            </section>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="flex items-center gap-2 border-t border-stone-100 bg-white p-3 dark:border-anthracite-800 dark:bg-anthracite-900">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50 dark:border-anthracite-700 dark:bg-anthracite-800 dark:text-stone-200 dark:hover:bg-anthracite-700"
          >
            Passer
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-[2] rounded-xl bg-anthracite-900 px-4 py-3 text-sm font-semibold text-white hover:bg-anthracite-800 dark:bg-brand-500 dark:text-anthracite-950 dark:hover:bg-brand-400"
          >
            Valider les infos
          </button>
        </div>
      </div>
    </div>
  );
}

function NumberField({
  id,
  label,
  unit,
  value,
  onChange,
}: {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-[11px] font-medium text-stone-500 dark:text-stone-400">
        {label}
      </span>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step="0.1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="—"
          className="block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 pr-9 text-sm text-anthracite-900 placeholder:text-stone-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-100"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-stone-400 dark:text-stone-500">
          {unit}
        </span>
      </div>
    </label>
  );
}
