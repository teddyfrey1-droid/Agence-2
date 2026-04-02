"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

interface DeleteButtonProps {
  entityId: string;
  entityType: "contacts" | "properties" | "deals" | "search-requests" | "field-spotting" | "tasks";
  entityLabel: string;
  redirectTo: string;
}

const LABELS: Record<string, string> = {
  contacts: "ce contact",
  properties: "ce bien",
  deals: "ce dossier",
  "search-requests": "cette demande",
  "field-spotting": "ce reperage",
  tasks: "cette tache",
};

export function DeleteButton({ entityId, entityType, entityLabel, redirectTo }: DeleteButtonProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/${entityType}/${entityId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur");
      addToast(`${entityLabel} supprime`, "success");
      router.push(redirectTo);
    } catch {
      addToast("Erreur lors de la suppression", "error");
    } finally {
      setIsDeleting(false);
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800/30 dark:bg-anthracite-800 dark:text-red-400 dark:hover:bg-red-900/20"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
        Supprimer
      </button>
      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDelete}
        title="Confirmer la suppression"
        message={`Etes-vous sur de vouloir supprimer ${LABELS[entityType] || "cet element"} ? Cette action est irreversible.`}
        confirmLabel="Supprimer"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
