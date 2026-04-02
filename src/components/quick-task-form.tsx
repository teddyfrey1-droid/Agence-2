"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

interface QuickTaskFormProps {
  contactId?: string;
  dealId?: string;
  propertyId?: string;
}

export function QuickTaskForm({ contactId, dealId, propertyId }: QuickTaskFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          priority: formData.get("priority") || "NORMALE",
          dueDate: formData.get("dueDate") || undefined,
          contactId: contactId || undefined,
          dealId: dealId || undefined,
          propertyId: propertyId || undefined,
        }),
      });
      if (!res.ok) throw new Error("Erreur");
      addToast("Tache ajoutee", "success");
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
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-stone-200 px-4 py-3 text-sm font-medium text-stone-400 transition-colors hover:border-emerald-300 hover:text-emerald-600 dark:border-stone-700 dark:text-stone-500 dark:hover:border-emerald-600 dark:hover:text-emerald-400"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Ajouter une tache
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-anthracite-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-anthracite-800 dark:text-stone-200">Nouvelle tache</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          name="title"
          required
          placeholder="Titre de la tache"
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-800 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-stone-600 dark:bg-anthracite-900 dark:text-stone-200 dark:placeholder:text-stone-500"
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            name="priority"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-stone-600 dark:bg-anthracite-900 dark:text-stone-200"
          >
            <option value="BASSE">Basse</option>
            <option value="NORMALE" selected>Normale</option>
            <option value="HAUTE">Haute</option>
            <option value="URGENTE">Urgente</option>
          </select>
          <input
            name="dueDate"
            type="date"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-stone-600 dark:bg-anthracite-900 dark:text-stone-200"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-1.5 text-sm text-stone-500 hover:text-anthracite-700 dark:text-stone-400 dark:hover:text-stone-200">
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSubmitting ? "..." : "Ajouter"}
          </button>
        </div>
      </form>
    </div>
  );
}
