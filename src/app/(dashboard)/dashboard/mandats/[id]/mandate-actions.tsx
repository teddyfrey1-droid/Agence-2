"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { PropertyContractModal } from "@/components/property-contract-modal";

export function MandateActions({
  mandateId,
  status,
  propertyId,
}: {
  mandateId: string;
  status: string;
  propertyId: string | null;
}) {
  const router = useRouter();
  const { addToast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [showContract, setShowContract] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function setStatus(next: string, successMessage: string) {
    setBusy(next);
    try {
      const res = await fetch(`/api/mandates/${mandateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur");
      }
      addToast(successMessage, "success");
      router.refresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Erreur", "error");
    } finally {
      setBusy(null);
    }
  }

  async function handleRenew() {
    setBusy("renew");
    try {
      const res = await fetch(`/api/mandates/${mandateId}/renew`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur");
      }
      const next = await res.json();
      addToast("Mandat renouvelé — nouveau brouillon créé", "success");
      router.push(`/dashboard/mandats/${next.id}`);
      router.refresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Erreur", "error");
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    setBusy("delete");
    try {
      const res = await fetch(`/api/mandates/${mandateId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur");
      }
      addToast("Mandat supprimé", "success");
      router.push("/dashboard/mandats");
      router.refresh();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Erreur", "error");
      setBusy(null);
    }
  }

  const terminal = status === "ANNULE" || status === "EXPIRE";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {propertyId ? (
          <Button onClick={() => setShowContract(true)}>
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3 3m0 0l-3-3m3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Générer le document
          </Button>
        ) : (
          <Button disabled title="Liez un bien au mandat pour générer le document">
            Générer le document
          </Button>
        )}

        {status === "BROUILLON" && (
          <Button
            variant="outline"
            isLoading={busy === "ENVOYE"}
            onClick={() => setStatus("ENVOYE", "Mandat marqué comme envoyé")}
          >
            Marquer envoyé
          </Button>
        )}
        {(status === "BROUILLON" || status === "ENVOYE") && (
          <Button
            variant="outline"
            isLoading={busy === "SIGNE"}
            onClick={() => setStatus("SIGNE", "Mandat marqué comme signé")}
          >
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Marquer signé
          </Button>
        )}
        {!terminal && (
          <Button
            variant="ghost"
            isLoading={busy === "ANNULE"}
            onClick={() => setStatus("ANNULE", "Mandat annulé")}
          >
            Annuler le mandat
          </Button>
        )}
        {(status === "SIGNE" || status === "EXPIRE") && (
          <Button variant="outline" isLoading={busy === "renew"} onClick={handleRenew}>
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Renouveler
          </Button>
        )}

        <Button
          variant="ghost"
          isLoading={busy === "delete"}
          onClick={handleDelete}
          className={confirmDelete ? "text-red-600 dark:text-red-400" : "text-stone-400"}
        >
          {confirmDelete ? "Confirmer la suppression ?" : "Supprimer"}
        </Button>
      </div>

      {showContract && propertyId && (
        <PropertyContractModal propertyId={propertyId} onClose={() => setShowContract(false)} />
      )}
    </>
  );
}
