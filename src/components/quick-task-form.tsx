"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { haptic } from "@/lib/haptics";

interface QuickTaskFormProps {
  contactId?: string;
  dealId?: string;
  propertyId?: string;
}

interface TaskTemplate {
  id: string;
  label: string;
  /** Days from today the task is due in */
  inDays: number;
  priority: "BASSE" | "NORMALE" | "HAUTE" | "URGENTE";
  title: string;
  /** Hint shown under the label, kept short */
  hint: string;
}

const TEMPLATES: TaskTemplate[] = [
  { id: "follow-3", label: "Relance J+3", inDays: 3, priority: "NORMALE", title: "Relancer le contact", hint: "Appel ou SMS de suivi" },
  { id: "follow-7", label: "Relance J+7", inDays: 7, priority: "NORMALE", title: "Relancer le contact (1 semaine)", hint: "Si pas de retour" },
  { id: "visit", label: "Préparer visite", inDays: 1, priority: "HAUTE", title: "Préparer la visite (clés, fiche, plan)", hint: "Vérifier accès & docs" },
  { id: "cni", label: "Demander CNI", inDays: 2, priority: "HAUTE", title: "Demander pièce d'identité + justificatifs", hint: "RIB, K-bis, statuts" },
  { id: "offer", label: "Préparer offre", inDays: 1, priority: "URGENTE", title: "Rédiger l'offre / lettre d'intention", hint: "Avec conditions suspensives" },
  { id: "estim", label: "Estimer", inDays: 5, priority: "NORMALE", title: "Réaliser une estimation chiffrée", hint: "Comparables + fourchette" },
  { id: "compromis", label: "Compromis", inDays: 14, priority: "HAUTE", title: "Préparer le compromis de vente", hint: "Notaire + clauses" },
];

function isoForDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  // YYYY-MM-DD for the date input
  return d.toISOString().slice(0, 10);
}

export function QuickTaskForm({ contactId, dealId, propertyId }: QuickTaskFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const priorityRef = useRef<HTMLSelectElement>(null);

  function applyTemplate(t: TaskTemplate) {
    haptic("select");
    if (titleRef.current) titleRef.current.value = t.title;
    if (dateRef.current) dateRef.current.value = isoForDaysFromNow(t.inDays);
    if (priorityRef.current) priorityRef.current.value = t.priority;
  }

  async function quickCreate(t: TaskTemplate) {
    setIsSubmitting(true);
    haptic("tap");
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t.title,
          priority: t.priority,
          dueDate: isoForDaysFromNow(t.inDays),
          contactId: contactId || undefined,
          dealId: dealId || undefined,
          propertyId: propertyId || undefined,
        }),
      });
      if (!res.ok) throw new Error("Erreur");
      addToast(`« ${t.label} » ajoutée pour J+${t.inDays}`, "success");
      router.refresh();
    } catch {
      addToast("Erreur lors de l'ajout", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

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
      addToast("Tâche ajoutée", "success");
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
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-stone-200 px-4 py-3 text-sm font-medium text-stone-400 transition-colors hover:border-emerald-300 hover:text-emerald-600 dark:border-stone-700 dark:text-stone-500 dark:hover:border-emerald-600 dark:hover:text-emerald-400"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Ajouter une tâche
        </button>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {TEMPLATES.slice(0, 4).map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={isSubmitting}
              onClick={() => quickCreate(t)}
              className="flex-shrink-0 whitespace-nowrap rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-anthracite-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50 dark:border-stone-700 dark:bg-anthracite-800 dark:text-stone-300 dark:hover:border-brand-600 dark:hover:bg-brand-900/20"
              title={`${t.title} — J+${t.inDays}`}
            >
              + {t.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-anthracite-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-anthracite-800 dark:text-stone-200">Nouvelle tâche</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Templates */}
      <div className="mb-3">
        <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
          Modèles
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t)}
              className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-anthracite-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-stone-700 dark:bg-anthracite-900 dark:text-stone-300 dark:hover:border-brand-600 dark:hover:bg-brand-900/20"
              title={`${t.title} — J+${t.inDays} · ${t.hint}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          ref={titleRef}
          name="title"
          required
          placeholder="Titre de la tâche"
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-800 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-stone-600 dark:bg-anthracite-900 dark:text-stone-200 dark:placeholder:text-stone-500"
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            ref={priorityRef}
            name="priority"
            defaultValue="NORMALE"
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-stone-600 dark:bg-anthracite-900 dark:text-stone-200"
          >
            <option value="BASSE">Basse</option>
            <option value="NORMALE">Normale</option>
            <option value="HAUTE">Haute</option>
            <option value="URGENTE">Urgente</option>
          </select>
          <input
            ref={dateRef}
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
