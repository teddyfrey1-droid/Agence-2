"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useEffect, useRef } from "react";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterDef {
  name: string;
  label: string;
  options: FilterOption[];
}

interface FilterBarProps {
  basePath: string;
  searchPlaceholder?: string;
  filters: FilterDef[];
  currentParams: Record<string, string | undefined>;
}

export function FilterBar({ basePath, searchPlaceholder = "Rechercher...", filters, currentParams }: FilterBarProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(currentParams.search || "");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const buildUrl = useCallback((overrides: Record<string, string | undefined>) => {
    const qp = new URLSearchParams();
    // Merge current params with overrides, dropping empty values
    const merged = { ...currentParams, ...overrides };
    delete merged.page; // Reset page on filter change
    for (const [k, v] of Object.entries(merged)) {
      if (v) qp.set(k, v);
    }
    const qs = qp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }, [basePath, currentParams]);

  const handleFilterChange = useCallback((name: string, value: string) => {
    router.push(buildUrl({ [name]: value || undefined }));
  }, [router, buildUrl]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ search: value || undefined }));
    }, 400);
  }, [router, buildUrl]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const activeCount = filters.reduce((count, f) => count + (currentParams[f.name] ? 1 : 0), 0) + (currentParams.search ? 1 : 0);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search input */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm text-anthracite-800 placeholder:text-stone-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-stone-700 dark:bg-anthracite-800 dark:text-stone-200 dark:placeholder:text-stone-500 dark:focus:border-brand-500 dark:focus:ring-brand-900/30"
        />
      </div>

      {/* Filter dropdowns */}
      {filters.map((filter) => (
        <select
          key={filter.name}
          value={currentParams[filter.name] || ""}
          onChange={(e) => handleFilterChange(filter.name, e.target.value)}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-anthracite-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-stone-700 dark:bg-anthracite-800 dark:text-stone-200 dark:focus:border-brand-500 dark:focus:ring-brand-900/30"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}

      {/* Active filter count + clear */}
      {activeCount > 0 && (
        <button
          onClick={() => router.push(basePath)}
          className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-500 hover:border-red-300 hover:text-red-600 transition-colors dark:border-stone-700 dark:bg-anthracite-800 dark:text-stone-400 dark:hover:border-red-800 dark:hover:text-red-400"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          {activeCount} filtre{activeCount > 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}
