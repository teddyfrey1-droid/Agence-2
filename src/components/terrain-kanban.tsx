"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { Badge, getStatusBadgeVariant } from "@/components/ui/badge";
import { FIELD_SPOTTING_STATUS_LABELS } from "@/lib/constants";

interface SpotItem {
  id: string;
  address: string;
  city: string;
  zipCode: string | null;
  district: string | null;
  propertyType: string | null;
  surface: number | null;
  photoUrl: string | null;
  notes: string | null;
  status: string;
  assignedTo: { firstName: string; lastName: string } | null;
}

const COLUMNS = [
  { key: "REPERE", label: "Repéré", color: "border-blue-400 bg-blue-50 dark:bg-blue-950/30", dotColor: "bg-blue-400" },
  { key: "APPELE", label: "Appelé", color: "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30", dotColor: "bg-indigo-400" },
  { key: "EN_ATTENTE_RETOUR", label: "En attente", color: "border-amber-400 bg-amber-50 dark:bg-amber-950/30", dotColor: "bg-amber-400" },
  { key: "A_QUALIFIER", label: "À qualifier", color: "border-orange-400 bg-orange-50 dark:bg-orange-950/30", dotColor: "bg-orange-400" },
  { key: "QUALIFIE", label: "Qualifié", color: "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30", dotColor: "bg-emerald-400" },
  { key: "CONVERTI", label: "Converti", color: "border-green-400 bg-green-50 dark:bg-green-950/30", dotColor: "bg-green-400" },
  { key: "REJETE", label: "Rejeté", color: "border-red-400 bg-red-50 dark:bg-red-950/30", dotColor: "bg-red-400" },
];

interface TerrainKanbanProps {
  items: SpotItem[];
}

