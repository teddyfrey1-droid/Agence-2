"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUnsavedChanges } from "@/lib/hooks";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import {
  PROPERTY_TYPE_LABELS,
  TRANSACTION_TYPE_LABELS,
  PROPERTY_STATUS_LABELS,
} from "@/lib/constants";
import { useToast } from "@/components/ui/toast";

const propertyTypeOptions = Object.entries(PROPERTY_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);
const transactionTypeOptions = Object.entries(TRANSACTION_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);
const propertyStatusOptions = Object.entries(PROPERTY_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

const STEPS = [
  { label: "Général", shortLabel: "1" },
  { label: "Localisation", shortLabel: "2" },
  { label: "Prix & surface", shortLabel: "3" },
  { label: "Équipements", shortLabel: "4" },
];

interface PropertyData {
  id: string;
  title: string;
  type: string;
  transactionType: string;
  status: string;
  description: string | null;
  address: string | null;
  city: string | null;
  zipCode: string | null;
  district: string | null;
  surfaceTotal: number | null;
  floor: number | null;
  price: number | null;
  rentMonthly: number | null;
  charges: number | null;
  hasExtraction: boolean;
  hasTerrace: boolean;
  hasParking: boolean;
  hasLoadingDock: boolean;
  customEquipment: string | null;
}

export default function ModifierBienPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { addToast } = useToast();

  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  useUnsavedChanges(isDirty && !isSubmitting);

  const [formValues, setFormValues] = useState<PropertyData | null>(null);
  const [addressData, setAddressData] = useState({ city: "", zipCode: "", district: "" });
  const [customEquipments, setCustomEquipments] = useState<string[]>([]);
  const [customEquipInput, setCustomEquipInput] = useState("");
  const [checkedEquipments, setCheckedEquipments] = useState({
    hasExtraction: false,
    hasTerrace: false,
    hasParking: false,
    hasLoadingDock: false,
  });

  useEffect(() => {
    async function fetchProperty() {
      try {
        const res = await fetch(`/api/properties/${id}`);
        if (!res.ok) throw new Error("Bien introuvable");
        const data: PropertyData = await res.json();
        setFormValues(data);
        setAddressData({
          city: data.city || "",
          zipCode: data.zipCode || "",
          district: data.district || "",
        });
        setCheckedEquipments({
          hasExtraction: data.hasExtraction,
          hasTerrace: data.hasTerrace,
          hasParking: data.hasParking,
          hasLoadingDock: data.hasLoadingDock,
        });
        if (data.customEquipment) {
          setCustomEquipments(
            data.customEquipment.split(",").map((s) => s.trim()).filter(Boolean)
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
        addToast("Erreur lors du chargement du bien", "error");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function addCustomEquip() {
    const val = customEquipInput.trim();
    if (val && !customEquipments.includes(val)) {
      setCustomEquipments((prev) => [...prev, val]);
    }
    setCustomEquipInput("");
  }

  function nextStep() {
    if (step < STEPS.length - 1) setStep(step + 1);
  }
  function prevStep() {
    if (step > 0) setStep(step - 1);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          type: formData.get("type"),
          transactionType: formData.get("transactionType"),
          status: formData.get("status"),
          description: formData.get("description"),
          address: formData.get("address"),
          city: formData.get("city") || "Paris",
          zipCode: formData.get("zipCode"),
          district: formData.get("district"),
          surfaceTotal: formData.get("surfaceTotal") ? Number(formData.get("surfaceTotal")) : undefined,
          floor: formData.get("floor") ? Number(formData.get("floor")) : undefined,
          price: formData.get("price") ? Number(formData.get("price")) : undefined,
          rentMonthly: formData.get("rentMonthly") ? Number(formData.get("rentMonthly")) : undefined,
          charges: formData.get("charges") ? Number(formData.get("charges")) : undefined,
          hasExtraction: checkedEquipments.hasExtraction,
          hasTerrace: checkedEquipments.hasTerrace,
          hasParking: checkedEquipments.hasParking,
          hasLoadingDock: checkedEquipments.hasLoadingDock,
          customEquipment: customEquipments.length > 0 ? customEquipments.join(", ") : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la modification");
      }

      addToast("Bien modifié avec succès", "success");
      router.push(`/dashboard/biens/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      addToast("Erreur lors de la modification du bien", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <div className="h-8 w-48 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-700" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
        </div>
        <div className="flex items-center gap-2">
          {STEPS.map((_, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className="h-8 w-8 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700" />
              <div className="hidden h-3 w-16 animate-pulse rounded bg-stone-200 dark:bg-stone-700 sm:block" />
              {i < STEPS.length - 1 && (
                <div className="h-0.5 flex-1 rounded bg-stone-200 dark:bg-stone-700" />
              )}
            </div>
          ))}
        </div>
        <Card>
          <CardHeader>
            <div className="h-5 w-40 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-10 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-700" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-10 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-700" />
              <div className="h-10 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-700" />
            </div>
            <div className="h-24 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-700" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!formValues) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {error || "Bien introuvable"}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">
          Modifier le bien
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Modifiez les informations du bien.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <button
              type="button"
              onClick={() => setStep(i)}
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                i === step
                  ? "bg-brand-600 text-white ring-4 ring-brand-100 dark:ring-brand-900/30"
                  : i < step
                    ? "bg-brand-500 text-white"
                    : "bg-stone-200 text-stone-500 dark:bg-stone-700 dark:text-stone-400"
              }`}
            >
              {i < step ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </button>
            <span className={`hidden text-xs font-medium sm:inline ${i <= step ? "text-anthracite-800 dark:text-stone-200" : "text-stone-400 dark:text-stone-500"}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 rounded ${i < step ? "bg-brand-500" : "bg-stone-200 dark:bg-stone-700"}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} onChange={() => setIsDirty(true)} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {error}
          </div>
        )}

        {/* Step 1: General */}
        <div className={step === 0 ? "animate-scale-in" : "hidden"}>
          <Card>
            <CardHeader>
              <h2 className="heading-card">Informations générales</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input id="title" name="title" label="Titre" required placeholder="Ex: Boutique 45m² - Marais" defaultValue={formValues.title} />
              <div className="grid gap-4 sm:grid-cols-3">
                <Select id="type" name="type" label="Type de bien" required options={propertyTypeOptions} placeholder="Sélectionnez..." defaultValue={formValues.type} />
                <Select id="transactionType" name="transactionType" label="Transaction" required options={transactionTypeOptions} placeholder="Sélectionnez..." defaultValue={formValues.transactionType} />
                <Select id="status" name="status" label="Statut" required options={propertyStatusOptions} placeholder="Sélectionnez..." defaultValue={formValues.status} />
              </div>
              <Textarea id="description" name="description" label="Description" rows={4} defaultValue={formValues.description || ""} />
            </CardContent>
          </Card>
        </div>

        {/* Step 2: Location */}
        <div className={step === 1 ? "animate-scale-in" : "hidden"}>
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
                value={formValues.address || ""}
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
        </div>

        {/* Step 3: Price & Surface */}
        <div className={step === 2 ? "animate-scale-in" : "hidden"}>
          <Card>
            <CardHeader>
              <h2 className="heading-card">Caractéristiques &amp; prix</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Input id="surfaceTotal" name="surfaceTotal" type="number" label="Surface (m²)" min={0} defaultValue={formValues.surfaceTotal ?? ""} />
                <Input id="floor" name="floor" type="number" label="Étage" defaultValue={formValues.floor ?? ""} />
                <Input id="price" name="price" type="number" label="Prix (€)" min={0} defaultValue={formValues.price ?? ""} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input id="rentMonthly" name="rentMonthly" type="number" label="Loyer mensuel (€)" min={0} defaultValue={formValues.rentMonthly ?? ""} />
                <Input id="charges" name="charges" type="number" label="Charges (€/mois)" min={0} defaultValue={formValues.charges ?? ""} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Step 4: Equipments */}
        <div className={step === 3 ? "animate-scale-in" : "hidden"}>
          <Card>
            <CardHeader>
              <h2 className="heading-card">Équipements &amp; spécificités</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { name: "hasExtraction" as const, label: "Extraction" },
                  { name: "hasTerrace" as const, label: "Terrasse" },
                  { name: "hasParking" as const, label: "Parking" },
                  { name: "hasLoadingDock" as const, label: "Quai de déchargement" },
                ].map((eq) => (
                  <label
                    key={eq.name}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                      checkedEquipments[eq.name]
                        ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-900/30 dark:text-brand-300"
                        : "border-stone-200 hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-anthracite-800"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checkedEquipments[eq.name]}
                      onChange={(e) =>
                        setCheckedEquipments((prev) => ({
                          ...prev,
                          [eq.name]: e.target.checked,
                        }))
                      }
                      className="sr-only"
                    />
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
                      if (e.key === "Enter") { e.preventDefault(); addCustomEquip(); }
                    }}
                    placeholder="Ex: Climatisation, Cave..."
                    className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-800 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-200 dark:placeholder:text-stone-500"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addCustomEquip}>Ajouter</Button>
                </div>
                {customEquipments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {customEquipments.map((eq, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                        {eq}
                        <button type="button" onClick={() => setCustomEquipments((prev) => prev.filter((_, j) => j !== i))} className="ml-0.5 text-brand-400 hover:text-brand-600 dark:hover:text-brand-200">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <div>
            {step > 0 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                Précédent
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Annuler
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                Suivant
                <svg className="ml-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </Button>
            ) : (
              <Button type="submit" isLoading={isSubmitting}>
                Enregistrer
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
