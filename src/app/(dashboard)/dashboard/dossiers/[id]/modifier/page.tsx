"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DEAL_STAGE_LABELS } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";
import { Confetti } from "@/components/confetti";
import { unlockAchievement } from "@/lib/achievements";

const stageOptions = Object.entries(DEAL_STAGE_LABELS).map(([value, label]) => ({ value, label }));

const statusOptions = [
  { value: "OUVERT", label: "Ouvert" },
  { value: "EN_COURS", label: "En cours" },
  { value: "GAGNE", label: "Gagn\u00e9" },
  { value: "PERDU", label: "Perdu" },
  { value: "ANNULE", label: "Annul\u00e9" },
];

interface DealData {
  id: string;
  title: string;
  stage: string;
  status: string;
  estimatedValue: number | null;
  finalValue: number | null;
  description: string | null;
  lostReason: string | null;
}

export default function ModifierDossierPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { addToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deal, setDeal] = useState<DealData | null>(null);
  const [status, setStatus] = useState("OUVERT");
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    async function fetchDeal() {
      try {
        const res = await fetch(`/api/deals/${params.id}`);
        if (!res.ok) throw new Error("Impossible de charger le dossier");
        const data = await res.json();
        setDeal(data);
        setStatus(data.status || "OUVERT");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur");
        addToast("Erreur lors du chargement du dossier", "error");
      } finally {
        setIsLoading(false);
      }
    }
    fetchDeal();
  }, [params.id, addToast]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/deals/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          stage: formData.get("stage"),
          status: formData.get("status"),
          estimatedValue: formData.get("estimatedValue") ? Number(formData.get("estimatedValue")) : undefined,
          finalValue: formData.get("finalValue") ? Number(formData.get("finalValue")) : undefined,
          description: formData.get("description") || undefined,
          lostReason: formData.get("status") === "PERDU" ? (formData.get("lostReason") || undefined) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      const becameWon = formData.get("status") === "GAGNE" && deal?.status !== "GAGNE";
      addToast(becameWon ? "Dossier gagn\u00e9 \u2014 bravo !" : "Dossier mis \u00e0 jour avec succ\u00e8s", "success");
      if (becameWon) {
        setCelebrate(true);
        unlockAchievement("first_won_deal");
        setTimeout(() => router.push(`/dashboard/dossiers/${params.id}`), 1800);
      } else {
        router.push(`/dashboard/dossiers/${params.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      addToast("Erreur lors de la mise \u00e0 jour", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400">
          {error || "Dossier introuvable"}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Confetti fire={celebrate} onDone={() => setCelebrate(false)} count={180} />
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">Modifier le dossier</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">Modifiez les informations du dossier.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <Card>
          <CardHeader><h2 className="heading-card">Informations</h2></CardHeader>
          <CardContent className="space-y-4">
            <Input id="title" name="title" label="Titre du dossier" required defaultValue={deal.title} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select id="stage" name="stage" label="\u00c9tape" options={stageOptions} defaultValue={deal.stage} />
              <Select
                id="status"
                name="status"
                label="Statut"
                options={statusOptions}
                defaultValue={deal.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="estimatedValue"
                name="estimatedValue"
                type="number"
                label="Valeur estim\u00e9e (\u20ac)"
                min={0}
                defaultValue={deal.estimatedValue ?? ""}
              />
              <Input
                id="finalValue"
                name="finalValue"
                type="number"
                label="Valeur finale (\u20ac)"
                min={0}
                defaultValue={deal.finalValue ?? ""}
              />
            </div>
            <Textarea
              id="description"
              name="description"
              label="Description"
              rows={3}
              defaultValue={deal.description ?? ""}
            />
            {status === "PERDU" && (
              <Textarea
                id="lostReason"
                name="lostReason"
                label="Raison de la perte"
                rows={3}
                defaultValue={deal.lostReason ?? ""}
              />
            )}
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
