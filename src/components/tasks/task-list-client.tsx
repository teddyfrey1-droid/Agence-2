'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { TaskSheet, type SheetTask } from './task-sheet';
import { Badge, getStatusBadgeVariant } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/lib/constants';
import { formatDateShort } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface TaskListClientProps {
  items: SheetTask[];
}

export function TaskListClient({ items: initialItems }: TaskListClientProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<SheetTask[]>(initialItems);
  const [selected, setSelected] = useState<SheetTask | null>(null);

  const handleUpdated = useCallback((id: string, patch: Partial<SheetTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
    // Also update selected if it's the same task
    setSelected((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
  }, []);

  // Quick complete without opening the sheet
  async function quickComplete(e: React.MouseEvent, task: SheetTask) {
    e.stopPropagation();
    const newStatus = task.status === 'TERMINEE' ? 'A_FAIRE' : 'TERMINEE';
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      handleUpdated(task.id, { status: newStatus });
      router.refresh();
    }
  }

  if (tasks.length === 0) return null;

  return (
    <>
      {/* ── Mobile: card list ── */}
      <div className="space-y-3 lg:hidden">
        {tasks.map((task) => {
          const isOverdue =
            task.dueDate &&
            new Date(task.dueDate) < new Date() &&
            ['A_FAIRE', 'EN_COURS'].includes(task.status);
          const isDone = task.status === 'TERMINEE';
          const isCancelled = task.status === 'ANNULEE';

          return (
            <Card
              key={task.id}
              className={[
                'cursor-pointer p-4 transition-all active:scale-[0.99] hover:shadow-md',
                isCancelled ? 'opacity-60' : '',
              ].join(' ')}
              onClick={() => setSelected(task)}
            >
              <div className="flex items-start gap-3">
                {/* Quick-complete toggle */}
                <button
                  onClick={(e) => quickComplete(e, task)}
                  aria-label={isDone ? 'Rouvrir la tâche' : 'Marquer comme terminée'}
                  className={[
                    'mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    isDone
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-stone-300 text-transparent hover:border-emerald-400 dark:border-stone-600',
                  ].join(' ')}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-medium ${isDone || isCancelled ? 'text-stone-400 line-through dark:text-stone-600' : 'text-anthracite-800 dark:text-stone-200'}`}>
                      {task.title}
                    </p>
                    <Badge variant={getStatusBadgeVariant(task.priority)} className="flex-shrink-0">
                      {TASK_PRIORITY_LABELS[task.priority]}
                    </Badge>
                  </div>

                  {task.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-stone-400 dark:text-stone-500">
                      {task.description}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(task.status)}>
                      {TASK_STATUS_LABELS[task.status]}
                    </Badge>
                    {task.assignedTo && (
                      <span className="text-xs text-stone-500 dark:text-stone-400">
                        {task.assignedTo.firstName} {task.assignedTo.lastName}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className={`ml-auto text-xs ${isOverdue ? 'font-semibold text-red-600 dark:text-red-400' : 'text-stone-400 dark:text-stone-500'}`}>
                        {isOverdue && '⚠ '}{formatDateShort(task.dueDate as Date)}
                      </span>
                    )}
                  </div>

                  {(task.contact || task.property || task.deal) && (
                    <p className="mt-1.5 text-xs text-brand-600 dark:text-brand-400">
                      {task.contact && `${task.contact.firstName} ${task.contact.lastName}`}
                      {task.property && task.property.title}
                      {task.deal && task.deal.title}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Desktop: table ── */}
      <Card className="hidden overflow-hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50 dark:border-stone-700/50 dark:bg-anthracite-800/50">
                <th className="w-8 px-4 py-3" />
                <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Tâche</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Priorité</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Statut</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Assigné</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Lié à</th>
                <th className="px-4 py-3 text-left font-medium text-stone-500 dark:text-stone-400">Échéance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-700/50">
              {tasks.map((task) => {
                const isOverdue =
                  task.dueDate &&
                  new Date(task.dueDate) < new Date() &&
                  ['A_FAIRE', 'EN_COURS'].includes(task.status);
                const isDone = task.status === 'TERMINEE';
                const isCancelled = task.status === 'ANNULEE';

                return (
                  <tr
                    key={task.id}
                    className={[
                      'cursor-pointer transition-colors hover:bg-stone-50 dark:hover:bg-anthracite-800/50',
                      isCancelled ? 'opacity-60' : '',
                    ].join(' ')}
                    onClick={() => setSelected(task)}
                  >
                    {/* Quick complete */}
                    <td className="pl-4 pr-2 py-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => quickComplete(e, task)}
                        aria-label={isDone ? 'Rouvrir' : 'Terminer'}
                        className={[
                          'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
                          isDone
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-stone-300 text-transparent hover:border-emerald-400 dark:border-stone-600',
                        ].join(' ')}
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className={`font-medium ${isDone || isCancelled ? 'text-stone-400 line-through' : 'text-anthracite-800 dark:text-stone-200'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="line-clamp-1 text-xs text-stone-400 dark:text-stone-500">{task.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(task.priority)}>{TASK_PRIORITY_LABELS[task.priority]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(task.status)}>{TASK_STATUS_LABELS[task.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-stone-600 dark:text-stone-400">
                      {task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">
                      {task.contact && task.contactId && (
                        <Link
                          href={`/dashboard/contacts/${task.contactId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-brand-600 hover:underline dark:text-brand-400"
                        >
                          {task.contact.firstName} {task.contact.lastName}
                        </Link>
                      )}
                      {task.property && task.propertyId && (
                        <Link
                          href={`/dashboard/biens/${task.propertyId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-brand-600 hover:underline dark:text-brand-400"
                        >
                          {task.property.title}
                        </Link>
                      )}
                      {task.deal && task.dealId && (
                        <Link
                          href={`/dashboard/dossiers/${task.dealId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-brand-600 hover:underline dark:text-brand-400"
                        >
                          {task.deal.title}
                        </Link>
                      )}
                    </td>
                    <td className={`px-4 py-3 ${isOverdue ? 'font-medium text-red-600 dark:text-red-400' : 'text-stone-400 dark:text-stone-500'}`}>
                      {task.dueDate ? formatDateShort(task.dueDate as Date) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Task sheet */}
      <TaskSheet
        task={selected}
        onClose={() => setSelected(null)}
        onUpdated={handleUpdated}
      />
    </>
  );
}
