"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { InlinePhotoPicker } from "@/components/photo-uploader";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";

const typeOptions = Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({ value, label }));

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
          propertyType: formData.get("propertyType") || undefined,
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

        {/* Détails */}
        <Card>
          <CardHeader><h2 className="heading-card">Détails</h2></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select id="propertyType" name="propertyType" label="Type estimé" options={typeOptions} placeholder="Sélectionnez..." />
              <Input id="surface" name="surface" type="number" label="Surface estimée (m²)" min={0} />
            </div>
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
