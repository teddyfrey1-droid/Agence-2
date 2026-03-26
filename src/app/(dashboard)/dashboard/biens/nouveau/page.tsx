"use client";

import { useState, useCallback, useRef, useEffect, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  PROPERTY_TYPE_LABELS,
  PARIS_DISTRICTS,
} from "@/lib/constants";

// ── Transaction types for pro commercial real estate ──
const TRANSACTION_TYPES = [
  { value: "VENTE", label: "Vente murs commerciaux" },
  { value: "LOCATION", label: "Location pure" },
  { value: "CESSION_BAIL", label: "Cession de bail" },
  { value: "FOND_DE_COMMERCE", label: "Fond de commerce" },
];

const confidentialityOptions = [
  { value: "PUBLIC", label: "Public" },
  { value: "RESTREINT", label: "Restreint" },
  { value: "CONFIDENTIEL", label: "Confidentiel" },
];

const districtOptions = PARIS_DISTRICTS.map((d) => ({ value: d, label: d }));

// ── SVG icons for property types ──
function PropertyIcon({ type, className = "h-8 w-8" }: { type: string; className?: string }) {
  const stroke = "currentColor";
  const sw = 1.5;
  switch (type) {
    case "BOUTIQUE":
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth={sw}>
          <rect x="6" y="18" width="28" height="16" rx="1.5" />
          <path d="M6 18L10 8h20l4 10" />
          <path d="M10 8v10M16 8v10M24 8v10M30 8v10" />
          <rect x="14" y="24" width="12" height="10" rx="1" />
          <line x1="20" y1="24" x2="20" y2="34" />
        </svg>
      );
    case "BUREAU":
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth={sw}>
          <rect x="8" y="6" width="24" height="28" rx="2" />
          <rect x="12" y="10" width="5" height="4" rx="0.5" />
          <rect x="23" y="10" width="5" height="4" rx="0.5" />
          <rect x="12" y="18" width="5" height="4" rx="0.5" />
          <rect x="23" y="18" width="5" height="4" rx="0.5" />
          <rect x="15" y="26" width="10" height="8" rx="1" />
        </svg>
      );
    case "LOCAL_COMMERCIAL":
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth={sw}>
          <rect x="5" y="14" width="30" height="20" rx="1.5" />
          <path d="M5 14L8 7h24l3 7" />
          <rect x="10" y="20" width="8" height="14" rx="1" />
          <rect x="22" y="20" width="8" height="6" rx="1" />
          <circle cx="16" cy="27" r="1" fill={stroke} />
        </svg>
      );
    case "LOCAL_ACTIVITE":
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth={sw}>
          <rect x="4" y="16" width="32" height="18" rx="1.5" />
          <path d="M4 16L8 10h24l4 6" />
          <rect x="14" y="22" width="12" height="12" rx="1" />
          <path d="M8 22h4M28 22h4" />
          <circle cx="20" cy="28" r="2" />
        </svg>
      );
    case "RESTAURANT":
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth={sw}>
          <rect x="6" y="14" width="28" height="20" rx="1.5" />
          <path d="M6 14c0-4 6-8 14-8s14 4 14 8" />
          <rect x="14" y="24" width="12" height="10" rx="1" />
          <circle cx="20" cy="18" r="2" />
          <path d="M10 20h4M26 20h4" />
        </svg>
      );
    case "HOTEL":
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth={sw}>
          <rect x="6" y="8" width="28" height="26" rx="2" />
          <rect x="10" y="12" width="4" height="4" rx="0.5" />
          <rect x="18" y="12" width="4" height="4" rx="0.5" />
          <rect x="26" y="12" width="4" height="4" rx="0.5" />
          <rect x="10" y="20" width="4" height="4" rx="0.5" />
          <rect x="18" y="20" width="4" height="4" rx="0.5" />
          <rect x="26" y="20" width="4" height="4" rx="0.5" />
          <rect x="15" y="28" width="10" height="6" rx="1" />
        </svg>
      );
    case "ENTREPOT":
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth={sw}>
          <path d="M4 18L20 8l16 10v18H4z" />
          <rect x="12" y="22" width="16" height="14" rx="1" />
          <line x1="20" y1="22" x2="20" y2="36" />
          <path d="M12 29h16" />
        </svg>
      );
    case "PARKING":
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth={sw}>
          <rect x="6" y="6" width="28" height="28" rx="4" />
          <text x="20" y="27" textAnchor="middle" fontSize="18" fontWeight="700" fill={stroke} stroke="none" fontFamily="serif">P</text>
        </svg>
      );
    case "TERRAIN":
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth={sw}>
          <path d="M4 32L12 20l8 6 8-12 8 18z" />
          <circle cx="30" cy="10" r="4" />
          <path d="M6 36h28" />
        </svg>
      );
    case "IMMEUBLE":
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth={sw}>
          <rect x="10" y="4" width="20" height="30" rx="1.5" />
          <rect x="14" y="8" width="4" height="3" rx="0.5" />
          <rect x="22" y="8" width="4" height="3" rx="0.5" />
          <rect x="14" y="14" width="4" height="3" rx="0.5" />
          <rect x="22" y="14" width="4" height="3" rx="0.5" />
          <rect x="14" y="20" width="4" height="3" rx="0.5" />
          <rect x="22" y="20" width="4" height="3" rx="0.5" />
          <rect x="16" y="27" width="8" height="7" rx="1" />
          <line x1="4" y1="34" x2="36" y2="34" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" stroke={stroke} strokeWidth={sw}>
          <rect x="8" y="8" width="24" height="24" rx="3" />
          <path d="M16 16h8M16 20h8M16 24h4" />
        </svg>
      );
  }
}

