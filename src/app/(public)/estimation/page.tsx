"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/constants";
import {
  ArrowIcon,
  BackButton,
  Chip,
  ConsentCheckbox,
  ErrorBanner,
  GleamButton,
  Honeypot,
  LuxInput,
  OptionCard,
  SuccessPanel,
  WizardProgress,
} from "@/components/luxe-form";

const STEPS = ["Votre local", "Votre projet", "Contact"];

const TRANSACTION_META: Record<string, { icon: React.ReactNode; description: string }> = {
  VENTE: {
    description: "Connaître la valeur des murs.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 21h18M5 21V8l7-5 7 5v13" />
        <path d="M9 21v-6h6v6M10 11h4" />
      </svg>
    ),
  },
  LOCATION: {
    description: "Évaluer le loyer de marché.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="8" cy="15" r="4" />
        <path d="M10.85 12.15L19 4M18 5l2 2M15 8l2 2" />
      </svg>
    ),
  },
  CESSION_BAIL: {
    description: "Valoriser votre droit au bail.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 4h9a1 1 0 011 1v14a1 1 0 01-1 1H9" />
        <path d="M5 8l-3 4 3 4M2 12h12" />
      </svg>
    ),
  },
  FOND_DE_COMMERCE: {
    description: "Estimer la valeur de votre affaire.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 10l1-6h14l1 6" />
        <path d="M4 10a2.5 2.5 0 005 0 2.5 2.5 0 005 0 2.5 2.5 0 005 0" />
        <path d="M5 12v8h14v-8M9 20v-5h6v5" />
      </svg>
    ),
  },
};

