"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  PROPERTY_TYPE_LABELS,
  TRANSACTION_TYPE_LABELS,
  PARIS_DISTRICTS,
} from "@/lib/constants";

const propertyTypeOptions = Object.entries(PROPERTY_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

const transactionTypeOptions = Object.entries(TRANSACTION_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

const districtOptions = PARIS_DISTRICTS.map((d) => ({
  value: d,
  label: d,
}));

export default function RechercheLocalPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function toggleDistrict(district: string) {
    setSelectedDistricts((prev) =>
      prev.includes(district)
        ? prev.filter((d) => d !== district)
        : [...prev, district]
    );
  }

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

    if (selectedTypes.length === 0) {
      setError("Veuillez sélectionner au moins un type de local.");
      setIsSubmitting(false);
      return;
    }

    if (!consent) {
      setError(
        "Merci d'accepter la politique de confidentialité avant d'envoyer votre demande."
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/search-requests/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          company: formData.get("company"),
          activity: formData.get("activity"),
          propertyTypes: selectedTypes,
          transactionType: formData.get("transactionType"),
          budgetMin: formData.get("budgetMin")
            ? Number(formData.get("budgetMin"))
            : undefined,
          budgetMax: formData.get("budgetMax")
            ? Number(formData.get("budgetMax"))
            : undefined,
          surfaceMin: formData.get("surfaceMin")
            ? Number(formData.get("surfaceMin"))
            : undefined,
          surfaceMax: formData.get("surfaceMax")
            ? Number(formData.get("surfaceMax"))
            : undefined,
          districts: selectedDistricts,
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
              Recherche de local
            </p>
            <h1 className="heading-display mt-2">
              Décrivez votre recherche
            </h1>
            <p className="mt-4 text-lg text-anthracite-500">
              Remplissez ce formulaire et notre équipe vous recontactera sous 24h
              avec des propositions adaptées.
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
                  Demande envoyée avec succès
                </h3>
                <p className="mt-2 text-sm text-emerald-600">
                  Nous avons bien reçu votre demande de recherche. Notre équipe
                  l&apos;étudie et vous recontactera très rapidement.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                  <div className="rounded-premium border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Coordonnées */}
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
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input id="company" name="company" label="Société / Enseigne" />
                      <Input id="activity" name="activity" label="Activité envisagée" />
                    </div>
                  </div>
                </div>

                {/* Critères */}
                <div>
                  <h2 className="heading-card mb-4">Votre recherche</h2>
                  <div className="space-y-4">
                    <Select
                      id="transactionType"
                      name="transactionType"
                      label="Type de transaction"
                      required
                      options={transactionTypeOptions}
                      placeholder="Sélectionnez..."
                    />

                    <div>
                      <p className="mb-2 text-sm font-medium text-anthracite-700">
                        Type(s) de local recherché(s)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {propertyTypeOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleType(opt.value)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                              selectedTypes.includes(opt.value)
                                ? "border-brand-500 bg-brand-50 text-brand-800"
                                : "border-stone-300 bg-white text-stone-600 hover:border-stone-400"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        id="surfaceMin"
                        name="surfaceMin"
                        type="number"
                        label="Surface min (m²)"
                        min={0}
                      />
                      <Input
                        id="surfaceMax"
                        name="surfaceMax"
                        type="number"
                        label="Surface max (m²)"
                        min={0}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        id="budgetMin"
                        name="budgetMin"
                        type="number"
                        label="Budget min (€)"
                        min={0}
                      />
                      <Input
                        id="budgetMax"
                        name="budgetMax"
                        type="number"
                        label="Budget max (€)"
                        min={0}
                      />
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-medium text-anthracite-700">
                        Arrondissement(s) souhaité(s)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {districtOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => toggleDistrict(opt.value)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                              selectedDistricts.includes(opt.value)
                                ? "border-brand-500 bg-brand-50 text-brand-800"
                                : "border-stone-300 bg-white text-stone-600 hover:border-stone-400"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Textarea
                      id="description"
                      name="description"
                      label="Détails complémentaires"
                      placeholder="Décrivez votre projet, vos contraintes, vos besoins spécifiques..."
                      rows={4}
                    />
                  </div>
                </div>

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
                    pour traiter ma demande de recherche, conformément à la{" "}
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
                  Envoyer ma recherche
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
