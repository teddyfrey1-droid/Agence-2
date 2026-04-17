"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  generateContractPdf,
  contractFileName,
  type ContractFormData,
  type ContractRecipientType,
  type ContractParty,
  type PartyRole,
} from "@/lib/contract-pdf";

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-800 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-200";
const labelCls = "block text-xs font-medium text-anthracite-700 dark:text-stone-300 mb-1";

interface LoadedData {
  property: ContractFormData["property"] & {
    owner: {
      firstName: string;
      lastName: string;
      company: string | null;
      phone: string | null;
      email: string;
      address: string | null;
      city: string | null;
      zipCode: string | null;
    } | null;
    isCoMandat: boolean;
    coMandatAgency: string | null;
  };
  agency: {
    name: string;
    legalName: string | null;
    siret: string | null;
    address: string | null;
    city: string | null;
    zipCode: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    professionalCardNumber: string | null;
    professionalCardAuthority: string | null;
    financialGuarantee: string | null;
  };
  currentUser: { firstName: string; lastName: string; email: string };
}

const ROLE_LABELS: Record<PartyRole, string> = {
  AGENCE: "Agence mandataire",
  CO_MANDATAIRE: "Agence co-mandataire",
  PRENEUR: "Preneur / Acquéreur",
  BAILLEUR: "Bailleur / Vendeur",
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function inMonthsISO(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function emptyParty(role: PartyRole): ContractParty {
  return {
    role,
    name: "",
    representative: "",
    address: "",
    zipCode: "",
    city: "",
    siret: "",
    professionalCard: "",
    email: "",
    phone: "",
    signatureDataUrl: null,
    signedAt: null,
    signedCity: null,
  };
}

export function PropertyContractModal({
  propertyId,
  onClose,
}: {
  propertyId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<LoadedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"parties" | "nego" | "send">("parties");
  const [busy, setBusy] = useState<"download" | "email" | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [recipientType, setRecipientType] = useState<ContractRecipientType>("PRENEUR");
  const [mandateKind, setMandateKind] = useState<ContractFormData["mandateKind"]>("ENGAGEMENT_LOCATION");
  const [docTitle, setDocTitle] = useState("Feuille d'engagement");

  const [parties, setParties] = useState<ContractParty[]>([
    emptyParty("AGENCE"),
    emptyParty("PRENEUR"),
    emptyParty("BAILLEUR"),
  ]);

  const [core, setCore] = useState({
    startDate: todayISO(),
    endDate: inMonthsISO(3),
    city: "Paris",
    feesPercent: "",
    feesAmount: "",
    feesPayer: "PRENEUR" as ContractFormData["feesPayer"],
    splitUsPct: "50",
    splitThemPct: "50",
  });

  const [nego, setNego] = useState({
    proposedRent: "",
    proposedPrice: "",
    freeRent: "",
    worksByLandlord: "",
    worksByTenant: "",
    deposit: "",
    leaseDuration: "",
    entryDate: "",
    clauses: "",
  });

  const [email, setEmail] = useState({
    to: "",
    subject: "",
    body: "",
  });

  useEffect(() => {
    fetch(`/api/properties/${propertyId}/pdf`)
      .then((r) => r.json())
      .then((d: LoadedData) => {
        setData(d);
        // Prefill AGENCE party from agency info
        setParties((ps) =>
          ps.map((p) =>
            p.role !== "AGENCE"
              ? p
              : {
                  ...p,
                  name: d.agency.name,
                  legalForm: d.agency.legalName || "",
                  address: d.agency.address || "",
                  zipCode: d.agency.zipCode || "",
                  city: d.agency.city || "",
                  siret: d.agency.siret || "",
                  professionalCard: d.agency.professionalCardNumber
                    ? `${d.agency.professionalCardNumber}${d.agency.professionalCardAuthority ? ` (${d.agency.professionalCardAuthority})` : ""}`
                    : "",
                  representative: `${d.currentUser.firstName} ${d.currentUser.lastName}`.trim(),
                  email: d.agency.email || "",
                  phone: d.agency.phone || "",
                }
          )
        );
        // Prefill BAILLEUR from property owner
        if (d.property.owner) {
          const o = d.property.owner;
          setParties((ps) =>
            ps.map((p) =>
              p.role !== "BAILLEUR"
                ? p
                : {
                    ...p,
                    name: o.company || `${o.firstName} ${o.lastName}`,
                    representative: o.company ? `${o.firstName} ${o.lastName}` : "",
                    address: o.address || "",
                    zipCode: o.zipCode || "",
                    city: o.city || "",
                    email: o.email || "",
                    phone: o.phone || "",
                  }
            )
          );
        }
        // Default mandate type
        if (d.property.transactionType === "VENTE" || d.property.transactionType === "FOND_DE_COMMERCE") {
          setMandateKind("ENGAGEMENT_VENTE");
          setDocTitle("Feuille d'engagement — Vente");
        }
        // Prefill proposed rent/price from initial demand
        setNego((n) => ({
          ...n,
          proposedRent: d.property.rentMonthly ? `${d.property.rentMonthly} € / mois HC` : "",
          proposedPrice: d.property.price ? `${d.property.price} €` : "",
          deposit: d.property.deposit ? `${d.property.deposit} €` : "",
        }));
        setLoading(false);
      })
      .catch(() => {
        setMessage({ kind: "err", text: "Impossible de charger les données du bien." });
        setLoading(false);
      });
  }, [propertyId]);

  // Sync default email recipient whenever recipientType changes
  useEffect(() => {
    const p = parties.find((x) => x.role === recipientType);
    if (p?.email) setEmail((e) => ({ ...e, to: p.email || "" }));
  }, [recipientType, parties]);

  function updateParty(role: PartyRole, patch: Partial<ContractParty>) {
    setParties((ps) => ps.map((p) => (p.role === role ? { ...p, ...patch } : p)));
  }

  function toggleCoMandataire() {
    setParties((ps) => {
      const has = ps.some((p) => p.role === "CO_MANDATAIRE");
      if (has) return ps.filter((p) => p.role !== "CO_MANDATAIRE");
      // insert CO_MANDATAIRE right after AGENCE
      const agencyIdx = ps.findIndex((p) => p.role === "AGENCE");
      const next = [...ps];
      const cm = emptyParty("CO_MANDATAIRE");
      if (data?.property.coMandatAgency) cm.name = data.property.coMandatAgency;
      next.splice(agencyIdx + 1, 0, cm);
      return next;
    });
  }

  function hasCoMandataire() {
    return parties.some((p) => p.role === "CO_MANDATAIRE");
  }

  async function handleSignatureUpload(role: PartyRole, file: File | null) {
    if (!file) {
      updateParty(role, { signatureDataUrl: null, signedAt: null });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ kind: "err", text: "Image de signature trop volumineuse (max 2 Mo)." });
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    updateParty(role, {
      signatureDataUrl: dataUrl,
      signedAt: todayISO(),
    });
  }

  function buildContractData(): ContractFormData | null {
    if (!data) return null;
    return {
      recipientType,
      parties,
      signedBy: `${data.currentUser.firstName} ${data.currentUser.lastName}`.trim(),
      property: {
        reference: data.property.reference,
        title: data.property.title,
        type: data.property.type,
        transactionType: data.property.transactionType,
        address: data.property.address,
        city: data.property.city,
        zipCode: data.property.zipCode,
        district: data.property.district,
        surfaceTotal: data.property.surfaceTotal,
        floor: data.property.floor,
        price: data.property.price,
        rentMonthly: data.property.rentMonthly,
        rentYearly: data.property.rentYearly,
        charges: data.property.charges,
        deposit: data.property.deposit,
      },
      mandateKind,
      startDate: core.startDate,
      endDate: core.endDate,
      city: core.city,
      feesPercent: core.feesPercent,
      feesAmount: core.feesAmount,
      feesPayer: core.feesPayer,
      splitUsPct: core.splitUsPct,
      splitThemPct: core.splitThemPct,
      negotiation: { ...nego },
      title: docTitle,
    };
  }

  async function handleDownload() {
    setMessage(null);
    const contract = buildContractData();
    if (!contract) return;
    const required = contract.parties.filter((p) => p.role !== "CO_MANDATAIRE" || hasCoMandataire());
    if (required.some((p) => !p.name.trim())) {
      setMessage({ kind: "err", text: "Toutes les parties doivent avoir un nom." });
      return;
    }
    setBusy("download");
    try {
      const blob = await generateContractPdf(contract);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = contractFileName(contract);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ kind: "ok", text: `Exemplaire ${ROLE_LABELS[contract.recipientType]} téléchargé.` });
    } catch {
      setMessage({ kind: "err", text: "Erreur lors de la génération du PDF." });
    } finally {
      setBusy(null);
    }
  }

  async function handleSend() {
    setMessage(null);
    const contract = buildContractData();
    if (!contract) return;
    if (contract.parties.some((p) => !p.name.trim())) {
      setMessage({ kind: "err", text: "Toutes les parties doivent avoir un nom." });
      return;
    }
    const to = email.to.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      setMessage({ kind: "err", text: "Adresse email invalide." });
      return;
    }
    setBusy("email");
    try {
      const blob = await generateContractPdf(contract);
      const base64 = await blobToBase64(blob);
      const recipientParty = contract.parties.find((p) => p.role === contract.recipientType);
      const res = await fetch(`/api/properties/${propertyId}/contract/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject:
            email.subject.trim() ||
            `${docTitle} — ${contract.property.reference} ${contract.property.title}`,
          message: email.body.trim(),
          recipientType: contract.recipientType,
          recipientName: recipientParty?.representative || recipientParty?.name || "",
          fileName: contractFileName(contract),
          pdfBase64: base64,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ kind: "err", text: payload?.error || "Échec de l'envoi." });
        return;
      }
      setMessage({ kind: "ok", text: `Document envoyé à ${to}.` });
    } catch {
      setMessage({ kind: "err", text: "Erreur lors de l'envoi." });
    } finally {
      setBusy(null);
    }
  }

  const signedCount = parties.filter((p) => p.signatureDataUrl).length;
  const showFees = recipientType === "CO_MANDATAIRE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-anthracite-900">
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4 dark:border-stone-800">
          <div>
            <h2 className="text-lg font-semibold text-anthracite-900 dark:text-stone-100">
              Feuille d&apos;engagement multipartite
            </h2>
            <p className="text-xs text-stone-500">
              Signature séquentielle — le preneur signe, puis le bailleur reçoit avec la signature captée. Honoraires masqués hors co-mandataire.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-100 dark:border-stone-800">
          {[
            { id: "parties", label: "1 · Parties & signatures" },
            { id: "nego", label: "2 · Négociation" },
            { id: "send", label: "3 · Envoyer / Télécharger" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors sm:text-sm ${
                tab === t.id
                  ? "text-brand-600 border-b-2 border-brand-600"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-stone-500">Chargement…</p>
          ) : !data ? (
            <p className="py-8 text-center text-sm text-red-500">Impossible de charger le bien.</p>
          ) : tab === "parties" ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Type de document</label>
                  <select
                    className={inputCls}
                    value={mandateKind}
                    onChange={(e) => setMandateKind(e.target.value as ContractFormData["mandateKind"])}
                  >
                    <option value="ENGAGEMENT_LOCATION">Feuille d&apos;engagement — Location</option>
                    <option value="ENGAGEMENT_VENTE">Feuille d&apos;engagement — Vente</option>
                    <option value="SIMPLE">Mandat simple</option>
                    <option value="EXCLUSIF">Mandat exclusif</option>
                    <option value="CO_MANDAT">Convention de co-mandat</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Intitulé affiché</label>
                  <input
                    className={inputCls}
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Début</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={core.startDate}
                    onChange={(e) => setCore({ ...core, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelCls}>Fin / Caducité</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={core.endDate}
                    onChange={(e) => setCore({ ...core, endDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelCls}>Fait à</label>
                  <input
                    className={inputCls}
                    value={core.city}
                    onChange={(e) => setCore({ ...core, city: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 bg-stone-50/50 px-3 py-2 dark:border-stone-700 dark:bg-anthracite-800/50">
                <div>
                  <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">
                    Parties signataires : <span className="text-brand-600">{parties.length}</span>
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {signedCount} signature{signedCount > 1 ? "s" : ""} captée{signedCount > 1 ? "s" : ""} sur {parties.length}
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={toggleCoMandataire}>
                  {hasCoMandataire() ? "Retirer le co-mandataire" : "+ Ajouter une agence co-mandataire"}
                </Button>
              </div>

              {parties.map((p) => (
                <PartyEditor
                  key={p.role}
                  party={p}
                  onChange={(patch) => updateParty(p.role, patch)}
                  onSignatureUpload={(file) => handleSignatureUpload(p.role, file)}
                />
              ))}
            </div>
          ) : tab === "nego" ? (
            <div className="space-y-4">
              <p className="text-xs text-stone-500">
                Ces conditions apparaissent dans l&apos;article « Conditions négociées » du PDF. Elles sont modifiables à chaque échange —
                signez une nouvelle version à chaque contre-offre.
              </p>

              {data.property.transactionType === "LOCATION" || data.property.transactionType === "CESSION_BAIL" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Loyer proposé</label>
                      <input
                        className={inputCls}
                        value={nego.proposedRent}
                        onChange={(e) => setNego({ ...nego, proposedRent: e.target.value })}
                        placeholder="ex: 2 500 € / mois HC"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Franchise de loyer</label>
                      <input
                        className={inputCls}
                        value={nego.freeRent}
                        onChange={(e) => setNego({ ...nego, freeRent: e.target.value })}
                        placeholder="ex: 3 mois"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Dépôt de garantie</label>
                      <input
                        className={inputCls}
                        value={nego.deposit}
                        onChange={(e) => setNego({ ...nego, deposit: e.target.value })}
                        placeholder="ex: 3 mois HC"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Durée du bail</label>
                      <input
                        className={inputCls}
                        value={nego.leaseDuration}
                        onChange={(e) => setNego({ ...nego, leaseDuration: e.target.value })}
                        placeholder="ex: 9 ans (3/6/9) ferme"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className={labelCls}>Prix proposé</label>
                  <input
                    className={inputCls}
                    value={nego.proposedPrice}
                    onChange={(e) => setNego({ ...nego, proposedPrice: e.target.value })}
                    placeholder="ex: 850 000 €"
                  />
                </div>
              )}

              <div>
                <label className={labelCls}>Date d&apos;entrée en jouissance</label>
                <input
                  type="date"
                  className={inputCls}
                  value={nego.entryDate}
                  onChange={(e) => setNego({ ...nego, entryDate: e.target.value })}
                />
              </div>

              <div>
                <label className={labelCls}>Travaux à charge du bailleur</label>
                <textarea
                  className={inputCls}
                  rows={2}
                  value={nego.worksByLandlord}
                  onChange={(e) => setNego({ ...nego, worksByLandlord: e.target.value })}
                  placeholder="ex: réfection de la façade, climatisation en état de marche"
                />
              </div>
              <div>
                <label className={labelCls}>Travaux à charge du preneur</label>
                <textarea
                  className={inputCls}
                  rows={2}
                  value={nego.worksByTenant}
                  onChange={(e) => setNego({ ...nego, worksByTenant: e.target.value })}
                  placeholder="ex: aménagement intérieur, agencement cuisine"
                />
              </div>

              <div>
                <label className={labelCls}>Clauses particulières</label>
                <textarea
                  className={inputCls}
                  rows={4}
                  value={nego.clauses}
                  onChange={(e) => setNego({ ...nego, clauses: e.target.value })}
                  placeholder="Dérogations, exclusivités, clauses résolutoires, condition suspensive, etc."
                />
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/30 dark:bg-amber-900/10">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  Honoraires &amp; répartition (visibles uniquement sur l&apos;exemplaire co-mandataire)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Taux</label>
                    <input
                      className={inputCls}
                      value={core.feesPercent}
                      onChange={(e) => setCore({ ...core, feesPercent: e.target.value })}
                      placeholder="ex: 15 % du loyer annuel HT"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Montant</label>
                    <input
                      className={inputCls}
                      value={core.feesAmount}
                      onChange={(e) => setCore({ ...core, feesAmount: e.target.value })}
                      placeholder="ex: 25 000 € HT"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Partie redevable</label>
                    <select
                      className={inputCls}
                      value={core.feesPayer}
                      onChange={(e) => setCore({ ...core, feesPayer: e.target.value as ContractFormData["feesPayer"] })}
                    >
                      <option value="PRENEUR">Preneur</option>
                      <option value="BAILLEUR">Bailleur</option>
                      <option value="ACQUEREUR">Acquéreur</option>
                      <option value="VENDEUR">Vendeur</option>
                      <option value="PARTAGE">Partagés</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>% Notre agence</label>
                      <input
                        className={inputCls}
                        value={core.splitUsPct}
                        onChange={(e) => setCore({ ...core, splitUsPct: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>% Co-mandataire</label>
                      <input
                        className={inputCls}
                        value={core.splitThemPct}
                        onChange={(e) => setCore({ ...core, splitThemPct: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Pour qui générer / envoyer ?</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {parties.map((p) => (
                    <button
                      key={p.role}
                      type="button"
                      onClick={() => setRecipientType(p.role)}
                      className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                        recipientType === p.role
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                          : "border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-700 dark:bg-anthracite-800"
                      }`}
                    >
                      <div className="font-semibold text-anthracite-900 dark:text-stone-100">
                        {ROLE_LABELS[p.role]}
                      </div>
                      <div className="mt-0.5 text-[10px] text-stone-500">
                        {p.role === "CO_MANDATAIRE" ? "Honoraires visibles" : "Sans honoraires"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-stone-50 p-3 text-xs text-stone-600 dark:bg-anthracite-800/50 dark:text-stone-400">
                <strong>Flux recommandé :</strong> 1) Télécharger l&apos;exemplaire Preneur, le lui faire signer, téléverser son image de signature dans l&apos;onglet 1 → 2) Générer l&apos;exemplaire Bailleur (la signature du preneur est reportée sur son PDF) → 3) Bailleur signe à son tour → 4) Exemplaire co-mandataire avec honoraires.
              </div>

              <div>
                <label className={labelCls}>Destinataire (email)</label>
                <input
                  type="email"
                  className={inputCls}
                  value={email.to}
                  onChange={(e) => setEmail({ ...email, to: e.target.value })}
                  placeholder="contact@partenaire.fr"
                />
              </div>
              <div>
                <label className={labelCls}>Objet</label>
                <input
                  className={inputCls}
                  value={email.subject}
                  onChange={(e) => setEmail({ ...email, subject: e.target.value })}
                  placeholder={`${docTitle} — ${data.property.reference} ${data.property.title}`}
                />
              </div>
              <div>
                <label className={labelCls}>Message</label>
                <textarea
                  className={inputCls}
                  rows={5}
                  value={email.body}
                  onChange={(e) => setEmail({ ...email, body: e.target.value })}
                  placeholder="Bonjour, veuillez trouver ci-joint le document pour signature…"
                />
              </div>
              <div className="rounded-lg bg-stone-50 p-3 text-xs text-stone-600 dark:bg-anthracite-800/50 dark:text-stone-400">
                Exemplaire {ROLE_LABELS[recipientType]} — {showFees ? <strong>inclut la répartition d&apos;honoraires</strong> : <strong>sans honoraires</strong>}. Signé par{" "}
                <strong className="text-anthracite-800 dark:text-stone-200">{data.currentUser.firstName} {data.currentUser.lastName}</strong>{" "}
                pour <strong className="text-anthracite-800 dark:text-stone-200">{data.agency.name}</strong>.
              </div>
            </div>
          )}
        </div>

        {message && (
          <div
            className={`mx-6 mb-3 rounded-lg px-3 py-2 text-sm ${
              message.kind === "ok"
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-red-50 text-red-700 ring-1 ring-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-stone-100 bg-stone-50/50 px-6 py-3 dark:border-stone-800 dark:bg-anthracite-900/50">
          <Button type="button" variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleDownload}
              isLoading={busy === "download"}
              disabled={loading}
            >
              Télécharger l&apos;exemplaire {ROLE_LABELS[recipientType]}
            </Button>
            {tab === "send" && (
              <Button type="button" onClick={handleSend} isLoading={busy === "email"} disabled={loading}>
                Envoyer par email
              </Button>
            )}
            {tab !== "send" && (
              <Button
                type="button"
                onClick={() => setTab(tab === "parties" ? "nego" : "send")}
                disabled={loading}
              >
                Suivant
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PartyEditor({
  party,
  onChange,
  onSignatureUpload,
}: {
  party: ContractParty;
  onChange: (patch: Partial<ContractParty>) => void;
  onSignatureUpload: (file: File | null) => void;
}) {
  const roleLabel = ROLE_LABELS[party.role];
  const isAgency = party.role === "AGENCE" || party.role === "CO_MANDATAIRE";

  return (
    <div className="rounded-lg border border-stone-200 p-3 dark:border-stone-700">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{roleLabel}</p>
        {party.signatureDataUrl ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Signature captée
          </span>
        ) : (
          <span className="text-[10px] font-medium text-stone-400">En attente de signature</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className={labelCls}>Nom / Raison sociale *</label>
          <input
            className={inputCls}
            value={party.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>Représentant</label>
          <input
            className={inputCls}
            value={party.representative || ""}
            onChange={(e) => onChange({ representative: e.target.value })}
          />
        </div>
        {isAgency && (
          <div>
            <label className={labelCls}>Forme juridique</label>
            <input
              className={inputCls}
              value={party.legalForm || ""}
              onChange={(e) => onChange({ legalForm: e.target.value })}
            />
          </div>
        )}
        <div className="col-span-2">
          <label className={labelCls}>Adresse</label>
          <input
            className={inputCls}
            value={party.address || ""}
            onChange={(e) => onChange({ address: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>Code postal</label>
          <input
            className={inputCls}
            value={party.zipCode || ""}
            onChange={(e) => onChange({ zipCode: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>Ville</label>
          <input
            className={inputCls}
            value={party.city || ""}
            onChange={(e) => onChange({ city: e.target.value })}
          />
        </div>
        {isAgency && (
          <>
            <div>
              <label className={labelCls}>SIRET</label>
              <input
                className={inputCls}
                value={party.siret || ""}
                onChange={(e) => onChange({ siret: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Carte professionnelle</label>
              <input
                className={inputCls}
                value={party.professionalCard || ""}
                onChange={(e) => onChange({ professionalCard: e.target.value })}
              />
            </div>
          </>
        )}
        <div>
          <label className={labelCls}>Téléphone</label>
          <input
            className={inputCls}
            value={party.phone || ""}
            onChange={(e) => onChange({ phone: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input
            type="email"
            className={inputCls}
            value={party.email || ""}
            onChange={(e) => onChange({ email: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-stone-100 pt-3 dark:border-stone-800">
        <div className="col-span-2">
          <label className={labelCls}>Image de signature (PNG/JPG)</label>
          <input
            type="file"
            accept="image/png,image/jpeg"
            className="block w-full text-xs text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-anthracite-800 hover:file:bg-stone-200 dark:file:bg-anthracite-700 dark:file:text-stone-200"
            onChange={(e) => onSignatureUpload(e.target.files?.[0] || null)}
          />
          {party.signatureDataUrl && (
            <div className="mt-2 flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={party.signatureDataUrl}
                alt="signature"
                className="h-12 rounded border border-stone-200 bg-white object-contain px-2 dark:border-stone-700"
              />
              <button
                type="button"
                className="text-[11px] text-red-600 hover:underline"
                onClick={() => onChange({ signatureDataUrl: null, signedAt: null, signedCity: null })}
              >
                Retirer
              </button>
            </div>
          )}
        </div>
        <div>
          <label className={labelCls}>Date de signature</label>
          <input
            type="date"
            className={inputCls}
            value={party.signedAt || ""}
            onChange={(e) => onChange({ signedAt: e.target.value || null })}
            disabled={!party.signatureDataUrl}
          />
          <input
            className={inputCls + " mt-1"}
            placeholder="Lieu"
            value={party.signedCity || ""}
            onChange={(e) => onChange({ signedCity: e.target.value || null })}
            disabled={!party.signatureDataUrl}
          />
        </div>
      </div>
    </div>
  );
}
