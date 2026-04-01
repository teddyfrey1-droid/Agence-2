"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { DEAL_STAGE_LABELS } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";

const stageOptions = Object.entries(DEAL_STAGE_LABELS).map(([value, label]) => ({ value, label }));

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: string;
}

interface Stakeholder {
  id: string;
  name: string;
  email: string;
}

export default function NouveauDossierPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedProperty, setSelectedProperty] = useState<{ id: string; label: string; sublabel: string } | null>(null);
  const [propertyQuery, setPropertyQuery] = useState("");
  const [propertyResults, setPropertyResults] = useState<SearchResult[]>([]);
  const [showPropertyResults, setShowPropertyResults] = useState(false);

  const [selectedContact, setSelectedContact] = useState<{ id: string; label: string; sublabel: string } | null>(null);
  const [contactQuery, setContactQuery] = useState("");
  const [contactResults, setContactResults] = useState<SearchResult[]>([]);
  const [showContactResults, setShowContactResults] = useState(false);

  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [stakeQuery, setStakeQuery] = useState("");
  const [stakeResults, setStakeResults] = useState<Stakeholder[]>([]);
  const [showStakeResults, setShowStakeResults] = useState(false);

  // Search properties
  useEffect(() => {
    if (propertyQuery.length < 2) { setPropertyResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(propertyQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setPropertyResults((data.results || []).filter((r: SearchResult) => r.type === "property"));
          setShowPropertyResults(true);
        }
      } catch { /* */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [propertyQuery]);

  // Search contacts
  useEffect(() => {
    if (contactQuery.length < 2) { setContactResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(contactQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setContactResults((data.results || []).filter((r: SearchResult) => r.type === "contact"));
          setShowContactResults(true);
        }
      } catch { /* */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [contactQuery]);

  // Search stakeholders
  useEffect(() => {
    if (stakeQuery.length < 2) { setStakeResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(stakeQuery)}`);
        if (res.ok) {
          const data = await res.json();
          const all = (data.results || [])
            .filter((r: SearchResult) => r.type === "contact")
            .map((r: SearchResult) => ({ id: r.id, name: r.title, email: r.subtitle }))
            .filter((s: Stakeholder) => !stakeholders.find((st) => st.id === s.id));
          setStakeResults(all);
          setShowStakeResults(all.length > 0);
        }
      } catch { /* */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [stakeQuery, stakeholders]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          stage: formData.get("stage") || "PROSPECT",
          estimatedValue: formData.get("estimatedValue") ? Number(formData.get("estimatedValue")) : undefined,
          description: formData.get("description") || undefined,
          commission: formData.get("commission") ? Number(formData.get("commission")) : undefined,
          finderCommissionPct: formData.get("finderCommissionPct") ? Number(formData.get("finderCommissionPct")) : undefined,
          closerCommissionPct: formData.get("closerCommissionPct") ? Number(formData.get("closerCommissionPct")) : undefined,
          propertyId: selectedProperty?.id || undefined,
          contactId: selectedContact?.id || undefined,
        }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Erreur"); }
      const deal = await res.json();
      addToast("Dossier créé avec succès", "success");
      router.push(`/dashboard/dossiers/${deal.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      addToast("Erreur lors de la création", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  const searchInputClass = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-800 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-200 dark:placeholder:text-stone-500";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">Nouveau dossier</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">Créez un dossier et associez-y un bien, un contact et des parties prenantes.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400">{error}</div>}

        <Card>
          <CardHeader><h2 className="heading-card">Informations</h2></CardHeader>
          <CardContent className="space-y-4">
            <Input id="title" name="title" label="Titre du dossier" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select id="stage" name="stage" label="Étape" options={stageOptions} />
              <Input id="estimatedValue" name="estimatedValue" type="number" label="Valeur estimée (€)" min={0} />
            </div>
            <Textarea id="description" name="description" label="Description" rows={3} />
          </CardContent>
        </Card>

        {/* Property link */}
        <Card>
          <CardHeader><h2 className="heading-card">Bien associé <span className="text-xs font-normal text-stone-400">(optionnel)</span></h2></CardHeader>
          <CardContent>
            {selectedProperty ? (
              <div className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-800/30 dark:bg-brand-900/20">
                <div>
                  <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">{selectedProperty.label}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{selectedProperty.sublabel}</p>
                </div>
                <button type="button" onClick={() => setSelectedProperty(null)} className="text-stone-400 hover:text-red-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={propertyQuery}
                  onChange={(e) => { setPropertyQuery(e.target.value); setShowPropertyResults(true); }}
                  onFocus={() => propertyResults.length > 0 && setShowPropertyResults(true)}
                  onBlur={() => setTimeout(() => setShowPropertyResults(false), 200)}
                  placeholder="Rechercher un bien par titre ou référence..."
                  className={searchInputClass}
                />
                {showPropertyResults && propertyResults.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full rounded-lg border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-anthracite-800">
                    {propertyResults.map((r) => (
                      <li key={r.id}>
                        <button type="button" onClick={() => { setSelectedProperty({ id: r.id, label: r.title, sublabel: r.subtitle }); setPropertyQuery(""); setShowPropertyResults(false); }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-stone-50 dark:hover:bg-anthracite-700">
                          <p className="font-medium text-anthracite-800 dark:text-stone-200">{r.title}</p>
                          <p className="text-xs text-stone-500 dark:text-stone-400">{r.subtitle}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact link */}
        <Card>
          <CardHeader><h2 className="heading-card">Contact associé <span className="text-xs font-normal text-stone-400">(optionnel)</span></h2></CardHeader>
          <CardContent>
            {selectedContact ? (
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800/30 dark:bg-emerald-900/20">
                <div>
                  <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">{selectedContact.label}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{selectedContact.sublabel}</p>
                </div>
                <button type="button" onClick={() => setSelectedContact(null)} className="text-stone-400 hover:text-red-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={contactQuery}
                  onChange={(e) => { setContactQuery(e.target.value); setShowContactResults(true); }}
                  onFocus={() => contactResults.length > 0 && setShowContactResults(true)}
                  onBlur={() => setTimeout(() => setShowContactResults(false), 200)}
                  placeholder="Rechercher un contact par nom ou email..."
                  className={searchInputClass}
                />
                {showContactResults && contactResults.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full rounded-lg border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-anthracite-800">
                    {contactResults.map((r) => (
                      <li key={r.id}>
                        <button type="button" onClick={() => { setSelectedContact({ id: r.id, label: r.title, sublabel: r.subtitle }); setContactQuery(""); setShowContactResults(false); }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-stone-50 dark:hover:bg-anthracite-700">
                          <p className="font-medium text-anthracite-800 dark:text-stone-200">{r.title}</p>
                          <p className="text-xs text-stone-500 dark:text-stone-400">{r.subtitle}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stakeholders */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">Parties prenantes <span className="text-xs font-normal text-stone-400">(optionnel)</span></h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Ajoutez des contacts ou collaborateurs qui pourront suivre ce dossier.
            </p>
            {stakeholders.length > 0 && (
              <div className="space-y-2">
                {stakeholders.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 dark:border-stone-700">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-600 dark:bg-anthracite-700 dark:text-stone-300">
                        {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">{s.name}</p>
                        <p className="text-xs text-stone-400 dark:text-stone-500">{s.email}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setStakeholders((prev) => prev.filter((st) => st.id !== s.id))}
                      className="text-stone-400 hover:text-red-500">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="relative">
              <input
                type="text"
                value={stakeQuery}
                onChange={(e) => { setStakeQuery(e.target.value); setShowStakeResults(true); }}
                onFocus={() => stakeResults.length > 0 && setShowStakeResults(true)}
                onBlur={() => setTimeout(() => setShowStakeResults(false), 200)}
                placeholder="Rechercher un contact à ajouter..."
                className={searchInputClass}
              />
              {showStakeResults && stakeResults.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-lg border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-anthracite-800">
                  {stakeResults.map((r) => (
                    <li key={r.id}>
                      <button type="button" onClick={() => {
                        setStakeholders((prev) => [...prev, r]);
                        setStakeQuery("");
                        setShowStakeResults(false);
                      }}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-stone-50 dark:hover:bg-anthracite-700">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-600 dark:bg-anthracite-700 dark:text-stone-300">
                          {r.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-anthracite-800 dark:text-stone-200">{r.name}</p>
                          <p className="text-xs text-stone-500 dark:text-stone-400">{r.email}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Commission */}
        <Card>
          <CardHeader><h2 className="heading-card">Commission</h2></CardHeader>
          <CardContent className="space-y-4">
            <Input id="commission" name="commission" type="number" label="Commission totale (€)" min={0} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="finderCommissionPct" name="finderCommissionPct" type="number" label="Part apporteur (%)" min={0} max={100} defaultValue="30" />
              <Input id="closerCommissionPct" name="closerCommissionPct" type="number" label="Part vendeur (%)" min={0} max={100} defaultValue="70" />
            </div>
            <p className="text-xs text-stone-400 dark:text-stone-500">
              L&apos;apporteur est celui qui a trouvé le bien, le vendeur est celui qui conclut la vente. L&apos;attribution se fait après la création.
            </p>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" isLoading={isSubmitting}>Créer le dossier</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
        </div>
      </form>
    </div>
  );
}
