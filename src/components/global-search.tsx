"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { haptic } from "@/lib/haptics";

interface SearchResult {
  type: "property" | "contact" | "deal";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  badge: string;
}

const TYPE_CONFIG = {
  property: { label: "Biens", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  contact: { label: "Contacts", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  deal: { label: "Dossiers", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
} as const;

function PropertyIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22V12h6v10" />
      <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01" />
    </svg>
  );
}

function ContactIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function DealIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  );
}

function TypeIcon({ type, className }: { type: SearchResult["type"]; className: string }) {
  switch (type) {
    case "property":
      return <PropertyIcon className={className} />;
    case "contact":
      return <ContactIcon className={className} />;
    case "deal":
      return <DealIcon className={className} />;
  }
}

function highlight(text: string, query: string) {
  if (!query) return text;
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-brand-100 px-0.5 text-brand-900 dark:bg-brand-900/40 dark:text-brand-100">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

const RECENT_KEY = "retail-search-recent";
const QUICK_ACTIONS: { label: string; href: string; hint: string; icon: string }[] = [
  { label: "Nouveau bien", href: "/dashboard/biens/nouveau", hint: "Créer une fiche", icon: "M12 4.5v15m7.5-7.5h-15" },
  { label: "Repérage rapide", href: "/dashboard/terrain/capture", hint: "Photo géolocalisée", icon: "M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" },
  { label: "Nouveau contact", href: "/dashboard/contacts/nouveau", hint: "Scanner une carte", icon: "M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" },
  { label: "Pipeline", href: "/dashboard/dossiers/pipeline", hint: "Kanban des dossiers", icon: "M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" },
];

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [recent, setRecent] = useState<SearchResult[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Load recent searches once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw).slice(0, 5));
    } catch {
      /* ignore */
    }
  }, []);

  function pushRecent(r: SearchResult) {
    try {
      const next = [r, ...recent.filter((x) => x.id !== r.id)].slice(0, 5);
      setRecent(next);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  // Keyboard shortcut: Cmd+K / Ctrl+K — also "/" when not typing in a field
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (isCmdK) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (!typing && e.key === "/" && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery("");
      setResults([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Debounced search
  const search = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      if (!res.ok) return;
      const data = await res.json();
      setResults(data.results || []);
      setHasSearched(true);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setCursor(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value.trim()), 300);
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    pushRecent(result);
    haptic("tap");
    router.push(result.href);
  };

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  const groupOrder: SearchResult["type"][] = ["property", "contact", "deal"];

  // Flat ordered list for keyboard navigation
  const flat: SearchResult[] = groupOrder.flatMap((t) => grouped[t] || []);

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (flat.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (c + 1) % flat.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (c - 1 + flat.length) % flat.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = flat[cursor];
      if (r) handleResultClick(r);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-9 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-400 transition-colors hover:border-stone-300 hover:text-stone-500 dark:border-stone-700/50 dark:bg-anthracite-900 dark:text-stone-500 dark:hover:border-stone-600 dark:hover:text-stone-400"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <span className="hidden sm:inline">Rechercher...</span>
        <kbd className="ml-2 hidden rounded border border-stone-200 bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-400 sm:inline-block dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-500">
          ⌘K
        </kbd>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40" />

          <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[15vh] sm:pt-[20vh]">
            <div className="w-full max-w-lg overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xl dark:border-stone-700/50 dark:bg-anthracite-900">
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-stone-100 px-4 dark:border-stone-700/50">
                <svg className="h-5 w-5 shrink-0 text-stone-400 dark:text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={onInputKeyDown}
                  placeholder="Rechercher un bien, un contact, un dossier…"
                  className="h-12 flex-1 bg-transparent text-sm text-anthracite-800 outline-none placeholder:text-stone-400 dark:text-stone-200 dark:placeholder:text-stone-500"
                />
                {isLoading && (
                  <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-stone-300 border-t-brand-500 dark:border-stone-600 dark:border-t-brand-400" />
                )}
                <kbd
                  onClick={() => setIsOpen(false)}
                  className="cursor-pointer rounded border border-stone-200 bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-400 transition-colors hover:bg-stone-200 dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-500 dark:hover:bg-anthracite-700"
                >
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto">
                {/* Empty state: show quick actions and recent items */}
                {!hasSearched && query.length < 2 && (
                  <>
                    {recent.length > 0 && (
                      <div>
                        <div className="px-4 pb-1 pt-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                            Récents
                          </p>
                        </div>
                        {recent.map((r) => (
                          <button
                            key={`r-${r.id}`}
                            onClick={() => handleResultClick(r)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-stone-50 dark:hover:bg-anthracite-800"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500 dark:bg-anthracite-800 dark:text-stone-400">
                              <TypeIcon type={r.type} className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm text-anthracite-800 dark:text-stone-200">{r.title}</p>
                              {r.subtitle && <p className="truncate text-xs text-stone-400">{r.subtitle}</p>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    <div>
                      <div className="px-4 pb-1 pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                          Actions rapides
                        </p>
                      </div>
                      {QUICK_ACTIONS.map((a) => (
                        <button
                          key={a.href}
                          onClick={() => { setIsOpen(false); haptic("tap"); router.push(a.href); }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-stone-50 dark:hover:bg-anthracite-800"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d={a.icon} />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-anthracite-800 dark:text-stone-200">{a.label}</p>
                            <p className="truncate text-xs text-stone-400">{a.hint}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-stone-100 px-4 py-2 text-[10.5px] text-stone-400 dark:border-stone-700/50 dark:text-stone-500">
                      <span className="flex items-center gap-1"><kbd className="rounded bg-stone-100 px-1 py-0.5 dark:bg-anthracite-800">↑</kbd><kbd className="rounded bg-stone-100 px-1 py-0.5 dark:bg-anthracite-800">↓</kbd> naviguer</span>
                      <span className="flex items-center gap-1"><kbd className="rounded bg-stone-100 px-1 py-0.5 dark:bg-anthracite-800">↵</kbd> ouvrir</span>
                      <span className="flex items-center gap-1"><kbd className="rounded bg-stone-100 px-1 py-0.5 dark:bg-anthracite-800">esc</kbd> fermer</span>
                    </div>
                  </>
                )}

                {hasSearched && results.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <svg className="mx-auto h-8 w-8 text-stone-300 dark:text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <p className="mt-2 text-sm text-stone-400 dark:text-stone-500">
                      Aucun résultat
                    </p>
                  </div>
                )}

                {groupOrder.map((type) => {
                  const items = grouped[type];
                  if (!items || items.length === 0) return null;
                  const config = TYPE_CONFIG[type];

                  return (
                    <div key={type}>
                      <div className="px-4 pb-1 pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                          {config.label}
                        </p>
                      </div>
                      {items.map((result) => {
                        const flatIdx = flat.findIndex((r) => r.id === result.id && r.type === result.type);
                        const isActive = flatIdx === cursor;
                        return (
                          <button
                            key={result.id}
                            onMouseEnter={() => setCursor(flatIdx)}
                            onClick={() => handleResultClick(result)}
                            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                              isActive ? "bg-brand-50 dark:bg-brand-900/30" : "hover:bg-stone-50 dark:hover:bg-anthracite-800"
                            }`}
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500 dark:bg-anthracite-800 dark:text-stone-400">
                              <TypeIcon type={result.type} className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-anthracite-800 dark:text-stone-200">
                                {highlight(result.title, query)}
                              </p>
                              {result.subtitle && (
                                <p className="truncate text-xs text-stone-400 dark:text-stone-500">
                                  {highlight(result.subtitle, query)}
                                </p>
                              )}
                            </div>
                            {result.badge && (
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color}`}>
                                {result.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
