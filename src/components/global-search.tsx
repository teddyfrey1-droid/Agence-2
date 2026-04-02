"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

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

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value.trim()), 300);
  };

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    router.push(result.href);
  };

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  const groupOrder: SearchResult["type"][] = ["property", "contact", "deal"];

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
                  placeholder="Rechercher..."
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
                      {items.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-stone-50 dark:hover:bg-anthracite-800"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500 dark:bg-anthracite-800 dark:text-stone-400">
                            <TypeIcon type={result.type} className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-anthracite-800 dark:text-stone-200">
                              {result.title}
                            </p>
                            {result.subtitle && (
                              <p className="truncate text-xs text-stone-400 dark:text-stone-500">
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                          {result.badge && (
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color}`}>
                              {result.badge}
                            </span>
                          )}
                        </button>
                      ))}
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