export function TerrainKanban({ items: initialItems }: TerrainKanbanProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [dragging, setDragging] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const dragItemRef = useRef<string | null>(null);

  const getColumnItems = useCallback(
    (status: string) => items.filter((item) => item.status === status),
    [items]
  );

  async function moveItem(itemId: string, newStatus: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item || item.status === newStatus) return;

    const oldStatus = item.status;
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, status: newStatus } : i))
    );

    try {
      const res = await fetch(`/api/field-spotting/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      addToast(
        `${item.address} → ${FIELD_SPOTTING_STATUS_LABELS[newStatus]}`,
        "success"
      );
      router.refresh();
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, status: oldStatus } : i))
      );
      addToast("Erreur lors du déplacement", "error");
    }
  }

  // HTML5 Drag and Drop handlers
  function handleDragStart(e: React.DragEvent, itemId: string) {
    dragItemRef.current = itemId;
    setDragging(itemId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
    // For a nicer ghost image
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 50, 20);
    }
  }

  function handleDragEnd() {
    setDragging(null);
    setOverColumn(null);
    dragItemRef.current = null;
  }

  function handleDragOver(e: React.DragEvent, columnKey: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverColumn(columnKey);
  }

  function handleDragLeave() {
    setOverColumn(null);
  }

  function handleDrop(e: React.DragEvent, columnKey: string) {
    e.preventDefault();
    setOverColumn(null);
    const itemId = e.dataTransfer.getData("text/plain") || dragItemRef.current;
    if (itemId) {
      moveItem(itemId, columnKey);
    }
    setDragging(null);
    dragItemRef.current = null;
  }

  // Touch drag support
  const touchItemRef = useRef<string | null>(null);
  const touchGhostRef = useRef<HTMLDivElement | null>(null);

  function handleTouchStart(itemId: string) {
    touchItemRef.current = itemId;
    setDragging(itemId);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!touchItemRef.current) return;
    const touch = e.touches[0];

    // Create/move ghost element
    if (!touchGhostRef.current) {
      const ghost = document.createElement("div");
      ghost.className =
        "fixed z-[9999] pointer-events-none rounded-lg bg-white dark:bg-anthracite-800 shadow-xl border-2 border-brand-500 px-3 py-2 text-xs font-medium text-anthracite-800 dark:text-stone-200 opacity-90";
      const item = items.find((i) => i.id === touchItemRef.current);
      ghost.textContent = item?.address || "";
      document.body.appendChild(ghost);
      touchGhostRef.current = ghost;
    }
    touchGhostRef.current.style.left = `${touch.clientX - 40}px`;
    touchGhostRef.current.style.top = `${touch.clientY - 20}px`;

    // Detect which column we're over
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const colEl = el?.closest("[data-kanban-column]");
    if (colEl) {
      const colKey = colEl.getAttribute("data-kanban-column");
      setOverColumn(colKey);
    } else {
      setOverColumn(null);
    }
  }

  function handleTouchEnd() {
    if (touchGhostRef.current) {
      touchGhostRef.current.remove();
      touchGhostRef.current = null;
    }
    if (touchItemRef.current && overColumn) {
      moveItem(touchItemRef.current, overColumn);
    }
    touchItemRef.current = null;
    setDragging(null);
    setOverColumn(null);
  }

  return (
    <div className="space-y-4">
      {/* Horizontal scroll kanban */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 snap-x snap-mandatory">
        {COLUMNS.map((col) => {
          const colItems = getColumnItems(col.key);
          const isOver = overColumn === col.key;

          return (
            <div
              key={col.key}
              data-kanban-column={col.key}
              className={`
                flex-shrink-0 w-[260px] sm:w-[280px] snap-start rounded-xl border-t-4 ${col.color}
                bg-white dark:bg-anthracite-900 border border-stone-200/80 dark:border-stone-700/50
                transition-all duration-200
                ${isOver ? "ring-2 ring-brand-500 scale-[1.02]" : ""}
              `}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-stone-100 dark:border-stone-800">
                <div className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
                <span className="text-xs font-semibold text-anthracite-800 dark:text-stone-200">
                  {col.label}
                </span>
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-stone-100 dark:bg-anthracite-800 px-1.5 text-[10px] font-bold text-stone-500 dark:text-stone-400">
                  {colItems.length}
                </span>
              </div>

              {/* Column body */}
              <div className="p-2 space-y-2 min-h-[120px] max-h-[60vh] overflow-y-auto">
                {colItems.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-xs text-stone-300 dark:text-stone-600 italic">
                    Glisser ici
                  </div>
                )}
                {colItems.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={() => handleTouchStart(item.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className={`
                      group rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-anthracite-800
                      p-2.5 cursor-grab active:cursor-grabbing touch-none select-none
                      transition-all duration-150 hover:shadow-md hover:-translate-y-0.5
                      ${dragging === item.id ? "opacity-40 scale-95" : "opacity-100"}
                    `}
                  >
                    {item.photoUrl && (
                      <div className="mb-2 h-20 w-full overflow-hidden rounded-md">
                        <img
                          src={item.photoUrl}
                          alt={item.address}
                          className="h-full w-full object-cover"
                          draggable={false}
                        />
                      </div>
                    )}
                    <a
                      href={`/dashboard/terrain/${item.id}`}
                      className="block text-sm font-medium text-anthracite-800 dark:text-stone-200 leading-tight hover:text-brand-600 dark:hover:text-brand-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.address}
                    </a>
                    <p className="mt-0.5 text-[11px] text-stone-400 dark:text-stone-500">
                      {item.city} {item.zipCode}
                    </p>
                    {item.notes && (
                      <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2">
                        {item.notes}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      {item.assignedTo ? (
                        <span className="text-[10px] text-stone-400 dark:text-stone-500">
                          {item.assignedTo.firstName} {item.assignedTo.lastName}
                        </span>
                      ) : (
                        <span />
                      )}
                      {/* Drag handle icon */}
                      <svg className="h-4 w-4 text-stone-300 dark:text-stone-600 group-hover:text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9h.01M8 12h.01M8 15h.01M12 9h.01M12 12h.01M12 15h.01M16 9h.01M16 12h.01M16 15h.01" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
