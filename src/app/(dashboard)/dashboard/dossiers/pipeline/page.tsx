"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DEAL_STAGE_LABELS } from "@/lib/constants";

interface KanbanDeal {
  id: string;
  reference: string;
  title: string;
  stage: string;
  estimatedValue: number | null;
  property: { title: string; reference: string } | null;
  contact: { firstName: string; lastName: string } | null;
  assignedTo: { firstName: string; lastName: string } | null;
}

const PIPELINE_STAGES = ["PROSPECT", "DECOUVERTE", "VISITE", "NEGOCIATION", "OFFRE", "COMPROMIS", "ACTE", "CLOTURE"];

const STAGE_COLORS: Record<string, string> = {
  PROSPECT: "bg-stone-400",
  DECOUVERTE: "bg-blue-400",
  VISITE: "bg-indigo-400",
  NEGOCIATION: "bg-amber-500",
  OFFRE: "bg-orange-500",
  COMPROMIS: "bg-purple-500",
  ACTE: "bg-emerald-500",
  CLOTURE: "bg-green-600",
};

function fmtPrice(val: number | null) {
  if (!val) return "";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val);
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<KanbanDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const dragItemRef = useRef<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/deals/kanban");
        if (res.ok) {
          const data = await res.json();
          setDeals(Array.isArray(data) ? data : data.deals ?? []);
        }
      } catch { /* */ }
      finally { setLoading(false); }
    })();
  }, []);

  async function moveToStage(dealId: string, newStage: string) {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d))
    );
    try {
      await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
    } catch {
      // Revert on error - refetch
      const res = await fetch("/api/deals/kanban");
      if (res.ok) {
        const data = await res.json();
        setDeals(Array.isArray(data) ? data : data.deals ?? []);
      }
    }
  }

  function handleDragStart(dealId: string) {
    dragItemRef.current = dealId;
  }

  function handleDragOver(e: React.DragEvent, stage: string) {
    e.preventDefault();
    setDragOverStage(stage);
  }

  function handleDragLeave() {
    setDragOverStage(null);
  }

  function handleDrop(stage: string) {
    setDragOverStage(null);
    if (dragItemRef.current) {
      moveToStage(dragItemRef.current, stage);
      dragItemRef.current = null;
    }
  }

  const dealsByStage = PIPELINE_STAGES.reduce<Record<string, KanbanDeal[]>>((acc, stage) => {
    acc[stage] = deals.filter((d) => d.stage === stage);
    return acc;
  }, {});

  const totalValue = deals.reduce((sum, d) => sum + (d.estimatedValue || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">Pipeline</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {loading ? "Chargement..." : `${deals.length} dossier${deals.length !== 1 ? "s" : ""} actifs — ${fmtPrice(totalValue)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/dossiers">
            <Button variant="outline" size="sm">
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              Vue liste
            </Button>
          </Link>
          <Link href="/dashboard/dossiers/nouveau">
            <Button size="sm">
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nouveau
            </Button>
          </Link>
        </div>
      </div>

      {/* Kanban Board — Desktop drag & drop */}
      <div className="hidden sm:block overflow-x-auto pb-4">
        <div className="flex gap-3" style={{ minWidth: `${PIPELINE_STAGES.length * 260}px` }}>
          {PIPELINE_STAGES.map((stage) => {
            const stageDeals = dealsByStage[stage] || [];
            const stageValue = stageDeals.reduce((s, d) => s + (d.estimatedValue || 0), 0);

            return (
              <div
                key={stage}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(stage)}
                className={`flex w-[250px] flex-shrink-0 flex-col rounded-xl border transition-colors ${
                  dragOverStage === stage
                    ? "border-brand-400 bg-brand-50/50 dark:border-brand-600 dark:bg-brand-900/20"
                    : "border-stone-200 bg-stone-50/50 dark:border-stone-700 dark:bg-anthracite-900/50"
                }`}
              >
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${STAGE_COLORS[stage] || "bg-stone-400"}`} />
                    <span className="text-xs font-semibold text-anthracite-700 dark:text-stone-300">
                      {DEAL_STAGE_LABELS[stage] || stage}
                    </span>
                    <span className="rounded-full bg-stone-200 px-1.5 py-0.5 text-[10px] font-bold text-stone-600 dark:bg-anthracite-700 dark:text-stone-400">
                      {stageDeals.length}
                    </span>
                  </div>
                  {stageValue > 0 && (
                    <span className="text-[10px] font-medium text-stone-400">{fmtPrice(stageValue)}</span>
                  )}
                </div>

                <div className="flex-1 space-y-2 px-2 pb-2" style={{ minHeight: "80px" }}>
                  {stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => handleDragStart(deal.id)}
                      className="cursor-grab rounded-lg border border-stone-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing dark:border-stone-700 dark:bg-anthracite-800"
                    >
                      <Link href={`/dashboard/dossiers/${deal.id}`} className="block">
                        <p className="text-xs font-mono text-stone-400 dark:text-stone-500">{deal.reference}</p>
                        <p className="mt-0.5 text-sm font-medium text-anthracite-800 dark:text-stone-200 line-clamp-2">{deal.title}</p>
                        {deal.property && (
                          <p className="mt-1 truncate text-xs text-stone-500 dark:text-stone-400">{deal.property.title}</p>
                        )}
                        {deal.contact && (
                          <p className="mt-0.5 truncate text-xs text-stone-400 dark:text-stone-500">{deal.contact.firstName} {deal.contact.lastName}</p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          {deal.estimatedValue ? (
                            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">{fmtPrice(deal.estimatedValue)}</span>
                          ) : <span />}
                          {deal.assignedTo && (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 text-[10px] font-semibold text-stone-600 dark:bg-anthracite-700 dark:text-stone-300" title={`${deal.assignedTo.firstName} ${deal.assignedTo.lastName}`}>
                              {deal.assignedTo.firstName[0]}{deal.assignedTo.lastName[0]}
                            </span>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile — Grouped card list with stage selectors */}
      <div className="sm:hidden space-y-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageDeals = dealsByStage[stage] || [];
          if (stageDeals.length === 0) return null;
          return (
            <div key={stage}>
              <div className="mb-2 flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${STAGE_COLORS[stage] || "bg-stone-400"}`} />
                <span className="text-xs font-semibold text-anthracite-700 dark:text-stone-300">
                  {DEAL_STAGE_LABELS[stage] || stage}
                </span>
                <span className="rounded-full bg-stone-200 px-1.5 py-0.5 text-[10px] font-bold text-stone-600 dark:bg-anthracite-700 dark:text-stone-400">
                  {stageDeals.length}
                </span>
              </div>
              <div className="space-y-2">
                {stageDeals.map((deal) => (
                  <div key={deal.id} className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-anthracite-800">
                    <Link href={`/dashboard/dossiers/${deal.id}`} className="block">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-[10px] text-stone-400 dark:text-stone-500">{deal.reference}</p>
                          <p className="mt-0.5 text-sm font-semibold text-anthracite-800 dark:text-stone-200">{deal.title}</p>
                        </div>
                        {deal.estimatedValue && (
                          <span className="text-xs font-bold text-brand-600 dark:text-brand-400 ml-2">{fmtPrice(deal.estimatedValue)}</span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                        {deal.property && <span>{deal.property.title}</span>}
                        {deal.contact && <span>{deal.contact.firstName} {deal.contact.lastName}</span>}
                      </div>
                    </Link>
                    {/* Quick stage move buttons */}
                    <div className="mt-3 flex gap-1.5 overflow-x-auto">
                      {PIPELINE_STAGES.filter((s) => s !== stage).slice(0, 4).map((s) => (
                        <button
                          key={s}
                          onClick={() => moveToStage(deal.id, s)}
                          className="flex-shrink-0 rounded-lg border border-stone-200 px-2 py-1 text-[10px] font-medium text-stone-500 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-stone-700 dark:text-stone-400 dark:hover:border-brand-700 dark:hover:text-brand-400"
                        >
                          <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${STAGE_COLORS[s] || "bg-stone-400"}`} />
                          {DEAL_STAGE_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {deals.length === 0 && !loading && (
          <p className="py-8 text-center text-sm text-stone-400 dark:text-stone-500">Aucun dossier actif</p>
        )}
      </div>
    </div>
  );
}
