"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Honeypot check
    if (formData.get("website")) {
      setIsSubmitting(false);
      return;
    }

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
