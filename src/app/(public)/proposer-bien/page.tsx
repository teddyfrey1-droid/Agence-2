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
  LuxTextarea,
  SuccessPanel,
  WizardProgress,
} from "@/components/luxe-form";

const STEPS = ["Votre bien", "Contact"];

const REASSURANCE = [
  {
    title: "Confidentialité absolue",
    description: "Votre bien peut rester off-market, présenté uniquement à des candidats qualifiés.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Étude sous 48 h",
    description: "Analyse de votre local et premier avis de valeur par un consultant dédié.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    title: "Sans engagement",
    description: "Un échange en toute liberté avant toute décision de commercialisation.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 12l3 3 5-6" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
];

const propertyTypeOptions = Object.entries(PROPERTY_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

const transactionTypeOptions = Object.entries(TRANSACTION_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

export default function ProposerBienPage() {
  const [step, setStep] = useState(0);
  const [propertyType, setPropertyType] = useState<string>("");
  const [transactionType, setTransactionType] = useState<string>("");
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

  function nextFromProperty() {
    const form = formRef.current;
    const address = form
      ? String(new FormData(form).get("address") ?? "").trim()
      : "";
    if (!address) {
      setError("Merci d'indiquer l'adresse du bien.");
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
        "Merci d'accepter la politique de confidentialité avant d'envoyer votre proposition."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/properties/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone: formData.get("phone"),
          company: formData.get("company"),
          address: formData.get("address"),
          city: formData.get("city") || "Paris",
          propertyType: propertyType || undefined,
          transactionType: transactionType || undefined,
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
          <p className="label-overline dark:text-champagne-400">Propriétaires & bailleurs</p>
          <h1 className="mt-5 font-serif text-4xl font-normal italic tracking-tight text-anthracite-900 sm:text-5xl md:text-6xl dark:text-stone-100">
            Votre local mérite
            <span className="block not-italic font-semibold">le bon preneur</span>
          </h1>
          <div className="mx-auto mt-7 h-px w-12 bg-champagne-400" />
          <p className="mx-auto mt-7 max-w-xl font-sans text-base leading-relaxed text-anthracite-500 dark:text-stone-300">
            Propriétaire, bailleur ou mandataire&nbsp;: décrivez votre bien en
            deux étapes, nous l&apos;étudions sous 48&nbsp;h.
          </p>
        </div>
      </section>

      {/* ── Réassurance ── */}
      <section className="border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-anthracite-950">
        <div className="container-page grid gap-px overflow-hidden sm:grid-cols-3">
          {REASSURANCE.map((item) => (
            <div key={item.title} className="flex items-start gap-4 px-2 py-8 sm:px-6">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-champagne-300/70 text-brand-700 [&>svg]:h-5 [&>svg]:w-5 dark:border-champagne-400/40 dark:text-champagne-400">
                {item.icon}
              </span>
              <div>
                <p className="font-serif text-base font-semibold text-anthracite-900 dark:text-stone-100">
                  {item.title}
                </p>
                <p className="mt-1.5 font-sans text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20 dark:bg-anthracite-950">
        <div className="container-page">
          <div ref={topRef} className="mx-auto max-w-3xl scroll-mt-28">
            {success ? (
              <SuccessPanel
                overline="Proposition reçue"
                title="Merci, votre bien est entre de bonnes mains."
                description="Notre équipe étudie votre local et vous recontacte sous 48 heures, avec la discrétion qui s'impose."
                nextSteps={[
                  { label: "Étude", description: "Analyse de l'emplacement, de la surface et du marché." },
                  { label: "Échange", description: "Premier avis de valeur et stratégie de commercialisation." },
                  { label: "Diffusion", description: "Présentation ciblée à notre réseau de candidats qualifiés." },
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

                  {/* ════ Étape 1 — Votre bien ════ */}
                  <div className={step === 0 ? "animate-card-enter space-y-10" : "hidden"}>
                    <div>
                      <p className="font-serif text-xs italic text-stone-400 dark:text-stone-500">
                        01 — Votre bien
                      </p>
                      <h2 className="mt-2 font-serif text-2xl font-semibold text-anthracite-900 sm:text-3xl dark:text-stone-100">
                        Parlez-nous de votre local
                      </h2>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <LuxInput
                          id="address"
                          name="address"
                          label="Adresse du bien"
                          required
                          placeholder="Numéro et rue"
                          autoComplete="street-address"
                        />
                      </div>
                      <LuxInput id="city" name="city" label="Ville" defaultValue="Paris" />
                      <LuxInput id="surface" name="surface" type="number" min={0} label="Surface (m²)" placeholder="120" />
                    </div>

                    <div>
                      <h3 className="font-serif text-xl font-semibold text-anthracite-900 dark:text-stone-100">
                        Type de bien
                      </h3>
                      <div className="mt-4 flex flex-wrap gap-2.5">
                        {propertyTypeOptions.map((opt) => (
                          <Chip
                            key={opt.value}
                            active={propertyType === opt.value}
                            onClick={() =>
                              setPropertyType(propertyType === opt.value ? "" : opt.value)
                            }
                          >
                            {opt.label}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-serif text-xl font-semibold text-anthracite-900 dark:text-stone-100">
                        Type de transaction
                      </h3>
                      <div className="mt-4 flex flex-wrap gap-2.5">
                        {transactionTypeOptions.map((opt) => (
                          <Chip
                            key={opt.value}
                            active={transactionType === opt.value}
                            onClick={() =>
                              setTransactionType(
                                transactionType === opt.value ? "" : opt.value
                              )
                            }
                          >
                            {opt.label}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    <LuxInput
                      id="price"
                      name="price"
                      type="number"
                      min={0}
                      label="Prix / Loyer souhaité (€)"
                      placeholder="Montant envisagé"
                    />

                    <LuxTextarea
                      id="description"
                      name="description"
                      label="Description du bien"
                      placeholder="État, agencement, linéaire de vitrine, points forts, disponibilité…"
                      rows={4}
                    />

                    <div className="flex justify-end border-t border-stone-200 pt-8 dark:border-stone-800">
                      <GleamButton onClick={nextFromProperty}>
                        Continuer
                        <ArrowIcon className="h-3 w-3 transition-transform duration-500 group-hover:translate-x-1" />
                      </GleamButton>
                    </div>
                  </div>

                  {/* ════ Étape 2 — Vos coordonnées ════ */}
                  <div className={step === 1 ? "animate-card-enter space-y-10" : "hidden"}>
                    <div>
                      <p className="font-serif text-xs italic text-stone-400 dark:text-stone-500">
                        02 — Vos coordonnées
                      </p>
                      <h2 className="mt-2 font-serif text-2xl font-semibold text-anthracite-900 sm:text-3xl dark:text-stone-100">
                        Où vous joindre&nbsp;?
                      </h2>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <LuxInput id="firstName" name="firstName" label="Prénom" required autoComplete="given-name" />
                      <LuxInput id="lastName" name="lastName" label="Nom" required autoComplete="family-name" />
                      <LuxInput id="email" name="email" type="email" label="Email" required autoComplete="email" />
                      <LuxInput id="phone" name="phone" type="tel" label="Téléphone" autoComplete="tel" />
                      <div className="sm:col-span-2">
                        <LuxInput id="company" name="company" label="Société (facultatif)" autoComplete="organization" />
                      </div>
                    </div>

                    <Honeypot />

                    <ConsentCheckbox
                      checked={consent}
                      onChange={setConsent}
                      intent="ma proposition de bien"
                    />

                    <div className="flex items-center justify-between border-t border-stone-200 pt-8 dark:border-stone-800">
                      <BackButton onClick={() => goTo(0)} />
                      <GleamButton type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Envoi en cours…" : "Proposer mon bien"}
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
