"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { InlinePhotoPicker } from "@/components/photo-uploader";
import { useToast } from "@/components/ui/toast";

// ── Transaction type squares ──
const TERRAIN_TYPES = [
  {
    value: "LOCATION",
    label: "Location",
    icon: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
    color: "emerald",
  },
  {
    value: "VENTE",
    label: "Vente mur",
    icon: "M3 3h12M3 7.5h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12",
    color: "blue",
  },
  {
    value: "CESSION_BAIL",
    label: "Bail à céder",
    icon: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
    color: "violet",
  },
  {
    value: "FOND_DE_COMMERCE",
    label: "Fonds",
    icon: "M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z",
    color: "amber",
  },
  {
    value: "",
    label: "Autres",
    icon: "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "stone",
  },
] as const;

const COLOR_MAP: Record<string, { active: string; idle: string; icon: string }> = {
  emerald: {
    active: "border-emerald-500 bg-emerald-500 text-white",
    idle: "border-stone-100 bg-white hover:border-emerald-200 hover:bg-emerald-50 dark:border-stone-700 dark:bg-anthracite-800",
    icon: "text-emerald-500",
  },
  blue: {
    active: "border-blue-500 bg-blue-500 text-white",
    idle: "border-stone-100 bg-white hover:border-blue-200 hover:bg-blue-50 dark:border-stone-700 dark:bg-anthracite-800",
    icon: "text-blue-500",
  },
  violet: {
    active: "border-violet-500 bg-violet-500 text-white",
    idle: "border-stone-100 bg-white hover:border-violet-200 hover:bg-violet-50 dark:border-stone-700 dark:bg-anthracite-800",
    icon: "text-violet-500",
  },
  amber: {
    active: "border-amber-500 bg-amber-500 text-white",
    idle: "border-stone-100 bg-white hover:border-amber-200 hover:bg-amber-50 dark:border-stone-700 dark:bg-anthracite-800",
    icon: "text-amber-500",
  },
  stone: {
    active: "border-stone-500 bg-stone-500 text-white",
    idle: "border-stone-100 bg-white hover:border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:bg-anthracite-800",
    icon: "text-stone-400",
  },
};

async function compressAndUpload(file: File, entityId: string): Promise<string> {
  // Client-side compression via Canvas
  const compressed = await new Promise<File>((resolve) => {
    if (file.type === "image/heic" || file.type === "image/heif") { resolve(file); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const MAX = 1920;
      if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX; }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) { resolve(file); return; }
        const c = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
        resolve(c.size < file.size ? c : file);
      }, "image/jpeg", 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });

  const formData = new FormData();
  formData.append("file", compressed);
  formData.append("entityType", "fieldSpotting");
  formData.append("entityId", entityId);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Erreur upload");
  }
  const data = await res.json();
  return data.url as string;
}

