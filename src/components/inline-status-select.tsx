"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { PROPERTY_STATUS_LABELS } from "@/lib/constants";

const STATUSES = Object.keys(PROPERTY_STATUS_LABELS);

interface InlineStatusSelectProps {
  propertyId: string;
  currentStatus: string;
  isCoMandat?: boolean;
}

export function InlineStatusSelect({ propertyId, currentStatus, isCoMandat }: InlineStatusSelectProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleChange(newStatus: string) {
    if (newStatus === status) { setOpen(false); return; }
    setLoading(true);
    const prev = status;
    setStatus(newStatus);
    setOpen(false);

    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      addToast(`Statut → ${PROPERTY_STATUS_LABELS[newStatus]}`, "success");
      router.refresh();
    } catch {
      setStatus(prev);
      addToast("Erreur changement de statut", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={ref} className="relative inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        disabled={loading}
        className="text-left"
      >
        <Badge variant={getStatusBadgeVariant(status)}>
          {loading ? "..." : PROPERTY_STATUS_LABELS[status] || status}
          <svg className="ml-1 -mr-0.5 h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </Badge>
      </button>
      {isCoMandat && <Badge variant="info">Co-mandat</Badge>}

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-lg border border-stone-200 bg-white shadow-lg dark:border-anthracite-800 dark:bg-anthracite-900 overflow-hidden">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleChange(s); }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors ${
                s === status
                  ? "bg-brand-50 text-brand-800 font-medium dark:bg-brand-900/30 dark:text-brand-300"
                  : "text-anthracite-700 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-anthracite-800"
              }`}
            >
              <Badge variant={getStatusBadgeVariant(s)} className="text-[10px] px-1.5 py-0">
                {PROPERTY_STATUS_LABELS[s]}
              </Badge>
              {s === status && (
                <svg className="ml-auto h-3.5 w-3.5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
