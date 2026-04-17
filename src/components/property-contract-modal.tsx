"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  generateContractPdf,
  contractFileName,
  type ContractFormData,
  type ContractRecipientType,
} from "@/lib/contract-pdf";

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-800 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-200";
const labelCls = "block text-xs font-medium text-anthracite-700 dark:text-stone-300 mb-1";

interface LoadedData {
  property: ContractFormData["property"] & {
    quarter: string | null;
    pricePerSqm: number | null;
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

export function PropertyContractModal({
  propertyId,
  onClose,
}: {
  propertyId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<LoadedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"form" | "send">("form");
  const [busy, setBusy] = useState<"download" | "email" | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [recipientType, setRecipientType] = useState<ContractRecipientType>("CO_MANDATAIRE");
  const [form, setForm] = useState({
    mandateKind: "CO_MANDAT" as ContractFormData["mandateKind"],
    startDate: todayISO(),
    endDate: inMonthsISO(6),
    city: "Paris",
    feesPercent: "",
    feesAmount: "",
    feesPayer: "PRENEUR" as ContractFormData["feesPayer"],
    splitUsPct: "50",
    splitThemPct: "50",
    specialConditions: "",
    // Counterparty
    cpName: "",
    cpLegalForm: "",
    cpAddress: "",
    cpZipCode: "",
    cpCity: "",
    cpSiret: "",
    cpProCard: "",
    cpRepresentative: "",
    cpEmail: "",
    cpPhone: "",
  });

  // Email tab
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
        // Prefill counterparty if co-mandat already marked
        if (d.property.isCoMandat && d.property.coMandatAgency) {
          setForm((f) => ({ ...f, cpName: d.property.coMandatAgency || "" }));
        }
        setLoading(false);
      })
      .catch(() => {
        setMessage({ kind: "err", text: "Impossible de charger les données du bien." });
        setLoading(false);
      });
  }, [propertyId]);

  // When switching to BAILLEUR, autofill counterparty with owner data
  useEffect(() => {
    if (!data) return;
    if (recipientType === "BAILLEUR" && data.property.owner) {
      const o = data.property.owner;
      setForm((f) => ({
        ...f,
        mandateKind: f.mandateKind === "CO_MANDAT" ? "EXCLUSIF" : f.mandateKind,
        cpName: o.company || `${o.firstName} ${o.lastName}`,
        cpRepresentative: o.company ? `${o.firstName} ${o.lastName}` : "",
        cpAddress: o.address || "",
        cpZipCode: o.zipCode || "",
        cpCity: o.city || "",
        cpEmail: o.email || "",
        cpPhone: o.phone || "",
        cpLegalForm: "",
        cpSiret: "",
        cpProCard: "",
      }));
      setEmail((e) => ({ ...e, to: o.email || "" }));
    }
    if (recipientType === "CO_MANDATAIRE") {
      setForm((f) => ({
        ...f,
        mandateKind: "CO_MANDAT",
        cpName: data.property.coMandatAgency || f.cpName,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientType, data]);

  function buildContractData(): ContractFormData | null {
    if (!data) return null;
    const a = data.agency;
    const cu = data.currentUser;
    return {
      recipientType,
      signedBy: `${cu.firstName} ${cu.lastName}`.trim(),
      agency: {
        name: a.name,
        legalForm: a.legalName || undefined,
        address: a.address || undefined,
        zipCode: a.zipCode || undefined,
        city: a.city || undefined,
        siret: a.siret || undefined,
        professionalCard: a.professionalCardNumber
          ? `${a.professionalCardNumber}${a.professionalCardAuthority ? ` (${a.professionalCardAuthority})` : ""}`
          : undefined,
        representative: `${cu.firstName} ${cu.lastName}`.trim(),
        email: a.email || undefined,
        phone: a.phone || undefined,
      },
      counterparty: {
        name: form.cpName,
        legalForm: form.cpLegalForm || undefined,
        address: form.cpAddress || undefined,
        zipCode: form.cpZipCode || undefined,
        city: form.cpCity || undefined,
        siret: form.cpSiret || undefined,
        professionalCard: form.cpProCard || undefined,
        representative: form.cpRepresentative || undefined,
        email: form.cpEmail || undefined,
        phone: form.cpPhone || undefined,
      },
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
      mandateKind: form.mandateKind,
      startDate: form.startDate,
      endDate: form.endDate,
      city: form.city,
      feesPercent: form.feesPercent,
      feesAmount: form.feesAmount,
      feesPayer: form.feesPayer,
      splitUsPct: form.splitUsPct,
      splitThemPct: form.splitThemPct,
      specialConditions: form.specialConditions,
    };
  }

  async function handleDownload() {
    setMessage(null);
    const contract = buildContractData();
    if (!contract) return;
    if (!contract.counterparty.name.trim()) {
      setMessage({ kind: "err", text: "Le nom du co-contractant est requis." });
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
      setMessage({ kind: "ok", text: "Contrat téléchargé." });
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
    if (!contract.counterparty.name.trim()) {
      setMessage({ kind: "err", text: "Le nom du co-contractant est requis." });
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
      const res = await fetch(`/api/properties/${propertyId}/contract/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject:
            email.subject.trim() ||
            `Contrat d'engagement — ${contract.property.reference} ${contract.property.title}`,
          message: email.body.trim(),
          recipientType: contract.recipientType,
          recipientName: contract.counterparty.name,
          fileName: contractFileName(contract),
          pdfBase64: base64,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ kind: "err", text: payload?.error || "Échec de l'envoi." });
        return;
      }
      setMessage({ kind: "ok", text: `Contrat envoyé à ${to}.` });
    } catch {
      setMessage({ kind: "err", text: "Erreur lors de l'envoi." });
    } finally {
      setBusy(null);
    }
  }

  const showFees = recipientType === "CO_MANDATAIRE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-anthracite-900">
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4 dark:border-stone-800">
          <div>
            <h2 className="text-lg font-semibold text-anthracite-900 dark:text-stone-100">
              Contrat d&apos;engagement
            </h2>
            <p className="text-xs text-stone-500">
              Générez et envoyez un mandat signable — les honoraires sont masqués pour le bailleur.
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
          <button
            onClick={() => setTab("form")}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === "form" ? "text-brand-600 border-b-2 border-brand-600" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            1 · Contenu du contrat
          </button>
          <button
            onClick={() => setTab("send")}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === "send" ? "text-brand-600 border-b-2 border-brand-600" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            2 · Envoyer par email
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-stone-500">Chargement…</p>
          ) : !data ? (
            <p className="py-8 text-center text-sm text-red-500">Impossible de charger le bien.</p>
          ) : tab === "form" ? (
            <div className="space-y-5">
              {/* Recipient type */}
              <div>
                <label className={labelCls}>Type de destinataire</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecipientType("BAILLEUR")}
                    className={`rounded-lg border px-3 py-3 text-left text-sm transition ${
                      recipientType === "BAILLEUR"
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                        : "border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-700 dark:bg-anthracite-800"
                    }`}
                  >
                    <div className="font-semibold text-anthracite-900 dark:text-stone-100">
                      Bailleur / Propriétaire
                    </div>
                    <div className="mt-0.5 text-[11px] text-stone-500">
                      Honoraires masqués dans le PDF.
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientType("CO_MANDATAIRE")}
                    className={`rounded-lg border px-3 py-3 text-left text-sm transition ${
                      recipientType === "CO_MANDATAIRE"
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                        : "border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-700 dark:bg-anthracite-800"
                    }`}
                  >
                    <div className="font-semibold text-anthracite-900 dark:text-stone-100">
                      Agence co-mandataire
                    </div>
                    <div className="mt-0.5 text-[11px] text-stone-500">
                      Répartition des honoraires visible.
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Type de mandat</label>
                  <select
                    className={inputCls}
                    value={form.mandateKind}
                    onChange={(e) =>
                      setForm({ ...form, mandateKind: e.target.value as ContractFormData["mandateKind"] })
                    }
                  >
                    <option value="SIMPLE">Mandat simple</option>
                    <option value="EXCLUSIF">Mandat exclusif</option>
                    <option value="CO_MANDAT">Co-mandat</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Lieu de signature</label>
                  <input
                    className={inputCls}
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Date de début</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelCls}>Date de fin</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Counterparty */}
              <div className="rounded-lg border border-stone-200 p-3 dark:border-stone-700">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  {recipientType === "BAILLEUR"
                    ? "Coordonnées du bailleur / propriétaire"
                    : "Coordonnées de l'agence co-mandataire"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className={labelCls}>Nom / Raison sociale *</label>
                    <input
                      className={inputCls}
                      value={form.cpName}
                      onChange={(e) => setForm({ ...form, cpName: e.target.value })}
                      placeholder={recipientType === "BAILLEUR" ? "M. Dupont / SCI Dupont" : "Agence XYZ"}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Représentant</label>
                    <input
                      className={inputCls}
                      value={form.cpRepresentative}
                      onChange={(e) => setForm({ ...form, cpRepresentative: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Forme juridique</label>
                    <input
                      className={inputCls}
                      value={form.cpLegalForm}
                      onChange={(e) => setForm({ ...form, cpLegalForm: e.target.value })}
                      placeholder="SARL, SCI, SAS…"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Adresse</label>
                    <input
                      className={inputCls}
                      value={form.cpAddress}
                      onChange={(e) => setForm({ ...form, cpAddress: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Code postal</label>
                    <input
                      className={inputCls}
                      value={form.cpZipCode}
                      onChange={(e) => setForm({ ...form, cpZipCode: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Ville</label>
                    <input
                      className={inputCls}
                      value={form.cpCity}
                      onChange={(e) => setForm({ ...form, cpCity: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>SIRET</label>
                    <input
                      className={inputCls}
                      value={form.cpSiret}
                      onChange={(e) => setForm({ ...form, cpSiret: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      {recipientType === "CO_MANDATAIRE" ? "Carte professionnelle" : "N° identifiant"}
                    </label>
                    <input
                      className={inputCls}
                      value={form.cpProCard}
                      onChange={(e) => setForm({ ...form, cpProCard: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Téléphone</label>
                    <input
                      className={inputCls}
                      value={form.cpPhone}
                      onChange={(e) => setForm({ ...form, cpPhone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Email</label>
                    <input
                      type="email"
                      className={inputCls}
                      value={form.cpEmail}
                      onChange={(e) => setForm({ ...form, cpEmail: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Fees — only visible if not bailleur */}
              {showFees && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900/30 dark:bg-amber-900/10">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                    Honoraires &amp; répartition (masqué sur l&apos;exemplaire bailleur)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Taux d&apos;honoraires</label>
                      <input
                        className={inputCls}
                        value={form.feesPercent}
                        onChange={(e) => setForm({ ...form, feesPercent: e.target.value })}
                        placeholder="ex: 15 % du loyer annuel HT"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Montant</label>
                      <input
                        className={inputCls}
                        value={form.feesAmount}
                        onChange={(e) => setForm({ ...form, feesAmount: e.target.value })}
                        placeholder="ex: 25 000 € HT"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Partie redevable</label>
                      <select
                        className={inputCls}
                        value={form.feesPayer}
                        onChange={(e) =>
                          setForm({ ...form, feesPayer: e.target.value as ContractFormData["feesPayer"] })
                        }
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
                          value={form.splitUsPct}
                          onChange={(e) => setForm({ ...form, splitUsPct: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>% Co-mandataire</label>
                        <input
                          className={inputCls}
                          value={form.splitThemPct}
                          onChange={(e) => setForm({ ...form, splitThemPct: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className={labelCls}>Conditions particulières</label>
                <textarea
                  className={inputCls}
                  rows={3}
                  value={form.specialConditions}
                  onChange={(e) => setForm({ ...form, specialConditions: e.target.value })}
                  placeholder="Informations complémentaires, exclusivités, exclusions…"
                />
              </div>

              <div className="rounded-lg bg-stone-50 p-3 text-xs text-stone-600 dark:bg-anthracite-800/50 dark:text-stone-400">
                Signé par <strong className="text-anthracite-800 dark:text-stone-200">{data.currentUser.firstName} {data.currentUser.lastName}</strong>{" "}
                pour le compte de <strong className="text-anthracite-800 dark:text-stone-200">{data.agency.name}</strong>.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Destinataire (email)</label>
                <input
                  type="email"
                  className={inputCls}
                  value={email.to}
                  onChange={(e) => setEmail({ ...email, to: e.target.value })}
                  placeholder="contact@agence-partenaire.fr"
                />
              </div>
              <div>
                <label className={labelCls}>Objet</label>
                <input
                  className={inputCls}
                  value={email.subject}
                  onChange={(e) => setEmail({ ...email, subject: e.target.value })}
                  placeholder={`Contrat d'engagement — ${data.property.reference} ${data.property.title}`}
                />
              </div>
              <div>
                <label className={labelCls}>Message</label>
                <textarea
                  className={inputCls}
                  rows={6}
                  value={email.body}
                  onChange={(e) => setEmail({ ...email, body: e.target.value })}
                  placeholder="Bonjour, veuillez trouver ci-joint le contrat d'engagement pour signature…"
                />
              </div>
              <div className="rounded-lg bg-stone-50 p-3 text-xs text-stone-600 dark:bg-anthracite-800/50 dark:text-stone-400">
                Le PDF sera généré avec le logo {data.agency.name}, les mentions légales de l&apos;agence et{" "}
                {recipientType === "BAILLEUR" ? (
                  <strong>sans la partie honoraires</strong>
                ) : (
                  <strong>avec la répartition d&apos;honoraires</strong>
                )}.
                Pièce jointe nommée automatiquement.
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
              Télécharger le PDF
            </Button>
            {tab === "send" && (
              <Button type="button" onClick={handleSend} isLoading={busy === "email"} disabled={loading}>
                Envoyer par email
              </Button>
            )}
            {tab === "form" && (
              <Button type="button" onClick={() => setTab("send")} disabled={loading}>
                Suivant — Envoyer
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
