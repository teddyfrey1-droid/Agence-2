"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { CONTACT_TYPE_LABELS } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";

const typeOptions = Object.entries(CONTACT_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export default function NouveauContactPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email: formData.get("email") || undefined,
          phone: formData.get("phone") || undefined,
          mobile: formData.get("mobile") || undefined,
          type: formData.get("type"),
          company: formData.get("company") || undefined,
          position: formData.get("position") || undefined,
          notes: formData.get("notes") || undefined,
        }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Erreur"); }
      const contact = await res.json();
      addToast("Contact créé avec succès", "success");
      router.push(`/dashboard/contacts/${contact.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      addToast("Erreur lors de la création", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900">Nouveau contact</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="rounded-premium border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <Card>
          <CardHeader><h2 className="heading-card">Informations</h2></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="firstName" name="firstName" label="Prénom" required />
              <Input id="lastName" name="lastName" label="Nom" required />
            </div>
            <Select id="type" name="type" label="Type" options={typeOptions} placeholder="Sélectionnez..." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="email" name="email" type="email" label="Email" />
              <Input id="phone" name="phone" type="tel" label="Téléphone" />
            </div>
            <Input id="mobile" name="mobile" type="tel" label="Mobile" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="company" name="company" label="Société / Enseigne" />
              <Input id="position" name="position" label="Poste" />
            </div>
            <Textarea id="notes" name="notes" label="Notes" rows={3} />
          </CardContent>
        </Card>
        <div className="flex items-center gap-3">
          <Button type="submit" isLoading={isSubmitting}>Créer le contact</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
        </div>
      </form>
    </div>
  );
}
