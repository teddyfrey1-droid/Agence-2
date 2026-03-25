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

export default function NouveauBienPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <h1 className="text-2xl font-semibold text-anthracite-900">
          Nouveau bien
        </h1>
        <p className="text-sm text-stone-500">
          Ajoutez un nouveau bien à votre portefeuille.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-premium border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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
            <Input id="address" name="address" label="Adresse" />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input id="city" name="city" label="Ville" defaultValue="Paris" />
              <Input id="zipCode" name="zipCode" label="Code postal" />
              <Input id="district" name="district" label="Arrondissement" />
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
