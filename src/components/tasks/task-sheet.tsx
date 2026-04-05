'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/lib/constants';
import { formatDateShort } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// ── Types ──────────────────────────────────────────────────────────────────────

interface TaskUser {
  id: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface SheetTask {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  dueDate?: Date | string | null;
  assignedToId?: string | null;
  assignedTo?: { firstName: string; lastName: string } | null;
  contactId?: string | null;
  contact?: { firstName: string; lastName: string } | null;
  propertyId?: string | null;
  property?: { title: string } | null;
  dealId?: string | null;
  deal?: { title: string } | null;
}

interface TaskSheetProps {
  task: SheetTask | null;
  onClose: () => void;
  onUpdated: (id: string, patch: Partial<SheetTask>) => void;
}

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; ring: string }> = {
  A_FAIRE:  { label: 'À faire',   color: 'text-stone-700 dark:text-stone-300',   bg: 'bg-stone-100 dark:bg-stone-800',      ring: 'ring-stone-300 dark:ring-stone-600' },
  EN_COURS: { label: 'En cours',  color: 'text-blue-700 dark:text-blue-300',     bg: 'bg-blue-50 dark:bg-blue-900/30',      ring: 'ring-blue-400 dark:ring-blue-600' },
  TERMINEE: { label: 'Terminée',  color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-900/30', ring: 'ring-emerald-400 dark:ring-emerald-600' },
  ANNULEE:  { label: 'Annulée',   color: 'text-red-700 dark:text-red-300',       bg: 'bg-red-50 dark:bg-red-900/30',        ring: 'ring-red-400 dark:ring-red-600' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  BASSE:   { label: 'Basse',   color: 'text-stone-500' },
  NORMALE: { label: 'Normale', color: 'text-blue-600 dark:text-blue-400' },
  HAUTE:   { label: 'Haute',   color: 'text-amber-600 dark:text-amber-400' },
  URGENTE: { label: 'Urgente', color: 'text-red-600 dark:text-red-400' },
};

// ── Component ──────────────────────────────────────────────────────────────────

export function TaskSheet({ task, onClose, onUpdated }: TaskSheetProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [users, setUsers] = useState<TaskUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const isOpen = !!task;

  // Load users when reassign section opens
  useEffect(() => {
    if (reassigning && users.length === 0) {
      setLoadingUsers(true);
      fetch('/api/users')
        .then((r) => r.json())
        .then((data) => setUsers(Array.isArray(data) ? data : []))
        .finally(() => setLoadingUsers(false));
    }
  }, [reassigning, users.length]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setReassigning(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  async function patch(data: Record<string, unknown>) {
    if (!task) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        onUpdated(task.id, data as Partial<SheetTask>);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(status: string) {
    await patch({ status });
    if (status === 'TERMINEE' || status === 'ANNULEE') onClose();
  }

  async function reassignTo(userId: string | null) {
    await patch({ assignedToId: userId });
    setReassigning(false);
  }

  if (!task) return null;

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    ['A_FAIRE', 'EN_COURS'].includes(task.status);

  const currentStatus = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.A_FAIRE;
  const currentPriority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.NORMALE;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Panel — bottom sheet on mobile, right side-panel on md+ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={task.title}
        className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl bg-white shadow-2xl dark:bg-anthracite-900 md:inset-y-0 md:left-auto md:max-h-none md:w-[420px] md:rounded-none md:rounded-l-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 md:hidden">
          <div className="h-1 w-10 rounded-full bg-stone-300 dark:bg-stone-600" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
          <div className="min-w-0 flex-1">
            <p className={`mb-1 text-xs font-semibold uppercase tracking-wider ${currentPriority.color}`}>
              {currentPriority.label}
            </p>
            <h2 className="text-lg font-semibold leading-snug text-anthracite-900 dark:text-stone-100">
              {task.title}
            </h2>
            {task.description && (
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{task.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-anthracite-800"
            aria-label="Fermer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">

          {/* ── Status buttons ── */}
          <div className="mb-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-400">Statut</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => changeStatus(key)}
                  disabled={saving || task.status === key}
                  className={[
                    'flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                    task.status === key
                      ? `${cfg.bg} ${cfg.color} ring-2 ${cfg.ring}`
                      : 'bg-stone-50 text-stone-500 hover:bg-stone-100 dark:bg-anthracite-800 dark:text-stone-400 dark:hover:bg-anthracite-700',
                  ].join(' ')}
                >
                  {/* Status icon */}
                  {key === 'A_FAIRE'  && <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="9" /></svg>}
                  {key === 'EN_COURS' && <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /><circle cx="12" cy="12" r="9" /></svg>}
                  {key === 'TERMINEE' && <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  {key === 'ANNULEE'  && <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Assignation ── */}
          <div className="mb-5 rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-anthracite-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-stone-400">Assigné à</p>
                <p className="mt-0.5 text-sm font-medium text-anthracite-800 dark:text-stone-200">
                  {task.assignedTo
                    ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                    : <span className="text-stone-400">Non assigné</span>}
                </p>
              </div>
              <button
                onClick={() => setReassigning((v) => !v)}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-stone-600 shadow-sm hover:bg-stone-100 dark:bg-anthracite-700 dark:text-stone-300 dark:hover:bg-anthracite-600"
              >
                {reassigning ? 'Annuler' : 'Réassigner'}
              </button>
            </div>

            {/* Reassign dropdown */}
            {reassigning && (
              <div className="mt-3 border-t border-stone-200 pt-3 dark:border-stone-700">
                {loadingUsers ? (
                  <p className="text-xs text-stone-400">Chargement…</p>
                ) : (
                  <ul className="max-h-48 space-y-1 overflow-y-auto">
                    <li>
                      <button
                        onClick={() => reassignTo(null)}
                        disabled={saving}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-stone-500 hover:bg-stone-100 dark:hover:bg-anthracite-700"
                      >
                        — Retirer l'assignation
                      </button>
                    </li>
                    {users.map((u) => (
                      <li key={u.id}>
                        <button
                          onClick={() => reassignTo(u.id)}
                          disabled={saving || task.assignedToId === u.id}
                          className={[
                            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors',
                            task.assignedToId === u.id
                              ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                              : 'hover:bg-stone-100 dark:hover:bg-anthracite-700',
                          ].join(' ')}
                        >
                          <span>{u.firstName} {u.lastName}</span>
                          {task.assignedToId === u.id && (
                            <svg className="h-4 w-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* ── Échéance ── */}
          {task.dueDate && (
            <div className="mb-5 flex items-center gap-2">
              <svg className={`h-4 w-4 flex-shrink-0 ${isOverdue ? 'text-red-500' : 'text-stone-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span className={`text-sm ${isOverdue ? 'font-semibold text-red-600 dark:text-red-400' : 'text-stone-600 dark:text-stone-300'}`}>
                {isOverdue ? 'En retard — ' : ''}{formatDateShort(task.dueDate as Date)}
              </span>
            </div>
          )}

          {/* ── Lié à ── */}
          {(task.contact || task.property || task.deal) && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-stone-400">Lié à</p>
              <div className="space-y-1.5">
                {task.contact && task.contactId && (
                  <Link
                    href={`/dashboard/contacts/${task.contactId}`}
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2 text-sm text-brand-600 hover:bg-stone-100 dark:bg-anthracite-800 dark:text-brand-400 dark:hover:bg-anthracite-700"
                  >
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                    {task.contact.firstName} {task.contact.lastName}
                  </Link>
                )}
                {task.property && task.propertyId && (
                  <Link
                    href={`/dashboard/biens/${task.propertyId}`}
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2 text-sm text-brand-600 hover:bg-stone-100 dark:bg-anthracite-800 dark:text-brand-400 dark:hover:bg-anthracite-700"
                  >
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>
                    {task.property.title}
                  </Link>
                )}
                {task.deal && task.dealId && (
                  <Link
                    href={`/dashboard/dossiers/${task.dealId}`}
                    onClick={onClose}
                    className="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2 text-sm text-brand-600 hover:bg-stone-100 dark:bg-anthracite-800 dark:text-brand-400 dark:hover:bg-anthracite-700"
                  >
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
                    {task.deal.title}
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer — saving indicator */}
        {saving && (
          <div className="border-t border-stone-100 px-5 py-3 dark:border-stone-800">
            <p className="text-center text-xs text-stone-400">Enregistrement…</p>
          </div>
        )}
      </div>
    </>
  );
}
