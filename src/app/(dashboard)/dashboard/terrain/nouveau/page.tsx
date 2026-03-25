"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";

const typeOptions = Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export default function NouveauTerrainPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
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
        }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Erreur"); }
      router.push("/dashboard/terrain");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold text-anthracite-900">Nouveau repérage</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="rounded-premium border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <Card>
          <CardHeader><h2 className="heading-card">Localisation</h2></CardHeader>
          <CardContent className="space-y-4">
            <Input id="address" name="address" label="Adresse" required placeholder="Numéro et rue" />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input id="city" name="city" label="Ville" defaultValue="Paris" />
              <Input id="zipCode" name="zipCode" label="Code postal" />
              <Input id="district" name="district" label="Arrondissement" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="heading-card">Détails</h2></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select id="propertyType" name="propertyType" label="Type estimé" options={typeOptions} placeholder="Sélectionnez..." />
              <Input id="surface" name="surface" type="number" label="Surface estimée (m²)" min={0} />
            </div>
            <Textarea id="notes" name="notes" label="Notes / observations" rows={4} placeholder="État de la vitrine, local vide, enseigne présente..." />
          </CardContent>
        </Card>
        <div className="flex items-center gap-3">
          <Button type="submit" isLoading={isSubmitting}>Enregistrer</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
        </div>
      </form>
    </div>
  );
}
