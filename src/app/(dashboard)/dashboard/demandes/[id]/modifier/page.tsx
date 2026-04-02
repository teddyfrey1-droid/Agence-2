"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  PROPERTY_TYPE_LABELS,
  TRANSACTION_TYPE_LABELS,
  SEARCH_REQUEST_STATUS_LABELS,
} from "@/lib/constants";
import { useToast } from "@/components/ui/toast";

const propertyTypeOptions = Object.entries(PROPERTY_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);
const transactionTypeOptions = Object.entries(TRANSACTION_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);
const statusOptions = Object.entries(SEARCH_REQUEST_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

export default function ModifierDemandePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const [formValues, setFormValues] = useState({
    transactionType: "",
    surfaceMin: "",
    surfaceMax: "",
    budgetMin: "",
    budgetMax: "",
    activity: "",
    status: "",
    description: "",
    notes: "",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/search-requests/${params.id}`);
        if (!res.ok) throw new Error("Impossible de charger la demande");
        const data = await res.json();

        setFormValues({
          transactionType: data.transactionType ?? "",
          surfaceMin: data.surfaceMin != null ? String(data.surfaceMin) : "",
          surfaceMax: data.surfaceMax != null ? String(data.surfaceMax) : "",
          budgetMin: data.budgetMin != null ? String(data.budgetMin) : "",
          budgetMax: data.budgetMax != null ? String(data.budgetMax) : "",
          activity: data.activity ?? "",
          status: data.status ?? "",
          description: data.description ?? "",
          notes: data.notes ?? "",
        });
        setSelectedTypes(data.propertyTypes ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
        addToast("Erreur lors du chargement", "error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function handleChange(field: string, value: string) {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/search-requests/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyTypes: selectedTypes,
          transactionType: formValues.transactionType || undefined,
          budgetMin: formValues.budgetMin ? Number(formValues.budgetMin) : undefined,
          budgetMax: formValues.budgetMax ? Number(formValues.budgetMax) : undefined,
          surfaceMin: formValues.surfaceMin ? Number(formValues.surfaceMin) : undefined,
          surfaceMax: formValues.surfaceMax ? Number(formValues.surfaceMax) : undefined,
          activity: formValues.activity || undefined,
          status: formValues.status || undefined,
          description: formValues.description || undefined,
          notes: formValues.notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      addToast("Demande mise à jour avec succès", "success");
      router.push(`/dashboard/demandes/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      addToast("Erreur lors de la mise à jour", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <div className="h-8 w-64 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-stone-100 dark:bg-stone-800" />
        </div>
        <Card>
          <CardHeader>
            <div className="h-5 w-40 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-stone-100 dark:bg-stone-800" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">
          Modifier la demande
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Modifiez les informations de la demande de recherche.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-premium border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <h2 className="heading-card">Critères de recherche</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              id="transactionType"
              name="transactionType"
              label="Type de transaction"
              required
              options={transactionTypeOptions}
              placeholder="Sélectionnez..."
              value={formValues.transactionType}
              onChange={(e) => handleChange("transactionType", e.target.value)}
            />

            <div>
              <p className="mb-2 text-sm font-medium text-anthracite-700 dark:text-stone-300">
                Type(s) de local
              </p>
              <div className="flex flex-wrap gap-2">
                {propertyTypeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleType(opt.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedTypes.includes(opt.value)
                        ? "border-brand-500 bg-brand-50 text-brand-800 dark:border-brand-400 dark:bg-brand-950 dark:text-brand-300"
                        : "border-stone-300 bg-white text-stone-600 hover:border-stone-400 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-stone-500"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="surfaceMin"
                name="surfaceMin"
                type="number"
                label="Surface min (m²)"
                min={0}
                value={formValues.surfaceMin}
                onChange={(e) => handleChange("surfaceMin", e.target.value)}
              />
              <Input
                id="surfaceMax"
                name="surfaceMax"
                type="number"
                label="Surface max (m²)"
                min={0}
                value={formValues.surfaceMax}
                onChange={(e) => handleChange("surfaceMax", e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="budgetMin"
                name="budgetMin"
                type="number"
                label="Budget min (€)"
                min={0}
                value={formValues.budgetMin}
                onChange={(e) => handleChange("budgetMin", e.target.value)}
              />
              <Input
                id="budgetMax"
                name="budgetMax"
                type="number"
                label="Budget max (€)"
                min={0}
                value={formValues.budgetMax}
                onChange={(e) => handleChange("budgetMax", e.target.value)}
              />
            </div>

            <Input
              id="activity"
              name="activity"
              label="Activité envisagée"
              value={formValues.activity}
              onChange={(e) => handleChange("activity", e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="heading-card">Statut et notes</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              id="status"
              name="status"
              label="Statut"
              options={statusOptions}
              placeholder="Sélectionnez..."
              value={formValues.status}
              onChange={(e) => handleChange("status", e.target.value)}
            />

            <Textarea
              id="description"
              name="description"
              label="Description"
              rows={3}
              value={formValues.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
            <Textarea
              id="notes"
              name="notes"
              label="Notes internes"
              rows={2}
              value={formValues.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" isLoading={isSubmitting}>
            Enregistrer
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
