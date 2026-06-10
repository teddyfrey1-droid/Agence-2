"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import {
  PROPERTY_TYPE_LABELS,
  TRANSACTION_TYPE_LABELS,
  PARIS_DISTRICTS,
} from "@/lib/constants";
import {
  ArrowIcon,
  BackButton,
  Chip,
  ConsentCheckbox,
  ErrorBanner,
  GleamButton,
  Honeypot,
  LuxInput,
  LuxTextarea,
  OptionCard,
  SuccessPanel,
  WizardProgress,
} from "@/components/luxe-form";

const STEPS = ["Projet", "Critères", "Contact"];

const TRANSACTION_META: Record<string, { icon: React.ReactNode; description: string }> = {
  LOCATION: {
    description: "Louer un local prêt à accueillir votre activité.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="8" cy="15" r="4" />
        <path d="M10.85 12.15L19 4M18 5l2 2M15 8l2 2" />
      </svg>
    ),
  },
  VENTE: {
    description: "Acquérir les murs d'un local commercial.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 21h18M5 21V8l7-5 7 5v13" />
        <path d="M9 21v-6h6v6M10 11h4" />
      </svg>
    ),
  },
  CESSION_BAIL: {
    description: "Reprendre un bail commercial existant.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 4h9a1 1 0 011 1v14a1 1 0 01-1 1H9" />
        <path d="M5 8l-3 4 3 4M2 12h12" />
      </svg>
    ),
  },
  FOND_DE_COMMERCE: {
    description: "Racheter une affaire et son emplacement.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 10l1-6h14l1 6" />
        <path d="M4 10a2.5 2.5 0 005 0 2.5 2.5 0 005 0 2.5 2.5 0 005 0" />
        <path d="M5 12v8h14v-8M9 20v-5h6v5" />
      </svg>
    ),
  },
};

