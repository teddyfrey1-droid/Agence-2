"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TurnstileWidget } from "@/components/turnstile-widget";

// Note: metadata can't be exported from a "use client" file. The static
// metadata for /contact lives in `contact/layout.tsx`.

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  // Progressive disclosure: hide identity/phone fields until the visitor
  // chooses to share them. Keeps the form to 3 fields by default.
  const [extraFields, setExtraFields] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Honeypot check
    if (formData.get("website")) {
      return;
    }

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
          email: formData.get("email"),
          message: formData.get("message"),
          firstName: formData.get("firstName") || undefined,
          lastName: formData.get("lastName") || undefined,
          phone: formData.get("phone") || undefined,
          company: formData.get("company") || undefined,
          source: "contact-page",
          "cf-turnstile-response": turnstileToken || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
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

  return (
    <>
      <section className="bg-gradient-to-b from-white to-brand-50 py-12 dark:from-anthracite-950 dark:to-anthracite-900">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-brand-600 dark:text-brand-400">
              Contact
            </p>
            <h1 className="heading-display mt-2">Contactez-nous</h1>
            <p className="mt-4 text-lg text-anthracite-500 dark:text-stone-400">
              Une question, un projet ? Notre équipe est à votre écoute —
              réponse sous 24 h ouvrées.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-page">
          <div className="mx-auto max-w-2xl">
            {success ? (
              <div className="rounded-premium border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-700/50 dark:bg-emerald-900/30">
                <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
                  Message envoyé avec succès
                </h2>
                <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-300">
                  Nous avons bien reçu votre message. Notre équipe vous
                  recontactera sous 24 h ouvrées.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => setSuccess(false)}
                >
                  Envoyer un autre message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-premium border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
                    {error}
                  </div>
                )}

                {/* ── Required core ── */}
                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Email"
                  required
                  autoComplete="email"
                  placeholder="votre@email.fr"
                />

                <Textarea
                  id="message"
                  name="message"
                  label="Message"
                  required
                  minLength={10}
                  placeholder="Décrivez votre demande (local recherché, surface, quartier, projet de cession…)"
                  rows={5}
                />

                {/* ── Progressive disclosure: identity & phone ── */}
                {extraFields ? (
                  <div className="space-y-6 rounded-premium border border-stone-200 bg-stone-50/50 p-5 dark:border-anthracite-800 dark:bg-anthracite-900/40">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <Input
                        id="firstName"
                        name="firstName"
                        label="Prénom"
                        placeholder="Votre prénom"
                        autoComplete="given-name"
                      />
                      <Input
                        id="lastName"
                        name="lastName"
                        label="Nom"
                        placeholder="Votre nom"
                        autoComplete="family-name"
                      />
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        label="Téléphone"
                        placeholder="01 00 00 00 00"
                        autoComplete="tel"
                      />
                      <Input
                        id="company"
                        name="company"
                        label="Société / Enseigne"
                        placeholder="Facultatif"
                        autoComplete="organization"
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setExtraFields(true)}
                    className="text-sm font-medium text-brand-600 underline underline-offset-4 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    + Vous préférez être rappelé ? Ajouter nom & téléphone
                  </button>
                )}

                {/* Honeypot */}
                <div className="hidden" aria-hidden="true">
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                </div>

                {/* Anti-bot — only renders when site key is configured */}
                <TurnstileWidget
                  onVerify={setTurnstileToken}
                  onExpire={() => setTurnstileToken("")}
                />

                <label className="flex items-start gap-3 text-sm text-anthracite-600 dark:text-stone-300">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500 dark:border-stone-600 dark:bg-anthracite-800"
                    required
                  />
                  <span>
                    J&apos;accepte que les informations saisies soient utilisées
                    pour traiter ma demande, conformément à la{" "}
                    <Link
                      href="/politique-confidentialite"
                      className="text-brand-600 underline hover:text-brand-700 dark:text-brand-400"
                    >
                      politique de confidentialité
                    </Link>
                    . Vous disposez d&apos;un droit d&apos;accès, de rectification
                    et de suppression de vos données.
                  </span>
                </label>

                <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full sm:w-auto">
                  Envoyer le message
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
