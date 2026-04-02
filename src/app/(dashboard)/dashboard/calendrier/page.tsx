"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  color: string | null;
  contact: { firstName: string; lastName: string } | null;
  property: { title: string; reference: string } | null;
  deal: { title: string; reference: string } | null;
}

const EVENT_TYPES = [
  { value: "VISITE", label: "Visite", color: "#2563eb" },
  { value: "REUNION", label: "Réunion", color: "#7c3aed" },
  { value: "RELANCE", label: "Relance", color: "#d97706" },
  { value: "SIGNATURE", label: "Signature", color: "#059669" },
  { value: "AUTRE", label: "Autre", color: "#6b7280" },
];

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_SHORT = ["L", "M", "M", "J", "V", "S", "D"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, isCurrentMonth: false });
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }
  return days;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function CalendrierPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("VISITE");
  const [formDescription, setFormDescription] = useState("");
  const [formStartAt, setFormStartAt] = useState("");
  const [formEndAt, setFormEndAt] = useState("");
  const [formAllDay, setFormAllDay] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const start = new Date(year, month, 1).toISOString();
      const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const res = await fetch(`/api/events?start=${start}&end=${end}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch { /* */ }
    finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  }
  function goToday() { setYear(today.getFullYear()); setMonth(today.getMonth()); }

  function openNewEvent(date: Date) {
    setSelectedEvent(null);
    setSelectedDate(date);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    setFormTitle("");
    setFormType("VISITE");
    setFormDescription("");
    setFormStartAt(`${y}-${m}-${d}T09:00`);
    setFormEndAt(`${y}-${m}-${d}T10:00`);
    setFormAllDay(false);
    setShowModal(true);
  }

  function openEditEvent(ev: CalendarEvent) {
    setSelectedEvent(ev);
    setSelectedDate(null);
    setFormTitle(ev.title);
    setFormType(ev.type);
    setFormDescription(ev.description || "");
    setFormStartAt(ev.startAt.slice(0, 16));
    setFormEndAt(ev.endAt ? ev.endAt.slice(0, 16) : "");
    setFormAllDay(ev.allDay);
    setShowModal(true);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const payload = {
        title: formTitle,
        type: formType,
        description: formDescription || undefined,
        startAt: new Date(formStartAt).toISOString(),
        endAt: formEndAt ? new Date(formEndAt).toISOString() : undefined,
        allDay: formAllDay,
      };
      const url = selectedEvent ? `/api/events/${selectedEvent.id}` : "/api/events";
      const method = selectedEvent ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        setShowModal(false);
        fetchEvents();
      }
    } catch { /* */ }
    finally { setSubmitting(false); }
  }

  async function handleDelete() {
    if (!selectedEvent) return;
    try {
      await fetch(`/api/events/${selectedEvent.id}`, { method: "DELETE" });
      setShowModal(false);
      fetchEvents();
    } catch { /* */ }
  }

  const days = getMonthDays(year, month);
  const getColor = (type: string) => EVENT_TYPES.find((t) => t.value === type)?.color || "#6b7280";

  const inputClass = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-200";
  const selectClass = inputClass;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-anthracite-900 dark:text-stone-100">Calendrier</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {loading ? "Chargement..." : `${events.length} événement${events.length !== 1 ? "s" : ""} ce mois`}
          </p>
        </div>
        <Button size="sm" onClick={() => openNewEvent(today)}>
          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nouvel événement
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-stone-500 dark:text-stone-400">
        {EVENT_TYPES.map((t) => (
          <div key={t.value} className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full" style={{ background: t.color }} />
            {t.label}
          </div>
        ))}
      </div>

      {/* Calendar Header */}
      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-anthracite-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-lg font-semibold text-anthracite-900 dark:text-stone-100">
              {MONTHS[month]} {year}
            </h2>
            <button onClick={nextMonth} className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-anthracite-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <button onClick={goToday} className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-400 dark:hover:bg-anthracite-700">
            Aujourd&apos;hui
          </button>
        </div>

        {/* Days header — full labels on desktop, single letter on mobile */}
        <div className="grid grid-cols-7 border-b border-stone-200 dark:border-stone-700">
          {DAYS.map((d, i) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-stone-500 dark:text-stone-400">
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{DAYS_SHORT[i]}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayEvents = events.filter((ev) => isSameDay(new Date(ev.startAt), day.date));
            const isToday = isSameDay(day.date, today);

            return (
              <div
                key={i}
                onClick={() => openNewEvent(day.date)}
                className={`min-h-[44px] sm:min-h-[80px] cursor-pointer border-b border-r border-stone-100 p-0.5 sm:p-1 transition-colors hover:bg-stone-50 dark:border-stone-700/50 dark:hover:bg-anthracite-800 ${
                  !day.isCurrentMonth ? "bg-stone-50/50 dark:bg-anthracite-900/50" : ""
                }`}
              >
                <span className={`inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[10px] sm:text-xs ${
                  isToday
                    ? "bg-brand-600 font-bold text-white"
                    : day.isCurrentMonth
                      ? "text-anthracite-700 dark:text-stone-300"
                      : "text-stone-400 dark:text-stone-600"
                }`}>
                  {day.date.getDate()}
                </span>
                {/* Event dots on mobile, full labels on desktop */}
                <div className="mt-0.5">
                  {/* Mobile: just dots */}
                  <div className="flex gap-0.5 sm:hidden flex-wrap">
                    {dayEvents.slice(0, 4).map((ev) => (
                      <button
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); openEditEvent(ev); }}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: ev.color || getColor(ev.type) }}
                      />
                    ))}
                  </div>
                  {/* Desktop: full event labels */}
                  <div className="hidden sm:block space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <button
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); openEditEvent(ev); }}
                        className="block w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium text-white"
                        style={{ background: ev.color || getColor(ev.type) }}
                      >
                        {!ev.allDay && formatTime(ev.startAt) + " "}{ev.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="block px-1 text-[10px] text-stone-400">+{dayEvents.length - 3} de plus</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile: Event list for current month */}
        {events.length > 0 && (
          <div className="mt-4 sm:hidden">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Événements ce mois
            </p>
            <div className="space-y-2">
              {events
                .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
                .map((ev) => {
                  const d = new Date(ev.startAt);
                  return (
                    <button
                      key={ev.id}
                      onClick={() => openEditEvent(ev)}
                      className="flex w-full items-center gap-3 rounded-lg border border-stone-100 bg-white p-3 text-left transition-colors hover:bg-stone-50 dark:border-stone-700/50 dark:bg-anthracite-800 dark:hover:bg-anthracite-700"
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 flex-col items-center justify-center rounded-lg" style={{ background: `${ev.color || getColor(ev.type)}15` }}>
                        <span className="text-[10px] font-semibold" style={{ color: ev.color || getColor(ev.type) }}>
                          {d.getDate()}
                        </span>
                        <span className="text-[8px] uppercase" style={{ color: ev.color || getColor(ev.type) }}>
                          {d.toLocaleDateString("fr-FR", { month: "short" })}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-anthracite-800 dark:text-stone-200">{ev.title}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {ev.allDay ? "Journée entière" : formatTime(ev.startAt)}
                          {ev.endAt && !ev.allDay && ` — ${formatTime(ev.endAt)}`}
                        </p>
                      </div>
                      <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: ev.color || getColor(ev.type) }} />
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-anthracite-800 animate-scale-in">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-anthracite-900 dark:text-stone-100">
                {selectedEvent ? "Modifier l'événement" : "Nouvel événement"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">Titre *</label>
                <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className={inputClass} placeholder="Ex: Visite local rue de Rivoli" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">Type</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value)} className={selectClass}>
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="allDay" checked={formAllDay} onChange={(e) => setFormAllDay(e.target.checked)} className="h-4 w-4 rounded border-stone-300" />
                <label htmlFor="allDay" className="text-sm text-stone-600 dark:text-stone-400">Journée entière</label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">Début *</label>
                  <input type={formAllDay ? "date" : "datetime-local"} value={formAllDay ? formStartAt.slice(0, 10) : formStartAt} onChange={(e) => setFormStartAt(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">Fin</label>
                  <input type={formAllDay ? "date" : "datetime-local"} value={formAllDay ? formEndAt.slice(0, 10) : formEndAt} onChange={(e) => setFormEndAt(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">Description</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className={inputClass} rows={2} />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div>
                {selectedEvent && (
                  <button onClick={handleDelete} className="text-sm text-red-500 hover:text-red-700">Supprimer</button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Annuler</Button>
                <Button size="sm" onClick={handleSubmit} isLoading={submitting} disabled={!formTitle || !formStartAt}>
                  {selectedEvent ? "Modifier" : "Créer"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
