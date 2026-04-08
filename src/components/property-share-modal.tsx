"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

interface Share {
  id: string;
  recipientEmail: string;
  recipientName: string | null;
  sentAt: string;
  openedAt: string | null;
  viewCount: number;
  totalViewDuration: number;
  sentBy: { firstName: string; lastName: string };
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h${m > 0 ? `${m}min` : ""}`;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-800 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-200";

export function PropertyShareModal({
  propertyId,
  onClose,
}: {
  propertyId: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"send" | "history">("send");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [shares, setShares] = useState<Share[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    recipientEmail: "",
    recipientName: "",
    contactId: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/contacts?search=${encodeURIComponent(search)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.items) setContacts(data.items.filter((c: Contact) => c.email));
      })
      .catch(() => {});
  }, [search]);

  useEffect(() => {
    fetch(`/api/properties/${propertyId}/share`)
      .then((r) => r.json())
      .then(setShares)
      .catch(() => {});
  }, [propertyId, success]);

  const selectContact = (contact: Contact) => {
    setForm({
      ...form,
      recipientEmail: contact.email || "",
      recipientName: `${contact.firstName} ${contact.lastName}`,
      contactId: contact.id,
    });
    setSearch("");
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.recipientEmail) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/properties/${propertyId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur");
        return;
      }
      setSuccess(true);
      setForm({ recipientEmail: "", recipientName: "", contactId: "", message: "" });
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Erreur réseau");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-anthracite-900 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-stone-100 dark:border-stone-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-anthracite-900 dark:text-stone-100">Envoyer ce bien</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-100 dark:border-stone-800">
          <button
            onClick={() => setTab("send")}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === "send" ? "text-brand-600 border-b-2 border-brand-600" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            Envoyer
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === "history" ? "text-brand-600 border-b-2 border-brand-600" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            Historique ({shares.length})
          </button>
        </div>

        {tab === "send" && (
          <form onSubmit={handleSend} className="px-6 py-4 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
            )}
            {success && (
              <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">
                Bien envoyé avec succès !
              </div>
            )}

            {/* Contact search */}
            <div>
              <label className="block text-sm font-medium text-anthracite-700 dark:text-stone-300 mb-1">
                Destinataire
              </label>
              {form.recipientName ? (
                <div className="flex items-center justify-between rounded-lg bg-brand-50 dark:bg-brand-900/20 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">{form.recipientName}</p>
                    <p className="text-xs text-stone-500">{form.recipientEmail}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, recipientEmail: "", recipientName: "", contactId: "" })}
                    className="text-stone-400 hover:text-stone-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Rechercher un contact..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={inputClass}
                  />
                  {search.length >= 2 && contacts.length > 0 && (
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-stone-200 dark:border-stone-700 divide-y divide-stone-100 dark:divide-stone-800">
                      {contacts.slice(0, 8).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectContact(c)}
                          className="w-full px-3 py-2 text-left hover:bg-stone-50 dark:hover:bg-anthracite-800 transition-colors"
                        >
                          <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">
                            {c.firstName} {c.lastName}
                          </p>
                          <p className="text-xs text-stone-400">{c.email}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-stone-400 dark:text-stone-500">ou saisir manuellement :</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nom"
                      value={form.recipientName}
                      onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                      className={inputClass}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      required
                      value={form.recipientEmail}
                      onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-anthracite-700 dark:text-stone-300 mb-1">
                Message personnalisé <span className="text-stone-400 font-normal">(optionnel)</span>
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Bonjour, je pense que ce bien pourrait vous intéresser..."
                rows={3}
                className={inputClass}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
              <Button type="submit" isLoading={sending}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                Envoyer
              </Button>
            </div>
          </form>
        )}

        {tab === "history" && (
          <div className="px-6 py-4">
            {shares.length === 0 ? (
              <p className="text-center text-sm text-stone-400 dark:text-stone-500 py-8">
                Ce bien n&apos;a pas encore été envoyé.
              </p>
            ) : (
              <div className="space-y-3">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="rounded-lg border border-stone-100 dark:border-stone-800 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">
                          {share.recipientName || share.recipientEmail}
                        </p>
                        {share.recipientName && (
                          <p className="text-xs text-stone-400">{share.recipientEmail}</p>
                        )}
                        <p className="text-[10px] text-stone-400 mt-1">
                          Par {share.sentBy.firstName} {share.sentBy.lastName} — {formatDate(share.sentAt)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {share.openedAt ? (
                          <>
                            <Badge variant="success">Ouvert</Badge>
                            <p className="mt-1 text-[10px] text-stone-400">
                              {share.viewCount} vue{share.viewCount > 1 ? "s" : ""}
                            </p>
                            <p className="text-[10px] text-stone-400">
                              {formatDuration(share.totalViewDuration)} de consultation
                            </p>
                          </>
                        ) : (
                          <Badge variant="neutral">Non ouvert</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
