"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PropertyShareModal } from "./property-share-modal";

interface Props {
  propertyId: string;
  contactId?: string;
  contactName?: string;
  contactEmail?: string;
}

export function PropertyShareButton({ propertyId, contactId, contactName, contactEmail }: Props) {
  const [showModal, setShowModal] = useState(false);

  // If no propertyId, show a property picker first (from contact page)
  const isFromContactPage = !propertyId;

  if (isFromContactPage) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => setShowModal(true)}
        >
          <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
          Envoyer un bien
        </Button>
        {showModal && (
          <PropertyPickerModal
            contactId={contactId}
            contactName={contactName}
            contactEmail={contactEmail}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => setShowModal(true)}
      >
        <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
        </svg>
        Envoyer à un client
      </Button>
      {showModal && (
        <PropertyShareModal
          propertyId={propertyId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

// ── Property picker for contact page ────────────────────────────

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-800 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-200";

interface Property {
  id: string;
  reference: string;
  title: string;
  city: string;
  status: string;
}

function PropertyPickerModal({
  contactId,
  contactName,
  contactEmail,
  onClose,
}: {
  contactId?: string;
  contactName?: string;
  contactEmail?: string;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    if (value.length < 2) { setProperties([]); return; }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/properties?search=${encodeURIComponent(value)}&status=ACTIF`);
        if (res.ok) {
          const data = await res.json();
          setProperties(data.items || []);
        }
      } catch { /* ignore */ }
    }, 300);
    setSearchTimeout(timeout);
  };

  const handleSend = async () => {
    if (!selectedProperty || !contactEmail) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/properties/${selectedProperty.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: contactEmail,
          recipientName: contactName || "",
          contactId: contactId || undefined,
          message: message || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur");
        return;
      }
      setSuccess(true);
      setTimeout(() => onClose(), 2000);
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
          <div>
            <h2 className="text-lg font-semibold text-anthracite-900 dark:text-stone-100">Envoyer un bien</h2>
            {contactName && (
              <p className="text-sm text-stone-500">à {contactName} ({contactEmail})</p>
            )}
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
          )}
          {success && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">
              Bien envoyé avec succès !
            </div>
          )}

          {!selectedProperty ? (
            <>
              <div>
                <label className="block text-sm font-medium text-anthracite-700 dark:text-stone-300 mb-1">
                  Rechercher un bien
                </label>
                <input
                  type="text"
                  placeholder="Tapez une référence, titre ou adresse..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
              </div>

              {properties.length > 0 && (
                <div className="max-h-60 overflow-y-auto rounded-lg border border-stone-200 dark:border-stone-700 divide-y divide-stone-100 dark:divide-stone-800">
                  {properties.slice(0, 10).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProperty(p)}
                      className="w-full px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-anthracite-800 transition-colors"
                    >
                      <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">
                        {p.reference} — {p.title}
                      </p>
                      <p className="text-xs text-stone-400">{p.city}</p>
                    </button>
                  ))}
                </div>
              )}

              {search.length >= 2 && properties.length === 0 && (
                <p className="text-sm text-stone-400 text-center py-4">Aucun bien trouvé</p>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg bg-brand-50 dark:bg-brand-900/20 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-anthracite-800 dark:text-stone-200">
                    {selectedProperty.reference} — {selectedProperty.title}
                  </p>
                  <p className="text-xs text-stone-500">{selectedProperty.city}</p>
                </div>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-anthracite-700 dark:text-stone-300 mb-1">
                  Message personnalisé <span className="text-stone-400 font-normal">(optionnel)</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Bonjour, je pense que ce bien pourrait vous intéresser..."
                  rows={3}
                  className={inputClass}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={onClose}>Annuler</Button>
                <Button onClick={handleSend} isLoading={sending} disabled={!contactEmail}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                  Envoyer
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
