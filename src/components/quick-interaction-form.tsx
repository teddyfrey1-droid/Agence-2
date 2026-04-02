"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { INTERACTION_TYPE_LABELS } from "@/lib/constants";

const typeOptions = Object.entries(INTERACTION_TYPE_LABELS).map(([value, label]) => ({ value, label }));

interface QuickInteractionFormProps {
  contactId?: string;
  dealId?: string;
  propertyId?: string;
}

export function QuickInteractionForm({ contactId, dealId, propertyId }: QuickInteractionFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formData.get("type"),
          subject: formData.get("subject") || undefined,
          content: formData.get("content") || undefined,
          contactId: contactId || undefined,
          dealId: dealId || undefined,
          propertyId: propertyId || undefined,
        }),
      });
      if (!res.ok) throw new Error("Erreur");
      addToast("Interaction ajoutée", "success");
      setOpen(false);
      router.refresh();
    } catch {
      addToast("Erreur lors de l'ajout", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-stone-200 px-4 py-3 text-sm font-medium text-stone-400 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-stone-700 dark:text-stone-500 dark:hover:border-brand-600 dark:hover:text-brand-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Ajouter une interaction
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-anthracite-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-anthracite-800 dark:text-stone-200">Nouvelle interaction</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <select
          name="type"
          required
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-stone-600 dark:bg-anthracite-900 dark:text-stone-200"
        >
          {typeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input
          name="subject"
          placeholder="Sujet"
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-800 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-stone-600 dark:bg-anthracite-900 dark:text-stone-200 dark:placeholder:text-stone-500"
        />
        <textarea
          name="content"
          placeholder="Notes..."
          rows={2}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-800 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-stone-600 dark:bg-anthracite-900 dark:text-stone-200 dark:placeholder:text-stone-500"
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-1.5 text-sm text-stone-500 hover:text-anthracite-700 dark:text-stone-400 dark:hover:text-stone-200">
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            {isSubmitting ? "..." : "Ajouter"}
          </button>
        </div>
      </form>
    </div>
  );
}
