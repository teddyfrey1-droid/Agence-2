"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { DEAL_STAGE_LABELS } from "@/lib/constants";

const stageOptions = Object.entries(DEAL_STAGE_LABELS).map(([value, label]) => ({ value, label }));

export default function NouveauDossierPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          stage: formData.get("stage") || "PROSPECT",
          estimatedValue: formData.get("estimatedValue") ? Number(formData.get("estimatedValue")) : undefined,
          description: formData.get("description") || undefined,
        }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Erreur"); }
      const deal = await res.json();
      router.push(`/dashboard/dossiers/${deal.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold text-anthracite-900">Nouveau dossier</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="rounded-premium border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <Card>
          <CardHeader><h2 className="heading-card">Informations</h2></CardHeader>
          <CardContent className="space-y-4">
            <Input id="title" name="title" label="Titre du dossier" required />
            <Select id="stage" name="stage" label="Étape" options={stageOptions} />
            <Input id="estimatedValue" name="estimatedValue" type="number" label="Valeur estimée (€)" min={0} />
            <Textarea id="description" name="description" label="Description" rows={3} />
          </CardContent>
        </Card>
        <div className="flex items-center gap-3">
          <Button type="submit" isLoading={isSubmitting}>Créer le dossier</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
        </div>
      </form>
    </div>
  );
}