export default function NouveauTerrainPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionType, setTransactionType] = useState<string>("");
  const [addressData, setAddressData] = useState({ city: "Paris", zipCode: "", district: "", address: "" });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);

  async function handleGeolocate() {
    if (!navigator.geolocation) {
      addToast("Géolocalisation non supportée par votre navigateur", "error");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        try {
          const res = await fetch(
            `https://api-adresse.data.gouv.fr/reverse/?lon=${longitude}&lat=${latitude}`
          );
          const data = await res.json();
          if (data.features && data.features.length > 0) {
            const props = data.features[0].properties;
            const arrNum = props.postcode?.startsWith("75") ? props.postcode.slice(-2) : "";
            setAddressData({
              address: props.name || props.label || "",
              city: props.city || "Paris",
              zipCode: props.postcode || "",
              district: arrNum ? `${parseInt(arrNum)}${parseInt(arrNum) === 1 ? "er" : "e"} arrondissement` : "",
            });
            addToast("Position trouvée !", "success");
          }
        } catch {
          addToast("Adresse trouvée partiellement", "info");
        }
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) addToast("Accès à la localisation refusé. Activez la géolocalisation.", "error");
        else addToast("Impossible de déterminer votre position", "error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      // 1 — Create the field spotting record
      const res = await fetch("/api/field-spotting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: formData.get("address"),
          city: formData.get("city") || "Paris",
          zipCode: formData.get("zipCode") || undefined,
          district: formData.get("district") || undefined,
          transactionType: transactionType || undefined,
          surface: formData.get("surface") ? Number(formData.get("surface")) : undefined,
          notes: formData.get("notes") || undefined,
          latitude: coords?.lat || undefined,
          longitude: coords?.lng || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      const spot = await res.json();

      // 2 — Upload photos if any (in parallel for speed)
      if (pendingPhotos.length > 0) {
        addToast("Upload des photos en cours…", "info");
        await Promise.allSettled(
          pendingPhotos.map((file) => compressAndUpload(file, spot.id))
        );
      }

      addToast("Repérage enregistré !", "success");
      router.push("/dashboard/terrain");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      addToast("Erreur lors de la création", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">Nouveau repérage</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">Repérez un local directement depuis le terrain.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {error}
          </div>
        )}

        {/* GPS */}
        <Card>
          <CardContent className="py-4">
            <button
              type="button"
              onClick={handleGeolocate}
              disabled={isLocating}
              className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-brand-300 bg-brand-50/50 px-4 py-4 text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-100/50 dark:border-brand-700 dark:bg-brand-900/20 dark:text-brand-300 dark:hover:border-brand-600"
            >
              {isLocating ? (
                <>
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm font-medium">Localisation en cours…</span>
                </>
              ) : (
                <>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-semibold">Me localiser automatiquement</p>
                    <p className="text-xs opacity-70">Remplira l&apos;adresse via votre position GPS</p>
                  </div>
                </>
              )}
            </button>
            {coords && (
              <p className="mt-2 text-center text-xs text-stone-400 dark:text-stone-500">
                GPS : {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Adresse */}
        <Card>
          <CardHeader><h2 className="heading-card">Localisation</h2></CardHeader>
          <CardContent className="space-y-4">
            <AddressAutocomplete
              id="address"
              name="address"
              label="Adresse"
              required
              placeholder="Numéro et rue, ou nom du commerce..."
              value={addressData.address}
              onSelect={(result) => {
                const arrNum = result.postcode.startsWith("75") ? result.postcode.slice(-2) : "";
                setAddressData({
                  address: result.label,
                  city: result.city,
                  zipCode: result.postcode,
                  district: arrNum ? `${parseInt(arrNum)}${parseInt(arrNum) === 1 ? "er" : "e"} arrondissement` : "",
                });
                if (result.x && result.y) setCoords({ lat: result.y, lng: result.x });
              }}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input id="city" name="city" label="Ville" value={addressData.city} onChange={(e) => setAddressData((prev) => ({ ...prev, city: e.target.value }))} />
              <Input id="zipCode" name="zipCode" label="Code postal" value={addressData.zipCode} onChange={(e) => setAddressData((prev) => ({ ...prev, zipCode: e.target.value }))} />
              <Input id="district" name="district" label="Arrondissement" value={addressData.district} onChange={(e) => setAddressData((prev) => ({ ...prev, district: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        {/* Type — carrés tactiles */}
        <Card>
          <CardHeader><h2 className="heading-card">Type</h2></CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {TERRAIN_TYPES.map((t) => {
                const active = transactionType === t.value;
                const c = COLOR_MAP[t.color];
                return (
                  <button
                    key={t.value || "autres"}
                    type="button"
                    onClick={() => setTransactionType(active ? "" : t.value)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-1 py-3 text-center transition-all active:scale-95 ${
                      active ? c.active : c.idle
                    }`}
                  >
                    <svg
                      className={`h-6 w-6 flex-shrink-0 ${active ? "text-white" : c.icon}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
                    </svg>
                    <span className={`text-[10px] font-semibold leading-tight ${active ? "text-white" : "text-anthracite-700 dark:text-stone-300"}`}>
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Détails */}
        <Card>
          <CardHeader><h2 className="heading-card">Détails</h2></CardHeader>
          <CardContent className="space-y-4">
            <Input id="surface" name="surface" type="number" label="Surface estimée (m²)" min={0} />
            <Textarea id="notes" name="notes" label="Notes / observations" rows={3} placeholder="État de la vitrine, local vide, enseigne présente..." />
          </CardContent>
        </Card>

        {/* Photos — directement dans le formulaire */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">Photos</h2>
            <p className="text-xs text-stone-400 dark:text-stone-500">Ajoutez jusqu&apos;à 10 photos, compressées automatiquement.</p>
          </CardHeader>
          <CardContent>
            <InlinePhotoPicker onFilesChange={setPendingPhotos} />
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? "Enregistrement…" : "Enregistrer"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
        </div>
      </form>
    </div>
  );
}
