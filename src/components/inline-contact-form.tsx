"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type Props = {
  /** Where on the site this form lives — recorded with the lead */
  source: "home-inline" | "biens-detail" | "footer";
  /** Optional override for placeholder copy in the message textarea */
  messagePlaceholder?: string;
  /** Visual variant — dark over a dark editorial section, or default light */
  variant?: "light" | "dark";
};

/**
 * Reduced 3-field contact form (email · message · consent) for inline
 * placement in editorial sections. The full /contact page collects the
 * same minimum — firstName/lastName/phone/company are derived later by
 * the agent. Honeypot + rate-limited via /api/contacts/public.
 */
export function InlineContactForm({
  source,
  messagePlaceholder = "Quelques mots sur votre projet…",
  variant = "light",
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const fd = new FormData(form);

    if (fd.get("website")) return; // honeypot
    if (!consent) {
      setError("Merci d'accepter la politique de confidentialité.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/contacts/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fd.get("email"),
          message: fd.get("message"),
          source,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur réseau");
      }
      setSuccess(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  const isDark = variant === "dark";

  if (success) {
    return (
      <div
        className={`mx-auto max-w-xl rounded-premium p-6 text-center ${
          isDark
            ? "border border-champagne-300/30 bg-champagne-500/10 text-champagne-100"
            : "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-700/50 dark:bg-emerald-900/30 dark:text-emerald-200"
        }`}
        role="status"
      >
        <p className="font-serif text-lg">Message reçu, merci.</p>
        <p className="mt-2 text-sm opacity-80">
          Nous revenons vers vous sous 24 h ouvrées.
        </p>
      </div>
    );
  }

  const inputBase = isDark
    ? "w-full bg-transparent border-b border-white/30 px-0 py-3 font-sans text-sm text-white placeholder:text-stone-400 focus:border-champagne-300 focus:outline-none"
    : "w-full rounded-premium border border-stone-300 bg-white px-4 py-3 font-sans text-sm text-anthracite-900 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-stone-700 dark:bg-anthracite-900 dark:text-stone-100";

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-5">
      {error && (
        <div
          className={`rounded-premium px-4 py-3 text-sm ${
            isDark
              ? "border border-red-300/40 bg-red-500/10 text-red-200"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
          role="alert"
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor={`inline-email-${source}`} className="sr-only">
          Adresse email
        </label>
        <input
          id={`inline-email-${source}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="votre@email.fr"
          className={inputBase}
        />
      </div>

      <div>
        <label htmlFor={`inline-message-${source}`} className="sr-only">
          Message
        </label>
        <textarea
          id={`inline-message-${source}`}
          name="message"
          required
          minLength={10}
          rows={3}
          placeholder={messagePlaceholder}
          className={`${inputBase} resize-none`}
        />
      </div>

      {/* Honeypot */}
      <div className="hidden" aria-hidden="true">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <label
        className={`flex items-start gap-3 text-xs leading-relaxed ${
          isDark ? "text-stone-400" : "text-anthracite-600 dark:text-stone-300"
        }`}
      >
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
          className="mt-0.5 h-4 w-4 rounded border-stone-400 text-brand-600 focus:ring-brand-500"
        />
        <span>
          J&apos;accepte que mes données soient utilisées pour traiter ma
          demande, conformément à la{" "}
          <Link
            href="/politique-confidentialite"
            className={
              isDark
                ? "text-champagne-200 underline underline-offset-2 hover:text-champagne-100"
                : "text-brand-600 underline hover:text-brand-700"
            }
          >
            politique de confidentialité
          </Link>
          .
        </span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 px-8 py-4 font-sans text-[11px] tracking-[0.3em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${
          isDark
            ? "bg-champagne-500 text-anthracite-900 hover:bg-champagne-400"
            : "bg-anthracite-900 text-white hover:bg-anthracite-800 dark:bg-stone-100 dark:text-anthracite-950 dark:hover:bg-stone-200"
        }`}
      >
        {submitting ? "Envoi en cours…" : "Envoyer"}
      </button>
    </form>
  );
}
