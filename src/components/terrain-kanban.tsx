"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
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
  { key: "REPERE", label: "Repéré", dotColor: "bg-blue-400", bgActive: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800" },
  { key: "APPELE", label: "Appelé", dotColor: "bg-indigo-400", bgActive: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800" },
  { key: "EN_ATTENTE_RETOUR", label: "En attente", dotColor: "bg-amber-400", bgActive: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800" },
  { key: "A_QUALIFIER", label: "À qualifier", dotColor: "bg-orange-400", bgActive: "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800" },
  { key: "QUALIFIE", label: "Qualifié", dotColor: "bg-emerald-400", bgActive: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800" },
  { key: "CONVERTI", label: "Converti", dotColor: "bg-green-400", bgActive: "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800" },
  { key: "REJETE", label: "Rejeté", dotColor: "bg-red-400", bgActive: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800" },
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

    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const colEl = el?.closest("[data-kanban-column]");
    if (colEl) {
      setOverColumn(colEl.getAttribute("data-kanban-column"));
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

  // Count totals
  const totalActive = COLUMNS.slice(0, 5).reduce((sum, c) => sum + getColumnItems(c.key).length, 0);

  return (
    <div className="space-y-4">
      {/* Pipeline as a compact grid — all columns visible */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {COLUMNS.map((col) => {
          const colItems = getColumnItems(col.key);
          const isOver = overColumn === col.key;

          return (
            <div
              key={col.key}
              data-kanban-column={col.key}
              className={`
                rounded-xl border transition-all duration-200 overflow-hidden
                ${isOver
                  ? "ring-2 ring-brand-500 scale-[1.02] " + col.bgActive
                  : "border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1a1a1f]"
                }
              `}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              {/* Column header — compact */}
              <div className="flex items-center gap-1.5 px-2.5 py-2 border-b border-stone-100 dark:border-stone-800">
                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${col.dotColor}`} />
                <span className="text-[11px] font-semibold text-anthracite-800 dark:text-stone-200 truncate">
                  {col.label}
                </span>
                <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 px-1 text-[9px] font-bold text-stone-500 dark:text-stone-400">
                  {colItems.length}
                </span>
              </div>

              {/* Column body — scrollable */}
              <div className="p-1.5 space-y-1.5 min-h-[80px] max-h-[50vh] overflow-y-auto">
                {colItems.length === 0 && (
                  <div className="flex items-center justify-center h-16 text-[10px] text-stone-300 dark:text-stone-600 italic">
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
                      group rounded-lg border border-stone-200 dark:border-stone-700/60
                      bg-white dark:bg-[#1e1e24] p-2
                      cursor-grab active:cursor-grabbing touch-none select-none
                      transition-all duration-150 hover:shadow-md hover:-translate-y-0.5
                      ${dragging === item.id ? "opacity-30 scale-95" : "opacity-100"}
                    `}
                  >
                    {item.photoUrl && (
                      <div className="mb-1.5 h-14 w-full overflow-hidden rounded">
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
                      className="block text-xs font-medium text-anthracite-800 dark:text-stone-200 leading-tight hover:text-brand-600 dark:hover:text-brand-400 line-clamp-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.address}
                    </a>
                    <p className="mt-0.5 text-[10px] text-stone-400 dark:text-stone-500 truncate">
                      {item.city} {item.zipCode}
                    </p>
                    {item.assignedTo && (
                      <p className="mt-1 text-[10px] text-stone-400 dark:text-stone-500 truncate">
                        {item.assignedTo.firstName} {item.assignedTo.lastName}
                      </p>
                    )}
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
