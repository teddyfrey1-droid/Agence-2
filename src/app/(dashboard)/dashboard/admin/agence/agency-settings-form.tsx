"use client";

import { useState, type FormEvent } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { AgencyInfo } from "@/lib/agency";

type FormState = Omit<AgencyInfo, "id">;

function toFormState(initial: AgencyInfo): FormState {
  return {
    name: initial.name ?? "",
    legalName: initial.legalName ?? "",
    legalForm: initial.legalForm ?? "",
    siret: initial.siret ?? "",
    capitalSocial: initial.capitalSocial ?? "",
    rcs: initial.rcs ?? "",
    tvaNumber: initial.tvaNumber ?? "",
    apeCode: initial.apeCode ?? "",
    address: initial.address ?? "",
    city: initial.city ?? "",
    zipCode: initial.zipCode ?? "",
    phone: initial.phone ?? "",
    email: initial.email ?? "",
    website: initial.website ?? "",
    description: initial.description ?? "",
    professionalCardNumber: initial.professionalCardNumber ?? "",
    professionalCardAuthority: initial.professionalCardAuthority ?? "",
    financialGuarantee: initial.financialGuarantee ?? "",
    professionalInsurance: initial.professionalInsurance ?? "",
    publicationDirector: initial.publicationDirector ?? "",
    mediator: initial.mediator ?? "",
    dpoContact: initial.dpoContact ?? "",
  };
}

