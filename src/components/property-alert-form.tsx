"use client";

import { useState, type FormEvent } from "react";
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import {
  ArrowIcon,
  Chip,
  ConsentCheckbox,
  ErrorBanner,
  GleamButton,
  Honeypot,
  LuxInput,
  LuxSelect,
} from "@/components/luxe-form";

const transactionOptions = Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

/**
 * Public "new listing alert" subscription form.
 * `defaultDistricts` lets quartier pages pre-scope the alert.
 */
export function PropertyAlertForm({ defaultDistricts = [] }: { defaultDistricts?: string[] }) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    if (formData.get("website")) return; // honeypot

    if (!consent) {
      setError("Merci d'accepter la politique de confidentialité pour activer votre alerte.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/alerts/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          transactionType: formData.get("transactionType") || undefined,
          propertyTypes: selectedTypes,
          districts: defaultDistricts,
          budgetMax: formData.get("budgetMax") ? Number(formData.get("budgetMax")) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Une erreur est survenue");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="animate-scale-in border border-champagne-400/40 bg-white p-8 text-center dark:border-champagne-400/30 dark:bg-anthracite-950">
        <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-champagne-600 dark:text-champagne-400">
          Alerte activée
        </p>
        <h3 className="mt-3 font-serif text-xl italic text-anthracite-900 dark:text-stone-100">
          Vous serez prévenu dès la prochaine mise en ligne.
        </h3>
        <p className="mx-auto mt-3 max-w-sm font-sans text-xs leading-relaxed text-stone-500 dark:text-stone-400">
          Chaque email contient un lien de désinscription en un clic.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-stone-200 bg-white p-7 sm:p-9 dark:border-stone-800 dark:bg-anthracite-950"
    >
      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <LuxInput
          id="alert-email"
          name="email"
          type="email"
          label="Votre email"
          required
          placeholder="vous@exemple.fr"
          autoComplete="email"
        />
        <LuxSelect
          id="alert-transaction"
          name="transactionType"
          label="Transaction"
          options={transactionOptions}
          placeholder="Toutes"
        />
      </div>

      <div className="mt-6">
        <p className="mb-3 font-sans text-[10px] font-semibold tracking-[0.28em] uppercase text-stone-500 dark:text-stone-400">
          Types de locaux <span className="normal-case tracking-normal text-stone-400">(tous si vide)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
            <Chip key={value} active={selectedTypes.includes(value)} onClick={() => toggleType(value)}>
              {label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <LuxInput
          id="alert-budget"
          name="budgetMax"
          type="number"
          min={0}
          label="Budget max (€)"
          placeholder="Facultatif"
        />
      </div>

      <Honeypot />

      <div className="mt-6">
        <ConsentCheckbox checked={consent} onChange={setConsent} intent="mon alerte email" />
      </div>

      <GleamButton type="submit" disabled={isSubmitting} className="mt-7 w-full sm:w-auto">
        {isSubmitting ? "Activation…" : "Activer mon alerte"}
        {!isSubmitting && (
          <ArrowIcon className="h-3 w-3 transition-transform duration-500 group-hover:translate-x-1" />
        )}
      </GleamButton>
    </form>
  );
}
