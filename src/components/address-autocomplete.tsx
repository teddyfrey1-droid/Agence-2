"use client";

import { useState, useRef, useEffect } from "react";

export interface AddressResult {
  label: string;
  name: string;
  city: string;
  postcode: string;
  context: string;
  x?: number;
  y?: number;
}

interface AddressAutocompleteProps {
  id: string;
  name: string;
  label?: string;
  value?: string;
  required?: boolean;
  placeholder?: string;
  onSelect?: (result: AddressResult) => void;
}

export function AddressAutocomplete({
  id,
  name,
  label,
  value: initialValue = "",
  required,
  placeholder = "Commencez à taper une adresse...",
  onSelect,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<AddressResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Sync with external value changes (e.g. from geolocation)
  useEffect(() => {
    if (initialValue && initialValue !== query) {
      setQuery(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(val: string) {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(val)}&limit=6&autocomplete=1`
        );
        if (res.ok) {
          const data = await res.json();
          const items: AddressResult[] = (data.features || []).map(
            (f: { properties: { label: string; name: string; city: string; postcode: string; context: string }; geometry?: { coordinates?: number[] } }) => ({
              label: f.properties.label,
              name: f.properties.name,
              city: f.properties.city,
              postcode: f.properties.postcode,
              context: f.properties.context,
              x: f.geometry?.coordinates?.[0],
              y: f.geometry?.coordinates?.[1],
            })
          );
          setResults(items);
          setIsOpen(items.length > 0);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function selectResult(result: AddressResult) {
    setQuery(result.label);
    setIsOpen(false);
    onSelect?.(result);
  }

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-anthracite-700 dark:text-stone-300">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type="text"
          value={query}
          required={required}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          autoComplete="off"
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-anthracite-800 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-stone-600 dark:bg-anthracite-800 dark:text-stone-200 dark:placeholder:text-stone-500"
        />
        {loading && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="h-4 w-4 animate-spin text-stone-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
      </div>
      {isOpen && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-anthracite-800">
          {results.map((result, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => selectResult(result)}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-stone-50 dark:hover:bg-anthracite-700"
              >
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <div>
                  <p className="font-medium text-anthracite-800 dark:text-stone-200">{result.name}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{result.city} {result.postcode}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
