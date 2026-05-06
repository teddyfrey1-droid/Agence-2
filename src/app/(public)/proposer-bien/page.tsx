"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/constants";

const propertyTypeOptions = Object.entries(PROPERTY_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

const transactionTypeOptions = Object.entries(TRANSACTION_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

export default function ProposerBienPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    if (formData.get("website")) {
      setIsSubmitting(false);
      return;
    }

    if (!consent) {
      setError(
        "Merci d'accepter la politique de confidentialité avant d'envoyer votre proposition."
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/properties/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          company: formData.get("company"),
          address: formData.get("address"),
          city: formData.get("city") || "Paris",
          propertyType: formData.get("propertyType") || undefined,
          transactionType: formData.get("transactionType") || undefined,
          surface: formData.get("surface")
            ? Number(formData.get("surface"))
            : undefined,
          price: formData.get("price")
            ? Number(formData.get("price"))
            : undefined,
          description: formData.get("description"),
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
              Proposer un bien
            </p>
            <h1 className="heading-display mt-2">
              Vous avez un local à proposer ?
            </h1>
            <p className="mt-4 text-lg text-anthracite-500">
              Propriétaire, bailleur ou mandataire, décrivez votre bien et notre
              équipe vous recontactera.
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
                  Proposition envoyée avec succès
                </h3>
                <p className="mt-2 text-sm text-emerald-600">
                  Merci pour votre proposition. Notre équipe va étudier votre
                  bien et vous recontactera rapidement.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                  <div className="rounded-premium border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Contact */}
                <div>
                  <h2 className="heading-card mb-4">Vos coordonnées</h2>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input id="firstName" name="firstName" label="Prénom" required />
                      <Input id="lastName" name="lastName" label="Nom" required />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input id="email" name="email" type="email" label="Email" required />
                      <Input id="phone" name="phone" type="tel" label="Téléphone" />
                    </div>
                    <Input id="company" name="company" label="Société (facultatif)" />
                  </div>
                </div>

                {/* Property */}
                <div>
                  <h2 className="heading-card mb-4">Votre bien</h2>
                  <div className="space-y-4">
                    <Input
                      id="address"
                      name="address"
                      label="Adresse du bien"
                      required
                      placeholder="Numéro et rue"
                    />
                    <Input
                      id="city"
                      name="city"
                      label="Ville"
                      defaultValue="Paris"
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Select
                        id="propertyType"
                        name="propertyType"
                        label="Type de bien"
                        options={propertyTypeOptions}
                        placeholder="Sélectionnez..."
                      />
                      <Select
                        id="transactionType"
                        name="transactionType"
                        label="Type de transaction"
                        options={transactionTypeOptions}
                        placeholder="Sélectionnez..."
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        id="surface"
                        name="surface"
                        type="number"
                        label="Surface (m²)"
                        min={0}
                      />
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        label="Prix / Loyer souhaité (€)"
                        min={0}
                      />
                    </div>

                    <Textarea
                      id="description"
                      name="description"
                      label="Description du bien"
                      placeholder="État, agencement, points forts, disponibilité..."
                      rows={4}
                    />
                  </div>
                </div>

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
                    pour traiter ma proposition de bien, conformément à la{" "}
                    <Link
                      href="/politique-confidentialite"
                      className="text-brand-600 underline hover:text-brand-700"
                    >
                      politique de confidentialité
                    </Link>
                    . Vous disposez d&apos;un droit d&apos;accès, de rectification
                    et de suppression de vos données.
                  </span>
                </label>

                <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full sm:w-auto">
                  Proposer mon bien
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