// ── Property types config ──
const PROPERTY_TYPES = Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

// ── Address autocomplete types ──
interface AddressSuggestion {
  label: string;
  housenumber?: string;
  street?: string;
  postcode?: string;
  city?: string;
  context?: string;
}

// ── Checkbox Toggle ──
function CheckboxToggle({
  id, label, sublabel, checked, onChange,
}: {
  id: string; label: string; sublabel?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center gap-3 rounded-premium border p-3.5 transition-all ${
        checked
          ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
          : "border-stone-200 bg-white hover:border-stone-300"
      }`}
    >
      <input type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
        checked ? "border-brand-500 bg-brand-500 text-white" : "border-stone-300 bg-white"
      }`}>
        {checked && (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div>
        <span className="text-sm font-medium text-anthracite-800">{label}</span>
        {sublabel && <span className="block text-xs text-stone-500">{sublabel}</span>}
      </div>
    </label>
  );
}

// ── Address Autocomplete Component ──
function AddressAutocomplete({
  onSelect,
}: {
  onSelect: (suggestion: AddressSuggestion) => void;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5&type=housenumber&autocomplete=1`
      );
      if (res.ok) {
        const data = await res.json();
        const results: AddressSuggestion[] = (data.features || []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (f: any) => ({
            label: f.properties.label,
            housenumber: f.properties.housenumber,
            street: f.properties.street,
            postcode: f.properties.postcode,
            city: f.properties.city,
            context: f.properties.context,
          })
        );
        setSuggestions(results);
        setIsOpen(results.length > 0);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const handleSelect = (suggestion: AddressSuggestion) => {
    setQuery(suggestion.label);
    setIsOpen(false);
    onSelect(suggestion);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="space-y-1.5">
        <label htmlFor="address" className="block text-sm font-medium text-anthracite-700">
          Adresse
        </label>
        <div className="relative">
          <input
            id="address"
            name="address"
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => suggestions.length > 0 && setIsOpen(true)}
            placeholder="Commencez à taper l'adresse..."
            autoComplete="off"
            className="block w-full rounded-premium border border-stone-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-anthracite-900 placeholder:text-stone-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-brand-500" />
            </div>
          )}
          {!isLoading && query.length >= 3 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          )}
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-premium border border-stone-200 bg-white shadow-lg">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(s)}
              className="flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left text-sm hover:bg-stone-50 transition-colors first:rounded-t-premium last:rounded-b-premium"
            >
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <div className="font-medium text-anthracite-800">{s.label}</div>
                {s.context && <div className="text-xs text-stone-500">{s.context}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Form ──
export default function NouveauBienPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [propertyType, setPropertyType] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("Paris");

  // Photos
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Feature toggles
  const [hasExtraction, setHasExtraction] = useState(false);
  const [hasTerrace, setHasTerrace] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [hasLoadingDock, setHasLoadingDock] = useState(false);

  // Handle address selection from autocomplete
  const handleAddressSelect = useCallback((suggestion: AddressSuggestion) => {
    setAddress(suggestion.label);
    if (suggestion.postcode) {
      setZipCode(suggestion.postcode);
      // Auto-detect Paris district
      if (suggestion.postcode.startsWith("75")) {
        const arr = parseInt(suggestion.postcode.slice(2), 10);
        if (arr >= 1 && arr <= 20) {
          setDistrict(PARIS_DISTRICTS[arr - 1]);
          setCity("Paris");
        }
      }
    }
    if (suggestion.city) {
      setCity(suggestion.city);
    }
  }, []);

  // Manual zip code change
  const handleZipCodeChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setZipCode(value);
    if (value.length === 5 && value.startsWith("75")) {
      const arr = parseInt(value.slice(2), 10);
      if (arr >= 1 && arr <= 20) {
        setDistrict(PARIS_DISTRICTS[arr - 1]);
        setCity("Paris");
      }
    }
  }, []);

  // Photo handlers
  const handlePhotoAdd = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhotos = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }, []);

  const handlePhotoRemove = useCallback((index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handlePhotoDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handlePhotoDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (!files) return;
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const newPhotos = imageFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  }, []);

  const isLocation = transactionType === "LOCATION" || transactionType === "FOND_DE_COMMERCE";
  const isVente = transactionType === "VENTE" || transactionType === "CESSION_BAIL";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const body: Record<string, unknown> = {
        title: formData.get("title"),
        type: propertyType,
        transactionType,
        description: formData.get("description") || undefined,
        confidentiality: formData.get("confidentiality") || undefined,
        address: address || undefined,
        city,
        zipCode: zipCode || undefined,
        district: district || undefined,
        quarter: formData.get("quarter") || undefined,
        surfaceTotal: formData.get("surfaceTotal") ? Number(formData.get("surfaceTotal")) : undefined,
        floor: formData.get("floor") ? Number(formData.get("floor")) : undefined,
        totalFloors: formData.get("totalFloors") ? Number(formData.get("totalFloors")) : undefined,
        facadeLength: formData.get("facadeLength") ? Number(formData.get("facadeLength")) : undefined,
        ceilingHeight: formData.get("ceilingHeight") ? Number(formData.get("ceilingHeight")) : undefined,
        hasExtraction,
        hasTerrace,
        hasParking,
        hasLoadingDock,
        price: formData.get("price") ? Number(formData.get("price")) : undefined,
        rentMonthly: formData.get("rentMonthly") ? Number(formData.get("rentMonthly")) : undefined,
        rentYearly: formData.get("rentYearly") ? Number(formData.get("rentYearly")) : undefined,
        charges: formData.get("charges") ? Number(formData.get("charges")) : undefined,
        deposit: formData.get("deposit") ? Number(formData.get("deposit")) : undefined,
        fees: formData.get("fees") ? Number(formData.get("fees")) : undefined,
      };

      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la création");
      }

      const property = await res.json();
      router.push(`/dashboard/biens/${property.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-anthracite-900">Nouveau bien</h1>
        <p className="text-sm text-stone-500">
          Remplissez les informations ci-dessous. Les cases cochables vous font gagner du temps.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-premium border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── TYPE DE BIEN ── */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">Type de bien</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
              {PROPERTY_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setPropertyType(pt.value)}
                  className={`group flex flex-col items-center gap-2 rounded-xl border-2 p-3.5 text-center transition-all ${
                    propertyType === pt.value
                      ? "border-brand-500 bg-brand-50 shadow-sm"
                      : "border-stone-100 bg-white hover:border-stone-200 hover:shadow-sm"
                  }`}
                >
                  <div className={`transition-colors ${
                    propertyType === pt.value ? "text-brand-600" : "text-stone-400 group-hover:text-stone-600"
                  }`}>
                    <PropertyIcon type={pt.value} />
                  </div>
                  <span className={`text-xs font-medium leading-tight ${
                    propertyType === pt.value ? "text-brand-700" : "text-anthracite-600"
                  }`}>
                    {pt.label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── TRANSACTION & TITRE ── */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">Informations générales</h2>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="mb-2.5 block text-sm font-medium text-anthracite-700">
                Type de transaction
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TRANSACTION_TYPES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTransactionType(opt.value)}
                    className={`rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all ${
                      transactionType === opt.value
                        ? "border-brand-500 bg-brand-500 text-white shadow-sm"
                        : "border-stone-100 bg-white text-anthracite-700 hover:border-stone-200 hover:shadow-sm"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              id="title"
              name="title"
              label="Titre de l'annonce"
              required
              placeholder={
                propertyType
                  ? `Ex: ${PROPERTY_TYPE_LABELS[propertyType]} 45m² - Marais`
                  : "Ex: Boutique 45m² - Marais"
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                id="confidentiality"
                name="confidentiality"
                label="Confidentialité"
                options={confidentialityOptions}
                placeholder="Public"
              />
              <div />
            </div>

            <Textarea
              id="description"
              name="description"
              label="Description"
              rows={3}
              placeholder="Décrivez le bien en quelques lignes (emplacement, état, atouts...)"
            />
          </CardContent>
        </Card>

        {/* ── PHOTOS ── */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">Photos du bien</h2>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={handlePhotoDragOver}
              onDrop={handlePhotoDrop}
              className="space-y-4"
            >
              {/* Upload zone */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50/50 px-6 py-8 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21zM8.25 8.625a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25z" />
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-medium text-anthracite-700">
                    Cliquez ou glissez-déposez vos photos
                  </span>
                  <span className="block text-xs text-stone-500 mt-1">
                    JPG, PNG, WebP — Plusieurs fichiers acceptés
                  </span>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoAdd}
                className="hidden"
              />

              {/* Photo previews */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {photos.map((photo, index) => (
                    <div key={index} className="group relative aspect-square overflow-hidden rounded-xl border border-stone-200">
                      <img
                        src={photo.preview}
                        alt={`Photo ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {index === 0 && (
                        <span className="absolute left-1.5 top-1.5 rounded bg-brand-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          Principale
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handlePhotoRemove(index)}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length > 0 && (
                <p className="text-xs text-stone-500">
                  {photos.length} photo{photos.length > 1 ? "s" : ""} — La première sera la photo principale de l&apos;annonce.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── LOCALISATION ── */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">Localisation</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddressAutocomplete onSelect={handleAddressSelect} />

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                id="zipCode"
                label="Code postal"
                value={zipCode}
                onChange={handleZipCodeChange}
                placeholder="75001"
                maxLength={5}
              />
              <Input
                id="city"
                label="Ville"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <Select
                id="district"
                name="district"
                label="Arrondissement"
                options={districtOptions}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Auto-détecté..."
              />
            </div>
            <Input
              id="quarter"
              name="quarter"
              label="Quartier"
              placeholder="Ex: Le Marais, Saint-Germain, Opéra..."
            />
          </CardContent>
        </Card>

        {/* ── SURFACES & CARACTÉRISTIQUES ── */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">Surfaces & caractéristiques</h2>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-4">
              <Input id="surfaceTotal" name="surfaceTotal" type="number" label="Surface (m²)" min={0} placeholder="45" />
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <Input id="floor" name="floor" type="number" label="Étage" placeholder="0 = RDC" />
              <Input id="totalFloors" name="totalFloors" type="number" label="Nb d'étages" min={1} placeholder="5" />
              <Input id="facadeLength" name="facadeLength" type="number" label="Linéaire façade (m)" min={0} step="0.1" placeholder="6.5" />
              <Input id="ceilingHeight" name="ceilingHeight" type="number" label="Hauteur plafond (m)" min={0} step="0.1" placeholder="3.2" />
            </div>
          </CardContent>
        </Card>

        {/* ── ÉQUIPEMENTS ── */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">Équipements & spécificités</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <CheckboxToggle
                  id="hasExtraction"
                  label="Extraction"
                  sublabel="Gaine d'extraction existante"
                  checked={hasExtraction}
                  onChange={setHasExtraction}
                />
                {hasExtraction && (
                  <div className="ml-8">
                    <Input id="extractionSize" type="text" label="Diamètre / taille" placeholder="Ex: Ø 400mm, double flux..." />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <CheckboxToggle
                  id="hasTerrace"
                  label="Droit de terrasse"
                  sublabel="Terrasse ou droit existant"
                  checked={hasTerrace}
                  onChange={setHasTerrace}
                />
                {hasTerrace && (
                  <div className="ml-8">
                    <Input id="terraceSize" type="text" label="Taille terrasse" placeholder="Ex: 15m², 6 tables..." />
                  </div>
                )}
              </div>

              <CheckboxToggle
                id="hasParking"
                label="Parking / stationnement"
                sublabel="Place(s) de parking ou accès"
                checked={hasParking}
                onChange={setHasParking}
              />

              <CheckboxToggle
                id="hasLoadingDock"
                label="Quai de déchargement"
                sublabel="Accès livraison poids lourds"
                checked={hasLoadingDock}
                onChange={setHasLoadingDock}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── FINANCIER ── */}
        <Card>
          <CardHeader>
            <h2 className="heading-card">
              {isLocation ? "Loyer & charges" : isVente ? "Prix & frais" : "Financier"}
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {(isVente || !transactionType) && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input id="price" name="price" type="number" label="Prix de vente (€)" min={0} placeholder="350 000" />
                <Input id="fees" name="fees" type="number" label="Honoraires (€)" min={0} placeholder="Optionnel" />
              </div>
            )}

            {(isLocation || !transactionType) && (
              <div className="grid gap-4 sm:grid-cols-3">
                <Input id="rentMonthly" name="rentMonthly" type="number" label="Loyer mensuel HT (€)" min={0} placeholder="2 500" />
                <Input id="rentYearly" name="rentYearly" type="number" label="Loyer annuel HT (€)" min={0} placeholder="30 000" />
                <Input id="deposit" name="deposit" type="number" label="Dépôt de garantie (€)" min={0} placeholder="Optionnel" />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="charges" name="charges" type="number" label="Charges (€/mois)" min={0} placeholder="Optionnel" />
              {!isVente && !isLocation && (
                <Input id="feesAlt" name="fees" type="number" label="Honoraires (€)" min={0} placeholder="Optionnel" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── ACTIONS ── */}
        <div className="flex items-center gap-3 pb-8">
          <Button type="submit" isLoading={isSubmitting}>
            Créer le bien
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
