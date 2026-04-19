"use client";

import { useRouter } from "next/navigation";
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

export function FilterBar({
  basePath,
  searchPlaceholder = "Rechercher...",
  filters,
  currentParams,
}: FilterBarProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(currentParams.search || "");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const buildUrl = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const qp = new URLSearchParams();
      const merged = { ...currentParams, ...overrides };
      delete merged.page;
      for (const [k, v] of Object.entries(merged)) {
        if (v) qp.set(k, v);
      }
      const qs = qp.toString();
      return qs ? `${basePath}?${qs}` : basePath;
    },
    [basePath, currentParams],
  );

  const handleFilterChange = useCallback(
    (name: string, value: string) => {
      router.push(buildUrl({ [name]: value || undefined }));
    },
    [router, buildUrl],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        router.push(buildUrl({ search: value || undefined }));
      }, 400);
    },
    [router, buildUrl],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const activeCount =
    filters.reduce((count, f) => count + (currentParams[f.name] ? 1 : 0), 0) +
    (currentParams.search ? 1 : 0);

  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-stone-200/70 bg-white p-2 shadow-card dark:border-anthracite-800 dark:bg-anthracite-900">
      {/* Search input */}
      <div className="relative min-w-[220px] flex-1 max-w-md">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-stone-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg border border-transparent bg-stone-50 py-2 pl-9 pr-8 text-sm text-anthracite-800 placeholder:text-stone-400 transition-colors focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 dark:bg-anthracite-800 dark:text-stone-200 dark:placeholder:text-stone-500 dark:focus:border-brand-500/50 dark:focus:bg-anthracite-800 dark:focus:ring-brand-900/30"
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => handleSearchChange("")}
            aria-label="Effacer la recherche"
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-anthracite-700 dark:hover:text-stone-300"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter dropdowns */}
      {filters.map((filter) => {
        const isActive = !!currentParams[filter.name];
        return (
          <div key={filter.name} className="relative">
            <select
              value={currentParams[filter.name] || ""}
              onChange={(e) => handleFilterChange(filter.name, e.target.value)}
              className={`appearance-none rounded-lg border bg-stone-50 py-2 pl-3 pr-8 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-100 dark:bg-anthracite-800 ${
                isActive
                  ? "border-brand-300 bg-brand-50 text-brand-800 dark:border-brand-500/50 dark:bg-brand-900/20 dark:text-brand-300"
                  : "border-transparent text-anthracite-700 dark:text-stone-300"
              } focus:border-brand-300 dark:focus:border-brand-500/50 dark:focus:ring-brand-900/30`}
            >
              <option value="">{filter.label}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400 dark:text-stone-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        );
      })}

      {/* Active filter count + clear */}
      {activeCount > 0 && (
        <button
          onClick={() => router.push(basePath)}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-500 transition-colors hover:border-red-300 hover:text-red-600 dark:border-stone-700 dark:bg-anthracite-800 dark:text-stone-400 dark:hover:border-red-800 dark:hover:text-red-400"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Réinitialiser ({activeCount})
        </button>
      )}
    </div>
  );
}
