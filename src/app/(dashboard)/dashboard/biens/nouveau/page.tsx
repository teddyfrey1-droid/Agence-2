"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/constants";

const propertyTypeOptions = Object.entries(PROPERTY_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

const transactionTypeOptions = Object.entries(TRANSACTION_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

export default function NouveauBienPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressData, setAddressData] = useState({ city: "Paris", zipCode: "", district: "" });
  const [customEquipments, setCustomEquipments] = useState<string[]>([]);
  const [customEquipInput, setCustomEquipInput] = useState("");

  function addCustomEquip() {
    const val = customEquipInput.trim();
    if (val && !customEquipments.includes(val)) {
      setCustomEquipments((prev) => [...prev, val]);
    }
    setCustomEquipInput("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          type: formData.get("type"),
          transactionType: formData.get("transactionType"),
          description: formData.get("description"),
          address: formData.get("address"),
          city: formData.get("city") || "Paris",
          zipCode: formData.get("zipCode"),
          district: formData.get("district"),
          surfaceTotal: formData.get("surfaceTotal")
            ? Number(formData.get("surfaceTotal"))
            : undefined,
          floor: formData.get("floor")
            ? Number(formData.get("floor"))
            : undefined,
          price: formData.get("price")
            ? Number(formData.get("price"))
            : undefined,
          rentMonthly: formData.get("rentMonthly")
            ? Number(formData.get("rentMonthly"))
            : undefined,
          charges: formData.get("charges")
            ? Number(formData.get("charges"))
            : undefined,
          hasExtraction: formData.get("hasExtraction") === "true",
          hasTerrace: formData.get("hasTerrace") === "true",
          hasParking: formData.get("hasParking") === "true",
          hasLoadingDock: formData.get("hasLoadingDock") === "true",
          customEquipment: customEquipments.length > 0 ? customEquipments.join(", ") : undefined,
        }),
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">
          Nouveau bien
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Ajoutez un nouveau bien à votre portefeuille.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <h2 className="heading-card">Informations générales</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input id="title" name="title" label="Titre" required placeholder="Ex: Boutique 45m² - Marais" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select id="type" name="type" label="Type de bien" required options={propertyTypeOptions} placeholder="Sélectionnez..." />
              <Select id="transactionType" name="transactionType" label="Transaction" required options={transactionTypeOptions} placeholder="Sélectionnez..." />
            </div>
            <Textarea id="description" name="description" label="Description" rows={4} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="heading-card">Localisation</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddressAutocomplete
              id="address"
              name="address"
              label="Adresse"
              placeholder="Numéro et rue"
              onSelect={(result) => {
                const arrNum = result.postcode.startsWith("75") ? result.postcode.slice(-2) : "";
                setAddressData({
                  city: result.city,
                  zipCode: result.postcode,
                  district: arrNum ? `${parseInt(arrNum)}${parseInt(arrNum) === 1 ? "er" : "e"} arrondissement` : "",
                });
              }}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input id="city" name="city" label="Ville" value={addressData.city} onChange={(e) => setAddressData((prev) => ({ ...prev, city: e.target.value }))} />
              <Input id="zipCode" name="zipCode" label="Code postal" value={addressData.zipCode} onChange={(e) => setAddressData((prev) => ({ ...prev, zipCode: e.target.value }))} />
              <Input id="district" name="district" label="Arrondissement" value={addressData.district} onChange={(e) => setAddressData((prev) => ({ ...prev, district: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="heading-card">Caractéristiques &amp; prix</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Input id="surfaceTotal" name="surfaceTotal" type="number" label="Surface (m²)" min={0} />
              <Input id="floor" name="floor" type="number" label="Étage" />
              <Input id="price" name="price" type="number" label="Prix (€)" min={0} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="rentMonthly" name="rentMonthly" type="number" label="Loyer mensuel (€)" min={0} />
              <Input id="charges" name="charges" type="number" label="Charges (€/mois)" min={0} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="heading-card">Équipements &amp; spécificités</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { name: "hasExtraction", label: "Extraction" },
                { name: "hasTerrace", label: "Terrasse" },
                { name: "hasParking", label: "Parking" },
                { name: "hasLoadingDock", label: "Quai de déchargement" },
              ].map((eq) => (
                <label
                  key={eq.name}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 px-3 py-2.5 text-sm transition-colors hover:bg-stone-50 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700 dark:border-stone-700 dark:hover:bg-anthracite-800 dark:has-[:checked]:border-brand-500 dark:has-[:checked]:bg-brand-900/30 dark:has-[:checked]:text-brand-300"
                >
                  <input type="checkbox" name={eq.name} value="true" className="sr-only" />
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {eq.label}
                </label>
              ))}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-anthracite-700 dark:text-stone-300">
                Équipements personnalisés
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customEquipInput}
                  onChange={(e) => setCustomEquipInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomEquip();
                    }
                  }}
                  placeholder="Ex: Climatisation, Cave..."
                  className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-800 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-200 dark:placeholder:text-stone-500"
                />
                <Button type="button" variant="outline" size="sm" onClick={addCustomEquip}>
                  Ajouter
                </Button>
              </div>
              {customEquipments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {customEquipments.map((eq, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                    >
                      {eq}
                      <button
                        type="button"
                        onClick={() => setCustomEquipments((prev) => prev.filter((_, j) => j !== i))}
                        className="ml-0.5 text-brand-400 hover:text-brand-600 dark:hover:text-brand-200"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
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
