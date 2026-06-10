"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowIcon,
  ConsentCheckbox,
  ErrorBanner,
  GleamButton,
  Honeypot,
  LuxInput,
  LuxTextarea,
  SuccessPanel,
} from "@/components/luxe-form";

export function ContactPageForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    if (formData.get("website")) return; // honeypot

    if (!consent) {
      setError(
        "Merci d'accepter la politique de confidentialité avant d'envoyer votre message."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contacts/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          company: formData.get("company"),
          message: formData.get("message"),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Une erreur est survenue");
      }

      setSuccess(true);
      form.reset();
      setConsent(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <SuccessPanel
        overline="Message reçu"
        title="Merci, votre message est entre de bonnes mains."
        description="Notre équipe vous répond personnellement sous 24 heures, avec la discrétion qui s'impose."
        action={
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="font-sans text-[10px] tracking-[0.3em] uppercase text-brand-700 transition-colors hover:text-brand-800 dark:text-champagne-300 dark:hover:text-champagne-200"
          >
            Envoyer un autre message
          </button>
        }
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-stone-200 bg-white p-8 sm:p-10 dark:border-stone-800 dark:bg-anthracite-900"
    >
      <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-champagne-600 dark:text-champagne-400">
        Formulaire de contact
      </p>
      <h2 className="mt-3 font-serif text-2xl italic text-anthracite-900 sm:text-3xl dark:text-stone-100">
        Écrivez-nous en toute confidentialité
      </h2>

      {error && (
        <div className="mt-6">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <LuxInput id="firstName" name="firstName" label="Prénom" required autoComplete="given-name" />
        <LuxInput id="lastName" name="lastName" label="Nom" required autoComplete="family-name" />
        <LuxInput id="email" name="email" type="email" label="Email" required autoComplete="email" />
        <LuxInput id="phone" name="phone" type="tel" label="Téléphone" autoComplete="tel" />
        <div className="sm:col-span-2">
          <LuxInput id="company" name="company" label="Société / Enseigne" autoComplete="organization" />
        </div>
        <div className="sm:col-span-2">
          <LuxTextarea
            id="message"
            name="message"
            label="Votre projet"
            required
            rows={5}
            placeholder="Type de bien recherché, quartier, surface, budget…"
          />
        </div>
      </div>

      <Honeypot />

      <div className="mt-6">
        <ConsentCheckbox checked={consent} onChange={setConsent} intent="ma demande" />
      </div>

      <GleamButton type="submit" disabled={isSubmitting} className="mt-8 w-full sm:w-auto">
        {isSubmitting ? "Envoi en cours…" : "Envoyer le message"}
        {!isSubmitting && (
          <ArrowIcon className="h-3 w-3 transition-transform duration-500 group-hover:translate-x-1" />
        )}
      </GleamButton>
    </form>
  );
}
