"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/constants";

const propertyTypeOptions = Object.entries(PROPERTY_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);
const transactionTypeOptions = Object.entries(TRANSACTION_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

export default function NouvelleDemandePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/search-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyTypes: selectedTypes,
          transactionType: formData.get("transactionType"),
          budgetMin: formData.get("budgetMin") ? Number(formData.get("budgetMin")) : undefined,
          budgetMax: formData.get("budgetMax") ? Number(formData.get("budgetMax")) : undefined,
          surfaceMin: formData.get("surfaceMin") ? Number(formData.get("surfaceMin")) : undefined,
          surfaceMax: formData.get("surfaceMax") ? Number(formData.get("surfaceMax")) : undefined,
          activity: formData.get("activity"),
          description: formData.get("description"),
          notes: formData.get("notes"),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la création");
      }

      const request = await res.json();
      router.push(`/dashboard/demandes/${request.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900">Nouvelle demande</h1>
        <p className="text-sm text-stone-500">Créez une nouvelle demande de recherche.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-premium border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        <Card>
          <CardHeader><h2 className="heading-card">Critères de recherche</h2></CardHeader>
          <CardContent className="space-y-4">
            <Select id="transactionType" name="transactionType" label="Type de transaction" required options={transactionTypeOptions} placeholder="Sélectionnez..." />

            <div>
              <p className="mb-2 text-sm font-medium text-anthracite-700">Type(s) de local</p>
              <div className="flex flex-wrap gap-2">
                {propertyTypeOptions.map((opt) => (
                  <button key={opt.value} type="button" onClick={() => toggleType(opt.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedTypes.includes(opt.value)
                        ? "border-brand-500 bg-brand-50 text-brand-800"
                        : "border-stone-300 bg-white text-stone-600 hover:border-stone-400"
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="surfaceMin" name="surfaceMin" type="number" label="Surface min (m²)" min={0} />
              <Input id="surfaceMax" name="surfaceMax" type="number" label="Surface max (m²)" min={0} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="budgetMin" name="budgetMin" type="number" label="Budget min (€)" min={0} />
              <Input id="budgetMax" name="budgetMax" type="number" label="Budget max (€)" min={0} />
            </div>

            <Input id="activity" name="activity" label="Activité envisagée" />
            <Textarea id="description" name="description" label="Description" rows={3} />
            <Textarea id="notes" name="notes" label="Notes internes" rows={2} />
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" isLoading={isSubmitting}>Créer la demande</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
        </div>
      </form>
    </div>
  );
}