export function AgencySettingsForm({ initial }: { initial: AgencyInfo }) {
  const [form, setForm] = useState<FormState>(toFormState(initial));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/admin/agency", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.issues) {
          const fe: Partial<Record<keyof FormState, string>> = {};
          for (const [k, v] of Object.entries(data.issues)) {
            const msgs = v as string[] | undefined;
            if (msgs && msgs.length > 0) {
              fe[k as keyof FormState] = msgs[0];
            }
          }
          setFieldErrors(fe);
        }
        setError(data.error || "Une erreur est survenue");
        return;
      }
      setSuccess("Informations enregistrées avec succès");
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">
          Informations de l&apos;agence
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Ces informations sont utilisées sur le site public (mentions légales,
          politique de confidentialité, footer, CGV…). Pensez à les maintenir à
          jour.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identité */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-anthracite-900 dark:text-stone-100">
              Identité
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Nom commercial, dénomination légale et description.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="name"
              label="Nom commercial *"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
              error={fieldErrors.name}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="legalName"
                label="Dénomination sociale"
                value={form.legalName ?? ""}
                onChange={(e) => update("legalName", e.target.value)}
                error={fieldErrors.legalName ?? undefined}
              />
              <Input
                id="legalForm"
                label="Forme juridique"
                placeholder="SAS, SARL, EURL…"
                value={form.legalForm ?? ""}
                onChange={(e) => update("legalForm", e.target.value)}
                error={fieldErrors.legalForm ?? undefined}
              />
            </div>
            <Textarea
              id="description"
              label="Description"
              rows={3}
              value={form.description ?? ""}
              onChange={(e) => update("description", e.target.value)}
              error={fieldErrors.description ?? undefined}
            />
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-anthracite-900 dark:text-stone-100">
              Contact
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Coordonnées affichées publiquement.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="address"
              label="Adresse"
              value={form.address ?? ""}
              onChange={(e) => update("address", e.target.value)}
              error={fieldErrors.address ?? undefined}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                id="zipCode"
                label="Code postal"
                value={form.zipCode ?? ""}
                onChange={(e) => update("zipCode", e.target.value)}
                error={fieldErrors.zipCode ?? undefined}
              />
              <Input
                id="city"
                label="Ville"
                value={form.city ?? ""}
                onChange={(e) => update("city", e.target.value)}
                className="sm:col-span-2"
                error={fieldErrors.city ?? undefined}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="phone"
                label="Téléphone"
                type="tel"
                value={form.phone ?? ""}
                onChange={(e) => update("phone", e.target.value)}
                error={fieldErrors.phone ?? undefined}
              />
              <Input
                id="email"
                label="Email"
                type="email"
                value={form.email ?? ""}
                onChange={(e) => update("email", e.target.value)}
                error={fieldErrors.email ?? undefined}
              />
            </div>
            <Input
              id="website"
              label="Site web"
              type="url"
              placeholder="https://www.exemple.fr"
              value={form.website ?? ""}
              onChange={(e) => update("website", e.target.value)}
              error={fieldErrors.website ?? undefined}
            />
          </CardContent>
        </Card>

        {/* Informations légales */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-anthracite-900 dark:text-stone-100">
              Informations légales et fiscales
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              SIRET, RCS, capital social, TVA… Affichées dans les mentions
              légales.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="siret"
                label="SIRET"
                placeholder="123 456 789 00012"
                value={form.siret ?? ""}
                onChange={(e) => update("siret", e.target.value)}
                error={fieldErrors.siret ?? undefined}
              />
              <Input
                id="apeCode"
                label="Code APE / NAF"
                placeholder="6831Z"
                value={form.apeCode ?? ""}
                onChange={(e) => update("apeCode", e.target.value)}
                error={fieldErrors.apeCode ?? undefined}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="rcs"
                label="RCS"
                placeholder="RCS Paris 123 456 789"
                value={form.rcs ?? ""}
                onChange={(e) => update("rcs", e.target.value)}
                error={fieldErrors.rcs ?? undefined}
              />
              <Input
                id="capitalSocial"
                label="Capital social"
                placeholder="10 000 €"
                value={form.capitalSocial ?? ""}
                onChange={(e) => update("capitalSocial", e.target.value)}
                error={fieldErrors.capitalSocial ?? undefined}
              />
            </div>
            <Input
              id="tvaNumber"
              label="N° TVA intracommunautaire"
              placeholder="FR12345678900"
              value={form.tvaNumber ?? ""}
              onChange={(e) => update("tvaNumber", e.target.value)}
              error={fieldErrors.tvaNumber ?? undefined}
            />
          </CardContent>
        </Card>

        {/* Professionnel réglementé */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-anthracite-900 dark:text-stone-100">
              Profession réglementée
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Carte professionnelle, garantie financière, assurance RC pro (loi
              Hoguet).
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="professionalCardNumber"
                label="N° de carte professionnelle"
                placeholder="CPI 7501 2024 000 000 000"
                value={form.professionalCardNumber ?? ""}
                onChange={(e) =>
                  update("professionalCardNumber", e.target.value)
                }
                error={fieldErrors.professionalCardNumber ?? undefined}
              />
              <Input
                id="professionalCardAuthority"
                label="Délivrée par"
                placeholder="CCI de Paris Île-de-France"
                value={form.professionalCardAuthority ?? ""}
                onChange={(e) =>
                  update("professionalCardAuthority", e.target.value)
                }
                error={fieldErrors.professionalCardAuthority ?? undefined}
              />
            </div>
            <Input
              id="financialGuarantee"
              label="Garantie financière"
              placeholder="Galian — 89 rue La Boétie, 75008 Paris — 500 000 €"
              value={form.financialGuarantee ?? ""}
              onChange={(e) => update("financialGuarantee", e.target.value)}
              error={fieldErrors.financialGuarantee ?? undefined}
            />
            <Input
              id="professionalInsurance"
              label="Assurance RC professionnelle"
              placeholder="MMA — contrat n°…"
              value={form.professionalInsurance ?? ""}
              onChange={(e) => update("professionalInsurance", e.target.value)}
              error={fieldErrors.professionalInsurance ?? undefined}
            />
          </CardContent>
        </Card>

        {/* Publication & RGPD */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-anthracite-900 dark:text-stone-100">
              Publication &amp; RGPD
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Directeur de la publication, médiateur de la consommation,
              contact DPO.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="publicationDirector"
              label="Directeur de la publication"
              value={form.publicationDirector ?? ""}
              onChange={(e) => update("publicationDirector", e.target.value)}
              error={fieldErrors.publicationDirector ?? undefined}
            />
            <Input
              id="mediator"
              label="Médiateur de la consommation"
              placeholder="Nom du médiateur — site web"
              value={form.mediator ?? ""}
              onChange={(e) => update("mediator", e.target.value)}
              error={fieldErrors.mediator ?? undefined}
            />
            <Input
              id="dpoContact"
              label="Contact DPO / Données personnelles"
              placeholder="dpo@votre-domaine.fr"
              value={form.dpoContact ?? ""}
              onChange={(e) => update("dpoContact", e.target.value)}
              error={fieldErrors.dpoContact ?? undefined}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setForm(toFormState(initial))}
            disabled={loading}
          >
            Réinitialiser
          </Button>
          <Button type="submit" isLoading={loading}>
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  );
}
