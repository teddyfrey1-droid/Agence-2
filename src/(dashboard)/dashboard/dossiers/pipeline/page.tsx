"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
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

const STAGE_COLORS: Record<string, { dot: string; hex: string }> = {
  PROSPECT:    { dot: "bg-slate-400",   hex: "#94a3b8" },
  DECOUVERTE:  { dot: "bg-blue-400",    hex: "#3b82f6" },
  VISITE:      { dot: "bg-indigo-400",  hex: "#6366f1" },
  NEGOCIATION: { dot: "bg-amber-500",   hex: "#f59e0b" },
  OFFRE:       { dot: "bg-orange-500",  hex: "#f97316" },
  COMPROMIS:   { dot: "bg-purple-500",  hex: "#8b5cf6" },
  ACTE:        { dot: "bg-emerald-500", hex: "#10b981" },
  CLOTURE:     { dot: "bg-green-600",   hex: "#16a34a" },
};

function fmtPrice(val: number | null) {
  if (!val) return "";
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1).replace(".0", "")}M €`;
  if (val >= 1_000)     return `${(val / 1_000).toFixed(0)} k€`;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val);
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<KanbanDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
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
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)));
    try {
      await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
    } catch {
      const res = await fetch("/api/deals/kanban");
      if (res.ok) {
        const data = await res.json();
        setDeals(Array.isArray(data) ? data : data.deals ?? []);
      }
    }
  }

  function handleDragStart(e: React.DragEvent, dealId: string) {
    setDraggingId(dealId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverStage(null);
  }

  function handleDragOver(e: React.DragEvent, stage: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverStage(null);
    }
  }

  function handleDrop(stage: string) {
    setDragOverStage(null);
    if (draggingId) {
      moveToStage(draggingId, stage);
      setDraggingId(null);
    }
  }

  const dealsByStage = PIPELINE_STAGES.reduce<Record<string, KanbanDeal[]>>((acc, stage) => {
    acc[stage] = deals.filter((d) => d.stage === stage);
    return acc;
  }, {});

  const totalValue = deals.reduce((sum, d) => sum + (d.estimatedValue || 0), 0);

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Pipeline"
        title="Kanban"
        description={loading ? "Chargement…" : `${deals.length} dossier${deals.length !== 1 ? "s" : ""} actifs — ${fmtPrice(totalValue)}`}
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        }
        actions={
          <>
            <Link href="/dashboard/dossiers">
              <Button variant="outline" size="sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                Vue liste
              </Button>
            </Link>
            <Link href="/dashboard/dossiers/nouveau">
              <Button size="sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nouveau
              </Button>
            </Link>
          </>
        }
      />

      {/* ── Desktop Kanban ── */}
      <div className="hidden sm:block overflow-x-auto pb-4">
        <div className="flex gap-3" style={{ minWidth: `${PIPELINE_STAGES.length * 256}px` }}>
          {PIPELINE_STAGES.map((stage) => {
            const stageDeals = dealsByStage[stage] || [];
            const stageValue = stageDeals.reduce((s, d) => s + (d.estimatedValue || 0), 0);
            const isOver = dragOverStage === stage;
            const colors = STAGE_COLORS[stage] || { dot: "bg-stone-400", hex: "#94a3b8" };

            return (
              <div
                key={stage}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(stage)}
                className={`
                  flex w-[244px] flex-shrink-0 flex-col rounded-2xl border-[1.5px] transition-all duration-200
                  ${isOver
                    ? "kanban-col-drag-over"
                    : "border-stone-200/80 bg-stone-50/60 dark:border-anthracite-800 dark:bg-anthracite-900/50"
                  }
                `}
                style={isOver ? {
                  boxShadow: `0 0 0 3px ${colors.hex}33, 0 8px 30px ${colors.hex}14`,
                  borderColor: colors.hex,
                } : undefined}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-3.5 py-3 border-b border-stone-200/60 dark:border-anthracite-800">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ background: colors.hex }}
                    />
                    <span className="text-[12px] font-bold text-anthracite-700 dark:text-stone-300 leading-none">
                      {DEAL_STAGE_LABELS[stage] || stage}
                    </span>
                    <span className="rounded-full bg-stone-200/80 px-1.5 py-0.5 text-[10px] font-bold text-stone-600 dark:bg-anthracite-700 dark:text-stone-400 leading-none">
                      {stageDeals.length}
                    </span>
                  </div>
                  {stageValue > 0 && (
                    <span
                      className="text-[10.5px] font-semibold text-stone-400 dark:text-stone-500 tabular-nums"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {fmtPrice(stageValue)}
                    </span>
                  )}
                </div>

                {/* Cards */}
                <div className="flex flex-1 flex-col gap-2 p-2" style={{ minHeight: 80 }}>
                  {stageDeals.map((deal) => {
                    const isDragging = draggingId === deal.id;
                    return (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        onDragEnd={handleDragEnd}
                        className={`
                          group/card relative cursor-grab rounded-xl border bg-white p-3
                          transition-all duration-200 select-none
                          dark:bg-anthracite-800
                          ${isDragging
                            ? "kcard-dragging border-brand-300 dark:border-brand-600"
                            : "border-stone-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.1)] hover:border-stone-300 dark:border-anthracite-700 dark:hover:border-anthracite-600"
                          }
                        `}
                      >
                        {/* Subtle colored top line on hover */}
                        <div
                          className="absolute inset-x-0 top-0 h-px rounded-t-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-200"
                          style={{ background: colors.hex }}
                        />

                        <Link href={`/dashboard/dossiers/${deal.id}`} className="block">
                          <p
                            className="text-[10px] font-medium text-stone-400 dark:text-stone-500 mb-1"
                            style={{ fontFamily: "'DM Mono', monospace" }}
                          >
                            {deal.reference}
                          </p>
                          <p className="text-[13px] font-bold text-anthracite-800 dark:text-stone-200 leading-snug line-clamp-2 mb-1">
                            {deal.title}
                          </p>
                          {deal.property && (
                            <p className="truncate text-[11.5px] text-stone-500 dark:text-stone-400 mb-1">
                              {deal.property.title}
                            </p>
                          )}
                          {deal.contact && (
                            <p className="truncate text-[11px] text-stone-400 dark:text-stone-500">
                              {deal.contact.firstName} {deal.contact.lastName}
                            </p>
                          )}
                          <div className="mt-2.5 flex items-center justify-between">
                            {deal.estimatedValue ? (
                              <span
                                className="text-[12px] font-bold text-brand-600 dark:text-brand-400 tabular-nums"
                                style={{ fontFamily: "'DM Mono', monospace" }}
                              >
                                {fmtPrice(deal.estimatedValue)}
                              </span>
                            ) : <span />}
                            {deal.assignedTo && (
                              <span
                                className="flex h-6 w-6 items-center justify-center rounded-full text-[9.5px] font-bold text-white flex-shrink-0"
                                style={{ background: `linear-gradient(135deg, ${colors.hex}cc, ${colors.hex})` }}
                                title={`${deal.assignedTo.firstName} ${deal.assignedTo.lastName}`}
                              >
                                {deal.assignedTo.firstName[0]}{deal.assignedTo.lastName[0]}
                              </span>
                            )}
                          </div>
                        </Link>
                      </div>
                    );
                  })}

                  {/* Drop ghost — shown when dragging over empty/any column */}
                  {isOver && draggingId && (
                    <div className="kanban-drop-ghost">
                      <svg className="h-4 w-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Mobile grouped list ── */}
      <div className="sm:hidden space-y-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageDeals = dealsByStage[stage] || [];
          if (stageDeals.length === 0) return null;
          const colors = STAGE_COLORS[stage] || { dot: "bg-stone-400", hex: "#94a3b8" };
          return (
            <div key={stage}>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: colors.hex }} />
                <span className="text-xs font-bold text-anthracite-700 dark:text-stone-300">
                  {DEAL_STAGE_LABELS[stage] || stage}
                </span>
                <span className="rounded-full bg-stone-200 px-1.5 py-0.5 text-[10px] font-bold text-stone-600 dark:bg-anthracite-700 dark:text-stone-400">
                  {stageDeals.length}
                </span>
              </div>
              <div className="space-y-2">
                {stageDeals.map((deal) => (
                  <div key={deal.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-card dark:border-anthracite-700 dark:bg-anthracite-800">
                    <Link href={`/dashboard/dossiers/${deal.id}`} className="block">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-medium text-stone-400 dark:text-stone-500" style={{ fontFamily: "'DM Mono', monospace" }}>
                            {deal.reference}
                          </p>
                          <p className="mt-0.5 text-sm font-bold text-anthracite-800 dark:text-stone-200">{deal.title}</p>
                        </div>
                        {deal.estimatedValue && (
                          <span className="ml-2 text-[12px] font-bold text-brand-600 dark:text-brand-400 tabular-nums" style={{ fontFamily: "'DM Mono', monospace" }}>
                            {fmtPrice(deal.estimatedValue)}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-stone-500 dark:text-stone-400">
                        {deal.property && <span>{deal.property.title}</span>}
                        {deal.contact && <span>{deal.contact.firstName} {deal.contact.lastName}</span>}
                      </div>
                    </Link>
                    {/* Quick stage buttons */}
                    <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
                      {PIPELINE_STAGES.filter((s) => s !== stage).slice(0, 4).map((s) => {
                        const sc = STAGE_COLORS[s] || { dot: "bg-stone-400", hex: "#94a3b8" };
                        return (
                          <button
                            key={s}
                            onClick={() => moveToStage(deal.id, s)}
                            className="flex-shrink-0 rounded-lg border border-stone-200 px-2.5 py-1 text-[10.5px] font-semibold text-stone-500 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-stone-700 dark:text-stone-400 dark:hover:border-brand-700 dark:hover:text-brand-400"
                          >
                            <span
                              className="mr-1 inline-block h-1.5 w-1.5 rounded-full"
                              style={{ background: sc.hex }}
                            />
                            {DEAL_STAGE_LABELS[s]}
                          </button>
                        );
                      })}
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
