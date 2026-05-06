"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export function HomeContactForm() {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "w-full border border-white/15 bg-white/[0.04] px-4 py-3 font-sans text-sm text-white placeholder-stone-500 outline-none transition-colors focus:border-champagne-400 focus:bg-white/[0.06]";
  const labelClass =
    "mb-2 block font-sans text-[10px] tracking-[0.3em] uppercase text-stone-400";

  if (success) {
    return (
      <div className="border border-champagne-400/30 bg-white/[0.03] p-10 text-center backdrop-blur-sm">
        <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-champagne-400">
          Demande reçue
        </p>
        <h3 className="mt-4 font-serif text-2xl italic text-white sm:text-3xl">
          Merci, votre message est entre de bonnes mains.
        </h3>
        <p className="mx-auto mt-4 max-w-md font-sans text-sm leading-loose text-stone-300">
          Notre équipe vous répond personnellement sous 24 heures, avec la
          discrétion qui s&apos;impose.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-8 font-sans text-[10px] tracking-[0.3em] uppercase text-champagne-300 transition-colors hover:text-white"
        >
          Envoyer une autre demande
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm sm:p-10"
    >
      <div className="text-left">
        <p className="font-sans text-[10px] tracking-[0.4em] uppercase text-champagne-400">
          Formulaire de contact
        </p>
        <h3 className="mt-3 font-serif text-2xl italic text-white sm:text-3xl">
          Écrivez-nous en toute confidentialité
        </h3>
        <p className="mt-3 font-sans text-sm leading-relaxed text-stone-400">
          Réponse personnalisée sous 24 heures.
        </p>
      </div>

      {error && (
        <div className="mt-6 border border-red-500/30 bg-red-500/10 px-4 py-3 text-left font-sans text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-5 text-left sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className={labelClass}>
            Prénom *
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            autoComplete="given-name"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="lastName" className={labelClass}>
            Nom *
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            autoComplete="family-name"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>
            Téléphone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="company" className={labelClass}>
            Société / Enseigne
          </label>
          <input
            id="company"
            name="company"
            type="text"
            autoComplete="organization"
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="message" className={labelClass}>
            Votre projet *
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={4}
            placeholder="Type de bien recherché, quartier, surface, budget…"
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* Honeypot */}
      <div className="hidden" aria-hidden="true">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="mt-6 flex items-start gap-3 text-left font-sans text-xs leading-relaxed text-stone-400">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 flex-none cursor-pointer accent-champagne-500"
          required
        />
        <span>
          J&apos;accepte que mes informations soient utilisées pour traiter ma
          demande, conformément à la{" "}
          <Link
            href="/politique-confidentialite"
            className="text-champagne-300 underline-offset-2 hover:underline"
          >
            politique de confidentialité
          </Link>
          .
        </span>
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="group relative mt-8 inline-flex w-full items-center justify-center gap-3 overflow-hidden bg-champagne-500 px-12 py-4 font-sans text-[11px] tracking-[0.3em] uppercase text-anthracite-900 transition-colors duration-300 hover:bg-champagne-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <span
          aria-hidden
          className="animate-gleam pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/55 to-transparent"
        />
        <span className="relative">
          {isSubmitting ? "Envoi en cours…" : "Envoyer ma demande"}
        </span>
        {!isSubmitting && (
          <svg
            className="relative h-3 w-3 transition-transform duration-500 group-hover:translate-x-1"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
          </svg>
        )}
      </button>
    </form>
  );
}
