"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PROPERTY_TYPES = [
  { value: "BOUTIQUE", label: "Boutique" },
  { value: "BUREAU", label: "Bureau" },
  { value: "LOCAL_COMMERCIAL", label: "Local commercial" },
  { value: "LOCAL_ACTIVITE", label: "Local d'activité" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "HOTEL", label: "Hôtel" },
  { value: "ENTREPOT", label: "Entrepôt" },
  { value: "PARKING", label: "Parking" },
  { value: "TERRAIN", label: "Terrain" },
  { value: "IMMEUBLE", label: "Immeuble" },
];

const TRANSACTION_TYPES = [
  { value: "VENTE", label: "Vente murs commerciaux" },
  { value: "LOCATION", label: "Location pure" },
  { value: "CESSION_BAIL", label: "Cession de bail" },
  { value: "FOND_DE_COMMERCE", label: "Fond de commerce" },
];

const DISTRICTS = [
  "1er", "2e", "3e", "4e", "5e", "6e", "7e", "8e", "9e", "10e",
  "11e", "12e", "13e", "14e", "15e", "16e", "17e", "18e", "19e", "20e",
];

export function SearchRequestForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [transactionType, setTransactionType] = useState("LOCATION");
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [needs, setNeeds] = useState({ extraction: false, terrace: false, parking: false });

  function toggleType(value: string) {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  }

  function toggleDistrict(value: string) {
    setSelectedDistricts((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedTypes.length === 0) {
      setError("Sélectionnez au moins un type de bien");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/search-requests/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyTypes: selectedTypes,
          transactionType,
          budgetMin: formData.get("budgetMin") ? Number(formData.get("budgetMin")) : undefined,
          budgetMax: formData.get("budgetMax") ? Number(formData.get("budgetMax")) : undefined,
          surfaceMin: formData.get("surfaceMin") ? Number(formData.get("surfaceMin")) : undefined,
          surfaceMax: formData.get("surfaceMax") ? Number(formData.get("surfaceMax")) : undefined,
          districts: selectedDistricts.map((d) => `${d} arrondissement`),
          needsExtraction: needs.extraction || undefined,
          needsTerrace: needs.terrace || undefined,
          needsParking: needs.parking || undefined,
          description: formData.get("description") || undefined,
          // Public fields for contact creation
          firstName: formData.get("firstName") || "",
          lastName: formData.get("lastName") || "",
          email: formData.get("email") || "",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la création");
      }

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur interne");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
          <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-anthracite-900 dark:text-stone-100">Demande envoyée !</h3>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Nous analysons vos critères et vous proposerons des biens correspondants.
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setSuccess(false)}>
          Créer une autre demande
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Property Types */}
      <div>
        <label className="mb-2 block text-sm font-medium text-anthracite-700 dark:text-stone-300">
          Type de bien recherché *
        </label>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => toggleType(type.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedTypes.includes(type.value)
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-900/30 dark:text-brand-300"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-400 dark:hover:border-stone-500"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Type */}
      <div>
        <label className="mb-2 block text-sm font-medium text-anthracite-700 dark:text-stone-300">
          Type de transaction
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TRANSACTION_TYPES.map((tt) => (
            <button
              key={tt.value}
              type="button"
              onClick={() => setTransactionType(tt.value)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                transactionType === tt.value
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-900/30 dark:text-brand-300"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-400"
              }`}
            >
              {tt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div className="grid grid-cols-2 gap-3">
        <Input id="budgetMin" name="budgetMin" type="number" label="Budget min (€)" placeholder="50 000" />
        <Input id="budgetMax" name="budgetMax" type="number" label="Budget max (€)" placeholder="500 000" />
      </div>

      {/* Surface */}
      <div className="grid grid-cols-2 gap-3">
        <Input id="surfaceMin" name="surfaceMin" type="number" label="Surface min (m²)" placeholder="50" />
        <Input id="surfaceMax" name="surfaceMax" type="number" label="Surface max (m²)" placeholder="200" />
      </div>

      {/* Districts */}
      <div>
        <label className="mb-2 block text-sm font-medium text-anthracite-700 dark:text-stone-300">
          Arrondissements souhaités
        </label>
        <div className="flex flex-wrap gap-1.5">
          {DISTRICTS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDistrict(d)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedDistricts.includes(d)
                  ? "bg-brand-500 text-white dark:bg-brand-400 dark:text-anthracite-950"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-anthracite-800 dark:text-stone-400 dark:hover:bg-anthracite-700"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Needs */}
      <div>
        <label className="mb-2 block text-sm font-medium text-anthracite-700 dark:text-stone-300">
          Besoins spécifiques
        </label>
        <div className="flex flex-wrap gap-3">
          {[
            { key: "extraction" as const, label: "Extraction" },
            { key: "terrace" as const, label: "Terrasse" },
            { key: "parking" as const, label: "Parking" },
          ].map((need) => (
            <label key={need.key} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={needs[need.key]}
                onChange={(e) => setNeeds((prev) => ({ ...prev, [need.key]: e.target.checked }))}
                className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500 dark:border-stone-600 dark:bg-anthracite-800"
              />
              <span className="text-sm text-anthracite-700 dark:text-stone-300">{need.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-anthracite-700 dark:text-stone-300">
          Description (optionnel)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Décrivez votre projet, votre activité..."
          className="block w-full rounded-premium border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-anthracite-900 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-100 dark:placeholder:text-stone-500"
        />
      </div>

      {/* Contact info (hidden fields auto-filled, or visible for non-logged users) */}
      <input type="hidden" name="firstName" value="" />
      <input type="hidden" name="lastName" value="" />
      <input type="hidden" name="email" value="" />

      <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
        Envoyer ma demande
      </Button>
    </form>
  );
}
