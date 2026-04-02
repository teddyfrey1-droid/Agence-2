"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

const STATUS_LABELS: Record<string, string> = {
  SUGGERE: "Suggere",
  VALIDE: "Valide",
  REJETE: "Rejete",
  EN_VISITE: "En visite",
  RETENU: "Retenu",
};

const STATUS_COLORS: Record<string, string> = {
  SUGGERE: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
  VALIDE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  REJETE: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  EN_VISITE: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  RETENU: "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400",
};

interface MatchActionsProps {
  matchId: string;
  currentStatus: string;
}

export function MatchActions({ matchId, currentStatus }: MatchActionsProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [status, setStatus] = useState(currentStatus);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Erreur");
      setStatus(newStatus);
      setOpen(false);
      addToast(`Match ${STATUS_LABELS[newStatus]?.toLowerCase() || newStatus}`, "success");
      router.refresh();
    } catch {
      addToast("Erreur de mise a jour", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={loading}
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${STATUS_COLORS[status] || STATUS_COLORS.SUGGERE}`}
      >
        {STATUS_LABELS[status] || status}
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-36 rounded-lg border border-stone-200 bg-white py-1 shadow-lg dark:border-stone-700 dark:bg-anthracite-800">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => updateStatus(key)}
                disabled={key === status}
                className={`w-full px-3 py-1.5 text-left text-xs transition-colors ${
                  key === status
                    ? "bg-stone-50 font-semibold text-anthracite-800 dark:bg-anthracite-700 dark:text-stone-200"
                    : "text-stone-600 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-anthracite-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
