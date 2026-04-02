"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { CONTACT_TYPE_LABELS } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";

const typeOptions = Object.entries(CONTACT_TYPE_LABELS).map(([value, label]) => ({ value, label }));

interface ContactData {
  id: string;
  firstName: string;
  lastName: string;
  type: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  position?: string;
  notes?: string;
}

export default function ModifierContactPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contact, setContact] = useState<ContactData | null>(null);

  useEffect(() => {
    async function fetchContact() {
      try {
        const res = await fetch(`/api/contacts/${params.id}`);
        if (!res.ok) throw new Error("Contact introuvable");
        const data = await res.json();
        setContact(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement");
      } finally {
        setIsLoading(false);
      }
    }
    fetchContact();
  }, [params.id]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch(`/api/contacts/${params.id}`, {
        method: "PATCH",
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
      addToast("Contact modifié avec succès", "success");
      router.push(`/dashboard/contacts/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      addToast("Erreur lors de la modification", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
        </div>
        <Card>
          <CardHeader>
            <div className="h-5 w-32 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-10 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
              <div className="h-10 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
            </div>
            <div className="h-10 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-10 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
              <div className="h-10 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
            </div>
            <div className="h-10 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-10 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
              <div className="h-10 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
            </div>
            <div className="h-20 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contact && error) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">Modifier le contact</h1>
        </div>
        <div className="rounded-premium border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">Modifier le contact</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="rounded-premium border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400">{error}</div>}
        <Card>
          <CardHeader><h2 className="heading-card">Informations</h2></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="firstName" name="firstName" label="Prénom" required defaultValue={contact?.firstName} />
              <Input id="lastName" name="lastName" label="Nom" required defaultValue={contact?.lastName} />
            </div>
            <Select id="type" name="type" label="Type" options={typeOptions} placeholder="Sélectionnez..." defaultValue={contact?.type} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="email" name="email" type="email" label="Email" defaultValue={contact?.email ?? ""} />
              <Input id="phone" name="phone" type="tel" label="Téléphone" defaultValue={contact?.phone ?? ""} />
            </div>
            <Input id="mobile" name="mobile" type="tel" label="Mobile" defaultValue={contact?.mobile ?? ""} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="company" name="company" label="Société / Enseigne" defaultValue={contact?.company ?? ""} />
              <Input id="position" name="position" label="Poste" defaultValue={contact?.position ?? ""} />
            </div>
            <Textarea id="notes" name="notes" label="Notes" rows={3} defaultValue={contact?.notes ?? ""} />
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