export default function EstimationPage() {
  const [step, setStep] = useState(0);
  const [propertyType, setPropertyType] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function scrollToTop() {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goTo(next: number) {
    setError(null);
    setStep(next);
    scrollToTop();
  }

  function nextFromLocal() {
    const form = formRef.current;
    const address = form ? String(new FormData(form).get("address") ?? "").trim() : "";
    if (!propertyType) {
      setError("Sélectionnez le type de votre local.");
      return;
    }
    if (!address) {
      setError("Indiquez l'adresse du local à estimer.");
      return;
    }
    goTo(1);
  }

  function nextFromProject() {
    if (!transactionType) {
      setError("Sélectionnez ce que vous souhaitez estimer.");
      return;
    }
    goTo(2);
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
      setError("Merci d'accepter la politique de confidentialité avant l'envoi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const details = String(formData.get("details") ?? "").trim();
      const res = await fetch("/api/properties/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone: formData.get("phone"),
          address: formData.get("address"),
          city: formData.get("city") || "Paris",
          propertyType,
          transactionType,
          surface: formData.get("surface") ? Number(formData.get("surface")) : undefined,
          description: [
            "⚡ Demande d'estimation express (site public).",
            `Estimation souhaitée : ${TRANSACTION_TYPE_LABELS[transactionType] || transactionType}.`,
            details,
          ]
            .filter(Boolean)
            .join("\n"),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
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
      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden bg-gradient-premium py-20 sm:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(176,146,106,0.12),transparent_55%)]" />
        <div className="container-page text-center">
          <p className="label-overline dark:text-champagne-400">Estimation express</p>
          <h1 className="mt-5 font-serif text-4xl font-normal italic tracking-tight text-anthracite-900 sm:text-5xl md:text-6xl dark:text-stone-100">
            Que vaut
            <span className="block not-italic font-semibold">votre local&nbsp;?</span>
          </h1>
          <div className="mx-auto mt-7 h-px w-12 bg-champagne-400" />
          <p className="mx-auto mt-7 max-w-xl font-sans text-base leading-relaxed text-anthracite-500 dark:text-stone-300">
            Trois questions, une minute. Un expert vous transmet un avis de
            valeur sous 48&nbsp;h — gratuit, confidentiel, sans engagement.
          </p>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20 dark:bg-anthracite-950">
        <div className="container-page">
          <div ref={topRef} className="mx-auto max-w-3xl scroll-mt-28">
            {success ? (
              <SuccessPanel
                overline="Demande reçue"
                title="Votre estimation est en préparation."
                description="Un consultant analyse votre local et vous transmet un avis de valeur personnalisé sous 48 heures, en toute confidentialité."
                nextSteps={[
                  { label: "Analyse", description: "Étude de l'emplacement, du flux et des références du quartier." },
                  { label: "Avis de valeur", description: "Une fourchette argumentée, transmise par téléphone ou email." },
                  { label: "Stratégie", description: "Nos recommandations pour vendre ou louer au meilleur prix." },
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

                <form ref={formRef} onSubmit={handleSubmit} className="mt-12">
                  {error && (
                    <div className="mb-8">
                      <ErrorBanner message={error} />
                    </div>
                  )}

                  {/* ════ Étape 1 — Votre local ════ */}
                  <div className={step === 0 ? "animate-card-enter space-y-10" : "hidden"}>
                    <div>
                      <p className="font-serif text-xs italic text-stone-400 dark:text-stone-500">
                        01 — Votre local
                      </p>
                      <h2 className="mt-2 font-serif text-2xl font-semibold text-anthracite-900 sm:text-3xl dark:text-stone-100">
                        De quel type de local s&apos;agit-il&nbsp;?
                      </h2>
                      <div className="mt-5 flex flex-wrap gap-2.5">
                        {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                          <Chip
                            key={value}
                            active={propertyType === value}
                            onClick={() => setPropertyType(propertyType === value ? "" : value)}
                          >
                            {label}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <LuxInput
                          id="address"
                          name="address"
                          label="Adresse du local"
                          required
                          placeholder="Numéro et rue"
                          autoComplete="street-address"
                        />
                      </div>
                      <LuxInput id="city" name="city" label="Ville" defaultValue="Paris" />
                      <LuxInput id="surface" name="surface" type="number" min={0} label="Surface (m²)" placeholder="80" />
                    </div>

                    <div className="flex justify-end border-t border-stone-200 pt-8 dark:border-stone-800">
                      <GleamButton onClick={nextFromLocal}>
                        Continuer
                        <ArrowIcon className="h-3 w-3 transition-transform duration-500 group-hover:translate-x-1" />
                      </GleamButton>
                    </div>
                  </div>

                  {/* ════ Étape 2 — Votre projet ════ */}
                  <div className={step === 1 ? "animate-card-enter space-y-10" : "hidden"}>
                    <div>
                      <p className="font-serif text-xs italic text-stone-400 dark:text-stone-500">
                        02 — Votre projet
                      </p>
                      <h2 className="mt-2 font-serif text-2xl font-semibold text-anthracite-900 sm:text-3xl dark:text-stone-100">
                        Que souhaitez-vous estimer&nbsp;?
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

                    <LuxInput
                      id="details"
                      name="details"
                      label="Un détail à signaler ?"
                      placeholder="Bail en cours, travaux récents, extraction, terrasse… (facultatif)"
                    />

                    <div className="flex items-center justify-between border-t border-stone-200 pt-8 dark:border-stone-800">
                      <BackButton onClick={() => goTo(0)} />
                      <GleamButton onClick={nextFromProject}>
                        Continuer
                        <ArrowIcon className="h-3 w-3 transition-transform duration-500 group-hover:translate-x-1" />
                      </GleamButton>
                    </div>
                  </div>

                  {/* ════ Étape 3 — Contact ════ */}
                  <div className={step === 2 ? "animate-card-enter space-y-10" : "hidden"}>
                    <div>
                      <p className="font-serif text-xs italic text-stone-400 dark:text-stone-500">
                        03 — Vos coordonnées
                      </p>
                      <h2 className="mt-2 font-serif text-2xl font-semibold text-anthracite-900 sm:text-3xl dark:text-stone-100">
                        Où vous transmettre l&apos;avis de valeur&nbsp;?
                      </h2>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <LuxInput id="firstName" name="firstName" label="Prénom" required autoComplete="given-name" />
                      <LuxInput id="lastName" name="lastName" label="Nom" required autoComplete="family-name" />
                      <LuxInput id="email" name="email" type="email" label="Email" required autoComplete="email" />
                      <LuxInput id="phone" name="phone" type="tel" label="Téléphone" autoComplete="tel" />
                    </div>

                    <Honeypot />

                    <ConsentCheckbox
                      checked={consent}
                      onChange={setConsent}
                      intent="ma demande d'estimation"
                    />

                    <div className="flex items-center justify-between border-t border-stone-200 pt-8 dark:border-stone-800">
                      <BackButton onClick={() => goTo(1)} />
                      <GleamButton type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Envoi en cours…" : "Recevoir mon estimation"}
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
