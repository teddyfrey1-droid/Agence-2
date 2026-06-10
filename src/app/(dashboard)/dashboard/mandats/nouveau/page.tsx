"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import {
  MANDATE_KIND_LABELS,
  MANDATE_FEES_PAYER_LABELS,
} from "@/lib/constants";

const KIND_HINTS: Record<string, string> = {
  SIMPLE: "Le client peut confier le bien à plusieurs agences.",
  EXCLUSIF: "Votre agence est seule mandatée pendant la durée du mandat.",
  SEMI_EXCLUSIF: "Exclusivité partagée — le client garde le droit de vendre par lui-même.",
  CO_MANDAT: "Mandat partagé avec une agence partenaire.",
  RECHERCHE: "Vous recherchez un bien pour le compte du client.",
};

const kindOptions = Object.entries(MANDATE_KIND_LABELS).map(([value, label]) => ({ value, label }));
const feesPayerOptions = Object.entries(MANDATE_FEES_PAYER_LABELS).map(([value, label]) => ({ value, label }));

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: string;
}

interface Picked {
  id: string;
  label: string;
  sublabel: string;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function inMonthsISO(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** Debounced /api/search picker shared by the client and property fields. */
function EntityPicker({
  picked,
  onPick,
  onClear,
  entityType,
  placeholder,
  accent,
}: {
  picked: Picked | null;
  onPick: (p: Picked) => void;
  onClear: () => void;
  entityType: "contact" | "property";
  placeholder: string;
  accent: "emerald" | "brand";
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults((data.results || []).filter((r: SearchResult) => r.type === entityType));
          setShow(true);
        }
      } catch {
        /* ignore */
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, entityType]);

  const accentCls =
    accent === "emerald"
      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/30 dark:bg-emerald-900/20"
      : "border-brand-200 bg-brand-50 dark:border-brand-800/30 dark:bg-brand-900/20";

  if (picked) {
    return (
      <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${accentCls}`}>
        <div>
          <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">{picked.label}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400">{picked.sublabel}</p>
        </div>
        <button type="button" onClick={onClear} className="text-stone-400 hover:text-red-500" aria-label="Retirer">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShow(true);
        }}
        onFocus={() => results.length > 0 && setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 200)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-800 placeholder:text-stone-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-200 dark:placeholder:text-stone-500"
      />
      {show && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-anthracite-800">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => {
                  onPick({ id: r.id, label: r.title, sublabel: r.subtitle });
                  setQuery("");
                  setShow(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-stone-50 dark:hover:bg-anthracite-700"
              >
                <p className="font-medium text-anthracite-800 dark:text-stone-200">{r.title}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">{r.subtitle}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NouveauMandatForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [kind, setKind] = useState("SIMPLE");
  const [contact, setContact] = useState<Picked | null>(null);
  const [property, setProperty] = useState<Picked | null>(null);

  // Prefill from ?contactId= / ?propertyId= (quick action from a contact or property page)
  useEffect(() => {
    const contactId = searchParams.get("contactId");
    if (contactId) {
      fetch(`/api/contacts/${contactId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((c) => {
          if (c) {
            setContact({
              id: c.id,
              label: `${c.firstName} ${c.lastName}`.trim(),
              sublabel: c.company || c.email || "",
            });
          }
        })
        .catch(() => {});
    }
    const propertyId = searchParams.get("propertyId");
    if (propertyId) {
      fetch(`/api/properties/${propertyId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((p) => {
          if (p) {
            setProperty({
              id: p.id,
              label: p.title,
              sublabel: [p.reference, p.district || p.city].filter(Boolean).join(" · "),
            });
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!contact) {
      setError("Sélectionnez le client signataire du mandat.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/mandates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          contactId: contact.id,
          propertyId: property?.id || undefined,
          startDate: formData.get("startDate"),
          endDate: formData.get("endDate") || undefined,
          feesPercent: formData.get("feesPercent") || undefined,
          feesAmount: formData.get("feesAmount") || undefined,
          feesPayer: formData.get("feesPayer") || undefined,
          notes: formData.get("notes") || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      const mandate = await res.json();
      addToast("Mandat créé avec succès", "success");
      router.push(`/dashboard/mandats/${mandate.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      addToast("Erreur lors de la création", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">Nouveau mandat</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Choisissez le client, le type de mandat et sa durée — vous pourrez ensuite générer et faire signer le document.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Client */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">
              Client <span className="text-red-500">*</span>
            </h2>
          </CardHeader>
          <CardContent>
            <EntityPicker
              picked={contact}
              onPick={setContact}
              onClear={() => setContact(null)}
              entityType="contact"
              placeholder="Rechercher un contact par nom, société ou email…"
              accent="emerald"
            />
            <p className="mt-2 text-xs text-stone-400 dark:text-stone-500">
              Propriétaire, bailleur ou enseigne pour un mandat de recherche.
            </p>
          </CardContent>
        </Card>

        {/* Type & durée */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">Type & durée</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Select
                id="kind"
                name="kind"
                label="Type de mandat"
                options={kindOptions}
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              />
              {KIND_HINTS[kind] && (
                <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">{KIND_HINTS[kind]}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="startDate" name="startDate" type="date" label="Début du mandat" required defaultValue={todayISO()} />
              <Input
                id="endDate"
                name="endDate"
                type="date"
                label="Fin / Caducité"
                defaultValue={inMonthsISO(3)}
                hint="Vous serez alerté 30 jours avant l'échéance."
              />
            </div>
          </CardContent>
        </Card>

        {/* Bien */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">
              Bien concerné <span className="text-xs font-normal text-stone-400">(optionnel pour un mandat de recherche)</span>
            </h2>
          </CardHeader>
          <CardContent>
            <EntityPicker
              picked={property}
              onPick={setProperty}
              onClear={() => setProperty(null)}
              entityType="property"
              placeholder="Rechercher un bien par titre ou référence…"
              accent="brand"
            />
          </CardContent>
        </Card>

        {/* Honoraires */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">
              Honoraires <span className="text-xs font-normal text-stone-400">(optionnel)</span>
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Input id="feesPercent" name="feesPercent" label="Taux" placeholder="ex: 15 % du loyer annuel HT" />
              <Input id="feesAmount" name="feesAmount" label="Montant" placeholder="ex: 25 000 € HT" />
              <Select
                id="feesPayer"
                name="feesPayer"
                label="Partie redevable"
                options={feesPayerOptions}
                placeholder="Sélectionnez…"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">
              Notes internes <span className="text-xs font-normal text-stone-400">(optionnel)</span>
            </h2>
          </CardHeader>
          <CardContent>
            <Textarea
              id="notes"
              name="notes"
              label=""
              rows={3}
              placeholder="Conditions particulières, contexte, points de vigilance…"
            />
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" isLoading={isSubmitting}>
            Créer le mandat
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NouveauMandatPage() {
  return (
    <Suspense fallback={null}>
      <NouveauMandatForm />
    </Suspense>
  );
}
