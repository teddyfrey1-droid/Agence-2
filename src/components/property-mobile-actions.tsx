"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { haptic } from "@/lib/haptics";
import { PropertyShareModal } from "@/components/property-share-modal";
import { PropertyContractModal } from "@/components/property-contract-modal";

interface Props {
  propertyId: string;
  reference: string;
  isPublished: boolean;
}

/**
 * Sticky bottom action bar shown only on mobile (`lg:hidden`).
 * Surfaces the four most useful operations on a property fiche with
 * XXL touch targets so the agent can act with one thumb on the road:
 *  1. Partager → opens the existing PropertyShareModal
 *  2. Contrat  → opens the existing PropertyContractModal
 *  3. PDF      → triggers the same /api/properties/[id]/pdf flow used by the desktop button
 *  4. Modifier → navigates to the edit page
 */
export function PropertyMobileActions({ propertyId, reference, isPublished }: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  const [openShare, setOpenShare] = useState(false);
  const [openContract, setOpenContract] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  async function downloadPdf() {
    haptic("tap");
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/pdf`);
      if (!res.ok) throw new Error("Erreur PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reference}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addToast("PDF téléchargé", "success");
    } catch {
      addToast("Erreur lors du téléchargement", "error");
    } finally {
      setPdfLoading(false);
    }
  }

  async function togglePublish() {
    haptic("tap");
    try {
      const res = await fetch(`/api/properties/${propertyId}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: !isPublished }),
      });
      if (!res.ok) throw new Error();
      addToast(isPublished ? "Bien dépublié" : "Bien publié", "success");
      router.refresh();
    } catch {
      addToast("Erreur lors de la mise à jour", "error");
    }
  }

  return (
    <>
      {/* Spacer so page content isn't hidden by the bar. We only push when
          the bottom bar is present (mobile + dashboard, where the global
          mobile-bottom-nav already adds 80px — we add another 72px here). */}
      <div className="h-20 lg:hidden" aria-hidden />

      <div
        className="fixed inset-x-0 bottom-20 z-30 border-t border-stone-200 bg-white/95 px-3 pb-safe pt-2 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden dark:border-anthracite-800 dark:bg-anthracite-900/95"
        role="toolbar"
        aria-label="Actions du bien"
      >
        <div className="grid grid-cols-4 gap-1">
          <ActionButton
            label="Partager"
            color="brand"
            onClick={() => { haptic("tap"); setOpenShare(true); }}
            icon="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
          />
          <ActionButton
            label="Contrat"
            color="amber"
            onClick={() => { haptic("tap"); setOpenContract(true); }}
            icon="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
          />
          <ActionButton
            label="PDF"
            color="blue"
            onClick={downloadPdf}
            disabled={pdfLoading}
            icon="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
          <ActionButton
            label={isPublished ? "Dépublier" : "Publier"}
            color={isPublished ? "stone" : "emerald"}
            onClick={togglePublish}
            icon={isPublished
              ? "M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
              : "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z"}
          />
        </div>
        <div className="mt-1.5 flex justify-center">
          <Link
            href={`/dashboard/biens/${propertyId}/modifier`}
            onClick={() => haptic("tap")}
            className="text-[10.5px] font-medium text-stone-400 hover:text-anthracite-700 dark:text-stone-500 dark:hover:text-stone-200"
          >
            Modifier la fiche →
          </Link>
        </div>
      </div>

      {openShare && <PropertyShareModal propertyId={propertyId} onClose={() => setOpenShare(false)} />}
      {openContract && <PropertyContractModal propertyId={propertyId} onClose={() => setOpenContract(false)} />}
    </>
  );
}

const COLOR_CLASSES: Record<string, string> = {
  brand: "text-brand-700 bg-brand-50 dark:text-brand-300 dark:bg-brand-900/30",
  amber: "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-900/30",
  blue: "text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30",
  emerald: "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30",
  stone: "text-stone-700 bg-stone-100 dark:text-stone-300 dark:bg-stone-700/40",
};

function ActionButton({
  label,
  icon,
  onClick,
  color,
  disabled,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  color: keyof typeof COLOR_CLASSES;
  disabled?: boolean;
}) {
  const classes = COLOR_CLASSES[color] || COLOR_CLASSES.brand;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 transition-transform active:scale-95 disabled:opacity-50"
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${classes}`}>
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </span>
      <span className="text-[10.5px] font-semibold text-anthracite-800 dark:text-stone-200">{label}</span>
    </button>
  );
}
