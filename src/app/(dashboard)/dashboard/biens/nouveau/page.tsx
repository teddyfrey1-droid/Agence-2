"use client";

import { useState, useCallback, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  PROPERTY_TYPE_LABELS,
  TRANSACTION_TYPE_LABELS,
  PARIS_DISTRICTS,
} from "@/lib/constants";

const transactionTypeOptions = Object.entries(TRANSACTION_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

const confidentialityOptions = [
  { value: "PUBLIC", label: "Public" },
  { value: "RESTREINT", label: "Restreint" },
  { value: "CONFIDENTIEL", label: "Confidentiel" },
];

const districtOptions = PARIS_DISTRICTS.map((d) => ({
  value: d,
  label: d,
}));

// Map zip code → Paris arrondissement
function getDistrictFromZipCode(zip: string): string | null {
  if (zip.length === 5 && zip.startsWith("75")) {
    const arr = parseInt(zip.slice(2), 10);
    if (arr >= 1 && arr <= 20) {
      return PARIS_DISTRICTS[arr - 1];
    }
  }
  return null;
}

// Property type icons for quick select
const PROPERTY_TYPES = [
  { value: "BOUTIQUE", label: "Boutique", icon: "🏪" },
  { value: "BUREAU", label: "Bureau", icon: "🏢" },
  { value: "LOCAL_COMMERCIAL", label: "Local commercial", icon: "🏬" },
  { value: "LOCAL_ACTIVITE", label: "Local d'activité", icon: "🏭" },
  { value: "RESTAURANT", label: "Restaurant", icon: "🍽️" },
  { value: "HOTEL", label: "Hôtel", icon: "🏨" },
  { value: "ENTREPOT", label: "Entrepôt", icon: "📦" },
  { value: "PARKING", label: "Parking", icon: "🅿️" },
  { value: "TERRAIN", label: "Terrain", icon: "🏗️" },
  { value: "IMMEUBLE", label: "Immeuble", icon: "🏛️" },
  { value: "AUTRE", label: "Autre", icon: "📋" },
];

interface CheckboxToggleProps {
  id: string;
  label: string;
  sublabel?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function CheckboxToggle({ id, label, sublabel, checked, onChange }: CheckboxToggleProps) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center gap-3 rounded-premium border p-3 transition-all ${
        checked
          ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
          : "border-stone-200 bg-white hover:border-stone-300"
      }`}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
          checked
            ? "border-brand-500 bg-brand-500 text-white"
            : "border-stone-300 bg-white"
        }`}
      >
        {checked && (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div>
        <span className="text-sm font-medium text-anthracite-800">{label}</span>
        {sublabel && <span className="block text-xs text-stone-500">{sublabel}</span>}
      </div>
    </label>
  );
}

export default function NouveauBienPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [propertyType, setPropertyType] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("Paris");

  // Feature toggles
  const [hasExtraction, setHasExtraction] = useState(false);
  const [hasTerrace, setHasTerrace] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [hasLoadingDock, setHasLoadingDock] = useState(false);

  // Conditional detail fields
  const [extractionSize, setExtractionSize] = useState("");
  const [terraceSize, setTerraceSize] = useState("");

  // Auto-detect arrondissement from zip code
  const handleZipCodeChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setZipCode(value);

      const detected = getDistrictFromZipCode(value);
      if (detected) {
        setDistrict(detected);
        setCity("Paris");
      }
    },
    []
  );

  // Show rent fields for location types
  const isLocation = transactionType === "LOCATION" || transactionType === "SOUS_LOCATION";
  const isVente = transactionType === "VENTE" || transactionType === "CESSION_BAIL";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const body: Record<string, unknown> = {
        title: formData.get("title"),
        type: propertyType,
        transactionType,
        description: formData.get("description") || undefined,
        confidentiality: formData.get("confidentiality") || undefined,

        // Localisation
        address: formData.get("address") || undefined,
        city,
        zipCode: zipCode || undefined,
        district: district || undefined,
        quarter: formData.get("quarter") || undefined,

        // Surfaces
        surfaceTotal: formData.get("surfaceTotal")
          ? Number(formData.get("surfaceTotal"))
          : undefined,
        surfaceMin: formData.get("surfaceMin")
          ? Number(formData.get("surfaceMin"))
          : undefined,
        surfaceMax: formData.get("surfaceMax")
          ? Number(formData.get("surfaceMax"))
          : undefined,

        // Caractéristiques
        floor: formData.get("floor")
          ? Number(formData.get("floor"))
          : undefined,
        totalFloors: formData.get("totalFloors")
          ? Number(formData.get("totalFloors"))
          : undefined,
        facadeLength: formData.get("facadeLength")
          ? Number(formData.get("facadeLength"))
          : undefined,
        ceilingHeight: formData.get("ceilingHeight")
          ? Number(formData.get("ceilingHeight"))
          : undefined,

        // Options
        hasExtraction,
        hasTerrace,
        hasParking,
        hasLoadingDock,

        // Financier
        price: formData.get("price")
          ? Number(formData.get("price"))
          : undefined,
        rentMonthly: formData.get("rentMonthly")
          ? Number(formData.get("rentMonthly"))
          : undefined,
        rentYearly: formData.get("rentYearly")
          ? Number(formData.get("rentYearly"))
          : undefined,
        charges: formData.get("charges")
          ? Number(formData.get("charges"))
          : undefined,
        deposit: formData.get("deposit")
          ? Number(formData.get("deposit"))
          : undefined,
        fees: formData.get("fees")
          ? Number(formData.get("fees"))
          : undefined,
      };

      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la création");
      }

      const property = await res.json();
      router.push(`/dashboard/biens/${property.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900">
          Nouveau bien
        </h1>
        <p className="text-sm text-stone-500">
          Remplissez les informations ci-dessous. Les cases cochables vous font gagner du temps.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-premium border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── TYPE DE BIEN ── */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">Type de bien</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {PROPERTY_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setPropertyType(pt.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-premium border p-3 text-center transition-all ${
                    propertyType === pt.value
                      ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                      : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50"
                  }`}
                >
                  <span className="text-2xl">{pt.icon}</span>
                  <span className="text-xs font-medium text-anthracite-700">{pt.label}</span>
                </button>
              ))}
            </div>
            {!propertyType && (
              <p className="mt-2 text-xs text-stone-400">Sélectionnez le type de bien</p>
            )}
          </CardContent>
        </Card>

        {/* ── TRANSACTION & TITRE ── */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">Informations générales</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Transaction type as buttons */}
            <div>
              <label className="mb-2 block text-sm font-medium text-anthracite-700">
                Type de transaction
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {transactionTypeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTransactionType(opt.value)}
                    className={`rounded-premium border px-4 py-2.5 text-sm font-medium transition-all ${
                      transactionType === opt.value
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-stone-200 bg-white text-anthracite-700 hover:border-stone-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              id="title"
              name="title"
              label="Titre de l'annonce"
              required
              placeholder={
                propertyType
                  ? `Ex: ${PROPERTY_TYPE_LABELS[propertyType]} 45m² - Marais`
                  : "Ex: Boutique 45m² - Marais"
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                id="confidentiality"
                name="confidentiality"
                label="Confidentialité"
                options={confidentialityOptions}
                placeholder="Public"
              />
              <div />
            </div>

            <Textarea
              id="description"
              name="description"
              label="Description"
              rows={3}
              placeholder="Décrivez le bien en quelques lignes (emplacement, état, atouts...)"
            />
          </CardContent>
        </Card>

        {/* ── LOCALISATION ── */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">Localisation</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="address"
              name="address"
              label="Adresse"
              placeholder="12 rue de Rivoli"
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                id="zipCode"
                name="zipCode"
                label="Code postal"
                value={zipCode}
                onChange={handleZipCodeChange}
                placeholder="75001"
                maxLength={5}
              />
              <Input
                id="city"
                name="city"
                label="Ville"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <Select
                id="district"
                name="district"
                label="Arrondissement"
                options={districtOptions}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Auto-détecté..."
              />
            </div>
            <Input
              id="quarter"
              name="quarter"
              label="Quartier"
              placeholder="Ex: Le Marais, Saint-Germain, Opéra..."
            />
          </CardContent>
        </Card>

        {/* ── SURFACES & CARACTÉRISTIQUES ── */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">Surfaces & caractéristiques</h2>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                id="surfaceTotal"
                name="surfaceTotal"
                type="number"
                label="Surface totale (m²)"
                min={0}
                placeholder="45"
              />
              <Input
                id="surfaceMin"
                name="surfaceMin"
                type="number"
                label="Surface min (m²)"
                min={0}
                placeholder="Optionnel"
              />
              <Input
                id="surfaceMax"
                name="surfaceMax"
                type="number"
                label="Surface max (m²)"
                min={0}
                placeholder="Optionnel"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <Input
                id="floor"
                name="floor"
                type="number"
                label="Étage"
                placeholder="0 = RDC"
              />
              <Input
                id="totalFloors"
                name="totalFloors"
                type="number"
                label="Nb d'étages total"
                min={1}
                placeholder="5"
              />
              <Input
                id="facadeLength"
                name="facadeLength"
                type="number"
                label="Linéaire façade (m)"
                min={0}
                step="0.1"
                placeholder="6.5"
              />
              <Input
                id="ceilingHeight"
                name="ceilingHeight"
                type="number"
                label="Hauteur plafond (m)"
                min={0}
                step="0.1"
                placeholder="3.2"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── ÉQUIPEMENTS & OPTIONS ── */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">Équipements & spécificités</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <CheckboxToggle
                  id="hasExtraction"
                  label="Extraction"
                  sublabel="Gaine d'extraction existante"
                  checked={hasExtraction}
                  onChange={setHasExtraction}
                />
                {hasExtraction && (
                  <div className="ml-8">
                    <Input
                      id="extractionSize"
                      type="text"
                      label="Diamètre / taille extraction"
                      placeholder="Ex: Ø 400mm, double flux..."
                      value={extractionSize}
                      onChange={(e) => setExtractionSize(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <CheckboxToggle
                  id="hasTerrace"
                  label="Droit de terrasse"
                  sublabel="Terrasse ou droit existant"
                  checked={hasTerrace}
                  onChange={setHasTerrace}
                />
                {hasTerrace && (
                  <div className="ml-8">
                    <Input
                      id="terraceSize"
                      type="text"
                      label="Taille terrasse"
                      placeholder="Ex: 15m², 6 tables..."
                      value={terraceSize}
                      onChange={(e) => setTerraceSize(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <CheckboxToggle
                id="hasParking"
                label="Parking / stationnement"
                sublabel="Place(s) de parking ou accès"
                checked={hasParking}
                onChange={setHasParking}
              />

              <CheckboxToggle
                id="hasLoadingDock"
                label="Quai de déchargement"
                sublabel="Accès livraison poids lourds"
                checked={hasLoadingDock}
                onChange={setHasLoadingDock}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── FINANCIER ── */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">
              {isLocation ? "Loyer & charges" : isVente ? "Prix & frais" : "Financier"}
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Vente fields */}
            {(isVente || !transactionType) && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="price"
                  name="price"
                  type="number"
                  label="Prix de vente (€)"
                  min={0}
                  placeholder="350 000"
                />
                <Input
                  id="fees"
                  name="fees"
                  type="number"
                  label="Honoraires (€)"
                  min={0}
                  placeholder="Optionnel"
                />
              </div>
            )}

            {/* Location fields */}
            {(isLocation || !transactionType) && (
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  id="rentMonthly"
                  name="rentMonthly"
                  type="number"
                  label="Loyer mensuel HT (€)"
                  min={0}
                  placeholder="2 500"
                />
                <Input
                  id="rentYearly"
                  name="rentYearly"
                  type="number"
                  label="Loyer annuel HT (€)"
                  min={0}
                  placeholder="30 000"
                />
                <Input
                  id="deposit"
                  name="deposit"
                  type="number"
                  label="Dépôt de garantie (€)"
                  min={0}
                  placeholder="Optionnel"
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="charges"
                name="charges"
                type="number"
                label="Charges (€/mois)"
                min={0}
                placeholder="Optionnel"
              />
              {!isVente && !isLocation && (
                <Input
                  id="fees2"
                  name="fees"
                  type="number"
                  label="Honoraires (€)"
                  min={0}
                  placeholder="Optionnel"
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── ACTIONS ── */}
        <div className="flex items-center gap-3 pb-8">
          <Button type="submit" isLoading={isSubmitting}>
            Créer le bien
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
