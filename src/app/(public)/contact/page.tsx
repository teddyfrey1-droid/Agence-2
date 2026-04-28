"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// Note: metadata can't be exported from a "use client" file. The static
// metadata for /contact lives in `contact/layout.tsx`.

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

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
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          company: formData.get("company"),
          message: formData.get("message"),
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
      <section className="bg-gradient-to-b from-white to-brand-50 py-12">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-brand-600">
              Contact
            </p>
            <h1 className="heading-display mt-2">Contactez-nous</h1>
            <p className="mt-4 text-lg text-anthracite-500">
              Une question, un projet ? Notre équipe est à votre écoute.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-page">
          <div className="mx-auto max-w-2xl">
            {success ? (
              <div className="rounded-premium border border-emerald-200 bg-emerald-50 p-8 text-center">
                <h3 className="text-lg font-semibold text-emerald-800">
                  Message envoyé avec succès
                </h3>
                <p className="mt-2 text-sm text-emerald-600">
                  Nous avons bien reçu votre message. Notre équipe vous
                  recontactera dans les plus brefs délais.
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
                  <div className="rounded-premium border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="grid gap-6 sm:grid-cols-2">
                  <Input
                    id="firstName"
                    name="firstName"
                    label="Prénom"
                    required
                    placeholder="Votre prénom"
                  />
                  <Input
                    id="lastName"
                    name="lastName"
                    label="Nom"
                    required
                    placeholder="Votre nom"
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    label="Email"
                    required
                    placeholder="votre@email.com"
                  />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    label="Téléphone"
                    placeholder="01 00 00 00 00"
                  />
                </div>

                <Input
                  id="company"
                  name="company"
                  label="Société / Enseigne"
                  placeholder="Nom de votre société (facultatif)"
                />

                <Textarea
                  id="message"
                  name="message"
                  label="Message"
                  required
                  placeholder="Décrivez votre demande..."
                  rows={5}
                />

                {/* Honeypot */}
                <div className="hidden" aria-hidden="true">
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                </div>

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
                      className="text-brand-600 underline hover:text-brand-700"
                    >
                      politique de confidentialité
                    </Link>
                    . Les données marquées d&apos;un astérisque sont
                    obligatoires. Vous disposez d&apos;un droit d&apos;accès, de
                    rectification et de suppression de vos données.
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