const propertyTypeOptions = Object.entries(PROPERTY_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

export default function RechercheLocalPage() {
  const [step, setStep] = useState(0);
  const [transactionType, setTransactionType] = useState<string>("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  function scrollToTop() {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goTo(next: number) {
    setError(null);
    setStep(next);
    scrollToTop();
  }

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

  const allDistrictsSelected = selectedDistricts.length === PARIS_DISTRICTS.length;

  function toggleAllDistricts() {
    setSelectedDistricts(allDistrictsSelected ? [] : [...PARIS_DISTRICTS]);
  }

  function nextFromProject() {
    if (!transactionType) {
      setError("Sélectionnez le type de transaction envisagé.");
      return;
    }
    if (selectedTypes.length === 0) {
      setError("Sélectionnez au moins un type de local.");
      return;
    }
    goTo(1);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    if (formData.get("website")) return; // honeypot

    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    if (!firstName || !lastName || !email) {
      setError("Merci de renseigner votre prénom, votre nom et votre email.");
      return;
    }
    if (!consent) {
      setError(
        "Merci d'accepter la politique de confidentialité avant d'envoyer votre demande."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/search-requests/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone: formData.get("phone"),
          company: formData.get("company"),
          activity: formData.get("activity"),
          propertyTypes: selectedTypes,
          transactionType,
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
      scrollToTop();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {/* ── Hero — éditorial ── */}
      <section className="relative isolate overflow-hidden bg-gradient-premium py-20 sm:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(176,146,106,0.12),transparent_55%)]" />
        <div className="container-page text-center">
          <p className="label-overline dark:text-champagne-400">Recherche sur-mesure</p>
          <h1 className="mt-5 font-serif text-4xl font-normal italic tracking-tight text-anthracite-900 sm:text-5xl md:text-6xl dark:text-stone-100">
            Confiez-nous
            <span className="block not-italic font-semibold">votre cahier des charges</span>
          </h1>
          <div className="mx-auto mt-7 h-px w-12 bg-champagne-400" />
          <p className="mx-auto mt-7 max-w-xl font-sans text-base leading-relaxed text-anthracite-500 dark:text-stone-300">
            Trois étapes, deux minutes. Notre équipe active son réseau et vous
            recontacte sous 24&nbsp;h avec des propositions ciblées.
          </p>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20 dark:bg-anthracite-950">
        <div className="container-page">
          <div ref={topRef} className="mx-auto max-w-3xl scroll-mt-28">
            {success ? (
              <SuccessPanel
                overline="Demande reçue"
                title="Votre recherche est entre de bonnes mains."
                description="Notre équipe analyse votre brief et vous répond personnellement sous 24 heures, en toute confidentialité."
                nextSteps={[
                  { label: "Analyse", description: "Étude de votre brief par un consultant dédié." },
                  { label: "Activation", description: "Mobilisation de notre réseau et du off-market." },
                  { label: "Propositions", description: "Première sélection d'adresses ciblées." },
                ]}
                action={
                  <Link
                    href="/agence"
                    className="inline-flex items-center gap-2 font-sans text-[10px] tracking-[0.3em] uppercase text-brand-700 transition-colors hover:text-brand-800 dark:text-champagne-300 dark:hover:text-champagne-200"
                  >
                    Découvrir l&apos;agence
                    <ArrowIcon />
                  </Link>
                }
              />
            ) : (
              <>
                <WizardProgress steps={STEPS} current={step} onStepClick={goTo} />

                <form onSubmit={handleSubmit} className="mt-12">
                  {error && (
                    <div className="mb-8">
                      <ErrorBanner message={error} />
                    </div>
                  )}

                  {/* ════ Étape 1 — Votre projet ════ */}
                  <div className={step === 0 ? "animate-card-enter space-y-10" : "hidden"}>
                    <div>
                      <p className="font-serif text-xs italic text-stone-400 dark:text-stone-500">
                        01 — Votre projet
                      </p>
                      <h2 className="mt-2 font-serif text-2xl font-semibold text-anthracite-900 sm:text-3xl dark:text-stone-100">
                        Quel type de transaction&nbsp;?
                      </h2>
                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        {Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => (
                          <OptionCard
                            key={value}
                            active={transactionType === value}
                            onClick={() => setTransactionType(value)}
                            icon={TRANSACTION_META[value]?.icon}
                            title={label}
                            description={TRANSACTION_META[value]?.description}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <h2 className="font-serif text-2xl font-semibold text-anthracite-900 sm:text-3xl dark:text-stone-100">
                        Quel type de local&nbsp;?
                      </h2>
                      <p className="mt-2 font-sans text-sm text-stone-500 dark:text-stone-400">
                        Plusieurs choix possibles.
                      </p>
                      <div className="mt-5 flex flex-wrap gap-2.5">
                        {propertyTypeOptions.map((opt) => (
                          <Chip
                            key={opt.value}
                            active={selectedTypes.includes(opt.value)}
                            onClick={() => toggleType(opt.value)}
                          >
                            {opt.label}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    <LuxInput
                      id="activity"
                      name="activity"
                      label="Activité envisagée"
                      placeholder="Restauration, prêt-à-porter, services, bien-être…"
                    />

                    <div className="flex justify-end border-t border-stone-200 pt-8 dark:border-stone-800">
                      <GleamButton onClick={nextFromProject}>
                        Continuer
                        <ArrowIcon className="h-3 w-3 transition-transform duration-500 group-hover:translate-x-1" />
                      </GleamButton>
                    </div>
                  </div>

                  {/* ════ Étape 2 — Vos critères ════ */}
                  <div className={step === 1 ? "animate-card-enter space-y-10" : "hidden"}>
                    <div>
                      <p className="font-serif text-xs italic text-stone-400 dark:text-stone-500">
                        02 — Vos critères
                      </p>
                      <h2 className="mt-2 font-serif text-2xl font-semibold text-anthracite-900 sm:text-3xl dark:text-stone-100">
                        Affinez votre recherche
                      </h2>
                      <p className="mt-2 font-sans text-sm text-stone-500 dark:text-stone-400">
                        Tous ces champs sont facultatifs — plus ils sont précis,
                        plus nos propositions seront justes.
                      </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <LuxInput id="surfaceMin" name="surfaceMin" type="number" min={0} label="Surface min (m²)" placeholder="50" />
                      <LuxInput id="surfaceMax" name="surfaceMax" type="number" min={0} label="Surface max (m²)" placeholder="200" />
                      <LuxInput id="budgetMin" name="budgetMin" type="number" min={0} label="Budget min (€)" placeholder="2 000" />
                      <LuxInput id="budgetMax" name="budgetMax" type="number" min={0} label="Budget max (€)" placeholder="8 000" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <h3 className="font-serif text-xl font-semibold text-anthracite-900 dark:text-stone-100">
                          Arrondissements souhaités
                        </h3>
                        <button
                          type="button"
                          onClick={toggleAllDistricts}
                          className="font-sans text-[10px] tracking-[0.25em] uppercase text-brand-700 transition-colors hover:text-brand-800 dark:text-champagne-300 dark:hover:text-champagne-200"
                        >
                          {allDistrictsSelected ? "Tout effacer" : "Tout Paris"}
                        </button>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {PARIS_DISTRICTS.map((district) => (
                          <Chip
                            key={district}
                            active={selectedDistricts.includes(district)}
                            onClick={() => toggleDistrict(district)}
                          >
                            {district
                              .replace("er arrondissement", "ᵉʳ")
                              .replace("e arrondissement", "ᵉ")}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    <LuxTextarea
                      id="description"
                      name="description"
                      label="Détails complémentaires"
                      placeholder="Linéaire de vitrine, extraction, terrasse, flux piéton recherché…"
                      rows={4}
                    />

                    <div className="flex items-center justify-between border-t border-stone-200 pt-8 dark:border-stone-800">
                      <BackButton onClick={() => goTo(0)} />
                      <GleamButton onClick={() => goTo(2)}>
                        Continuer
                        <ArrowIcon className="h-3 w-3 transition-transform duration-500 group-hover:translate-x-1" />
                      </GleamButton>
                    </div>
                  </div>

                  {/* ════ Étape 3 — Vos coordonnées ════ */}
                  <div className={step === 2 ? "animate-card-enter space-y-10" : "hidden"}>
                    <div>
                      <p className="font-serif text-xs italic text-stone-400 dark:text-stone-500">
                        03 — Vos coordonnées
                      </p>
                      <h2 className="mt-2 font-serif text-2xl font-semibold text-anthracite-900 sm:text-3xl dark:text-stone-100">
                        Où vous joindre&nbsp;?
                      </h2>
                    </div>

                    {/* Récapitulatif du brief */}
                    {(transactionType || selectedTypes.length > 0) && (
                      <div className="border border-champagne-300/60 bg-champagne-50/50 p-6 dark:border-champagne-400/25 dark:bg-champagne-500/5">
                        <p className="font-sans text-[10px] font-semibold tracking-[0.3em] uppercase text-champagne-700 dark:text-champagne-400">
                          Votre brief
                        </p>
                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 font-sans text-sm text-anthracite-800 dark:text-stone-200">
                          {transactionType && (
                            <span>{TRANSACTION_TYPE_LABELS[transactionType]}</span>
                          )}
                          {selectedTypes.length > 0 && (
                            <span>
                              {selectedTypes
                                .map((t) => PROPERTY_TYPE_LABELS[t] ?? t)
                                .join(", ")}
                            </span>
                          )}
                          {selectedDistricts.length > 0 && (
                            <span>
                              {allDistrictsSelected
                                ? "Tout Paris"
                                : `${selectedDistricts.length} arrondissement${selectedDistricts.length > 1 ? "s" : ""}`}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid gap-5 sm:grid-cols-2">
                      <LuxInput id="firstName" name="firstName" label="Prénom" required autoComplete="given-name" />
                      <LuxInput id="lastName" name="lastName" label="Nom" required autoComplete="family-name" />
                      <LuxInput id="email" name="email" type="email" label="Email" required autoComplete="email" />
                      <LuxInput id="phone" name="phone" type="tel" label="Téléphone" autoComplete="tel" />
                      <div className="sm:col-span-2">
                        <LuxInput id="company" name="company" label="Société / Enseigne" autoComplete="organization" />
                      </div>
                    </div>

                    <Honeypot />

                    <ConsentCheckbox
                      checked={consent}
                      onChange={setConsent}
                      intent="ma demande de recherche"
                    />

                    <div className="flex items-center justify-between border-t border-stone-200 pt-8 dark:border-stone-800">
                      <BackButton onClick={() => goTo(1)} />
                      <GleamButton type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Envoi en cours…" : "Envoyer ma recherche"}
                        {!isSubmitting && (
                          <ArrowIcon className="h-3 w-3 transition-transform duration-500 group-hover:translate-x-1" />
                        )}
                      </GleamButton>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
