"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface UploadedMedia {
  id: string;
  url: string;
  title: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

interface PhotoUploaderProps {
  entityType: "property" | "fieldSpotting";
  entityId: string;
  existingPhotos?: UploadedMedia[];
  maxPhotos?: number;
  onUploadComplete?: () => void;
}

export function PhotoUploader({
  entityType,
  entityId,
  existingPhotos = [],
  maxPhotos = 20,
  onUploadComplete,
}: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<UploadedMedia[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("entityType", entityType);
    formData.append("entityId", entityId);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Erreur upload");
    }
    return res.json();
  }

  async function handleFiles(files: FileList | File[]) {
    const fileArray = Array.from(files);
    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) {
      addToast(`Maximum ${maxPhotos} photos atteint`, "error");
      return;
    }
    const toUpload = fileArray.slice(0, remaining);

    setUploading(true);
    let successCount = 0;

    for (const file of toUpload) {
      try {
        const media = await uploadFile(file);
        if (entityType === "property") {
          setPhotos((prev) => [...prev, media]);
        }
        successCount++;
      } catch (err) {
        addToast(err instanceof Error ? err.message : "Erreur upload", "error");
      }
    }

    setUploading(false);
    if (successCount > 0) {
      addToast(`${successCount} photo${successCount > 1 ? "s" : ""} ajoutée${successCount > 1 ? "s" : ""}`, "success");
      onUploadComplete?.();
    }
  }

  async function handleDelete(mediaId: string) {
    try {
      const res = await fetch(`/api/upload/${mediaId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur suppression");
      setPhotos((prev) => prev.filter((p) => p.id !== mediaId));
      addToast("Photo supprimée", "info");
      onUploadComplete?.();
    } catch {
      addToast("Erreur lors de la suppression", "error");
    }
  }

  async function handleSetPrimary(mediaId: string) {
    try {
      // Update via the upload endpoint or a simple PATCH
      setPhotos((prev) =>
        prev.map((p) => ({ ...p, isPrimary: p.id === mediaId }))
      );
      await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setPrimary", mediaId }),
      });
    } catch {
      // Revert on error
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
          dragOver
            ? "border-brand-400 bg-brand-50/50 dark:border-brand-600 dark:bg-brand-900/20"
            : "border-stone-300 bg-stone-50/50 hover:border-stone-400 hover:bg-stone-100/50 dark:border-stone-600 dark:bg-anthracite-800/50 dark:hover:border-stone-500"
        }`}
      >
        {uploading ? (
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 animate-spin text-brand-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-medium text-stone-600 dark:text-stone-400">Upload en cours...</span>
          </div>
        ) : (
          <>
            <svg className="mb-2 h-8 w-8 text-stone-400 dark:text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
              Glisser-déposer ou cliquer pour ajouter
            </p>
            <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
              JPG, PNG, WebP — max 10 Mo par photo
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700">
              <img
                src={photo.url}
                alt={photo.title || "Photo"}
                className="h-full w-full object-cover"
              />
              {/* Primary badge */}
              {photo.isPrimary && (
                <span className="absolute top-2 left-2 rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                  Principale
                </span>
              )}
              {/* Hover overlay with actions */}
              <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100 p-2">
                <div className="flex gap-1.5">
                  {!photo.isPrimary && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSetPrimary(photo.id); }}
                      className="rounded-md bg-white/90 px-2 py-1 text-[10px] font-medium text-anthracite-800 backdrop-blur-sm transition-colors hover:bg-white"
                      title="Définir comme photo principale"
                    >
                      Principale
                    </button>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                  className="rounded-md bg-red-500/90 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-red-600"
                  title="Supprimer"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Simpler single-photo uploader for terrain spots
 */
export function SinglePhotoUploader({
  entityId,
  currentPhotoUrl,
  onUploadComplete,
}: {
  entityId: string;
  currentPhotoUrl?: string | null;
  onUploadComplete?: () => void;
}) {
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  async function handleFile(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("entityType", "fieldSpotting");
    formData.append("entityId", entityId);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur upload");
      }
      const data = await res.json();
      setPhotoUrl(data.url);
      addToast("Photo ajoutée", "success");
      onUploadComplete?.();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Erreur upload", "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {photoUrl ? (
        <div className="relative overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700">
          <img src={photoUrl} alt="Photo terrain" className="h-48 w-full object-cover" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-2 right-2 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-anthracite-800 shadow backdrop-blur-sm hover:bg-white dark:bg-anthracite-800/90 dark:text-stone-200 dark:hover:bg-anthracite-800"
          >
            Changer
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50/50 px-4 py-8 text-sm text-stone-500 transition-colors hover:border-stone-400 hover:bg-stone-100/50 dark:border-stone-600 dark:bg-anthracite-800/50 dark:hover:border-stone-500"
        >
          {uploading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Upload en cours...
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              Ajouter une photo
            </>
          )}
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}
