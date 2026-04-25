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
import { BusinessCardScanner, type BusinessCardResult } from "@/components/business-card-scanner";

const typeOptions = Object.entries(CONTACT_TYPE_LABELS).map(([value, label]) => ({ value, label }));

export default function NouveauContactPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    mobile: "",
    company: "",
    position: "",
    notes: "",
  });

  function update<K extends keyof typeof fields>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleCardExtracted(card: BusinessCardResult) {
    setFields((prev) => ({
      firstName: card.firstName || prev.firstName,
      lastName: card.lastName || prev.lastName,
      email: card.email || prev.email,
      phone: card.phone || prev.phone,
      mobile: card.mobile || prev.mobile,
      company: card.company || prev.company,
      position: card.position || prev.position,
      notes: card.address || card.website
        ? [prev.notes, card.address, card.website].filter(Boolean).join("\n")
        : prev.notes,
    }));
  }

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
          firstName: fields.firstName,
          lastName: fields.lastName,
          email: fields.email || undefined,
          phone: fields.phone || undefined,
          mobile: fields.mobile || undefined,
          type: formData.get("type"),
          company: fields.company || undefined,
          position: fields.position || undefined,
          notes: fields.notes || undefined,
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">Nouveau contact</h1>
        <BusinessCardScanner onExtracted={handleCardExtracted} />
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="rounded-premium border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <Card>
          <CardHeader><h2 className="heading-card">Informations</h2></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="firstName" name="firstName" label="Prénom" required value={fields.firstName} onChange={(e) => update("firstName", e.target.value)} />
              <Input id="lastName" name="lastName" label="Nom" required value={fields.lastName} onChange={(e) => update("lastName", e.target.value)} />
            </div>
            <Select id="type" name="type" label="Type" options={typeOptions} placeholder="Sélectionnez..." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="email" name="email" type="email" label="Email" value={fields.email} onChange={(e) => update("email", e.target.value)} />
              <Input id="phone" name="phone" type="tel" label="Téléphone" value={fields.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <Input id="mobile" name="mobile" type="tel" label="Mobile" value={fields.mobile} onChange={(e) => update("mobile", e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="company" name="company" label="Société / Enseigne" value={fields.company} onChange={(e) => update("company", e.target.value)} />
              <Input id="position" name="position" label="Poste" value={fields.position} onChange={(e) => update("position", e.target.value)} />
            </div>
            <Textarea id="notes" name="notes" label="Notes" rows={3} value={fields.notes} onChange={(e) => update("notes", e.target.value)} />
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
