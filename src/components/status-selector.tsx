"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

interface StatusOption {
  value: string;
  label: string;
  icon: string;
}

const FIELD_SPOTTING_STATUSES: StatusOption[] = [
  { value: "REPERE", label: "Repéré", icon: "👁" },
  { value: "APPELE", label: "Appelé", icon: "📞" },
  { value: "EN_ATTENTE_RETOUR", label: "En attente de retour", icon: "⏳" },
  { value: "A_QUALIFIER", label: "À qualifier", icon: "📋" },
  { value: "QUALIFIE", label: "Qualifié", icon: "✅" },
  { value: "CONVERTI", label: "Converti", icon: "🏢" },
  { value: "REJETE", label: "Rejeté", icon: "✗" },
];

const STATUS_COLORS: Record<string, string> = {
  REPERE: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  APPELE: "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
  EN_ATTENTE_RETOUR: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  A_QUALIFIER: "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  QUALIFIE: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  CONVERTI: "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400",
  REJETE: "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400",
};

interface StatusSelectorProps {
  entityId: string;
  entityType: "field-spotting";
  currentStatus: string;
}

export function StatusSelector({ entityId, entityType, currentStatus }: StatusSelectorProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleStatusChange(newStatus: string) {
    if (newStatus === status) return;
    setIsUpdating(true);
    const previousStatus = status;
    setStatus(newStatus);

    try {
      const res = await fetch(`/api/${entityType}/${entityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Erreur");
      const label = FIELD_SPOTTING_STATUSES.find((s) => s.value === newStatus)?.label || newStatus;
      addToast(`Statut mis à jour : ${label}`, "success");
      router.refresh();
    } catch {
      setStatus(previousStatus);
      addToast("Erreur lors du changement de statut", "error");
    } finally {
      setIsUpdating(false);
    }
  }

  const currentIndex = FIELD_SPOTTING_STATUSES.findIndex((s) => s.value === status);

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
        Pipeline de suivi
      </h3>
      <div className="flex flex-col gap-1.5">
        {FIELD_SPOTTING_STATUSES.map((option, index) => {
          const isActive = option.value === status;
          const isPast = index < currentIndex;
          return (
            <button
              key={option.value}
              type="button"
              disabled={isUpdating}
              onClick={() => handleStatusChange(option.value)}
              className={`
                flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-all
                ${isActive
                  ? STATUS_COLORS[option.value]
                  : isPast
                    ? "border-stone-200 bg-stone-50 text-stone-500 dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-400"
                    : "border-stone-100 bg-white text-stone-400 hover:border-stone-300 hover:text-stone-600 dark:border-stone-800 dark:bg-anthracite-800 dark:text-stone-500 dark:hover:border-stone-600 dark:hover:text-stone-300"
                }
                ${isUpdating ? "opacity-50 cursor-wait" : "cursor-pointer"}
              `}
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs">
                {isPast ? "✓" : isActive ? option.icon : `${index + 1}`}
              </span>
              <span>{option.label}</span>
              {isActive && (
                <span className="ml-auto text-[10px] font-normal uppercase tracking-wide opacity-70">
                  actuel
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
