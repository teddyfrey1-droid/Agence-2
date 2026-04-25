"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export interface BusinessCardResult {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  position?: string;
  address?: string;
  website?: string;
}

interface Props {
  onExtracted: (data: BusinessCardResult) => void;
}

async function compressForOCR(file: File): Promise<File> {
  if (file.type === "image/heic" || file.type === "image/heif") return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const MAX = 1600;
      if (width > MAX) {
        height = Math.round((height * MAX) / width);
        width = MAX;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          resolve(new File([blob], "card.jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

export function BusinessCardScanner({ onExtracted }: Props) {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setAiAvailable(Boolean(d?.enabled));
      })
      .catch(() => !cancelled && setAiAvailable(false));
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleFile(file: File) {
    setScanning(true);
    setPreview(URL.createObjectURL(file));
    try {
      const compressed = await compressForOCR(file);
      const fd = new FormData();
      fd.append("file", compressed);
      const res = await fetch("/api/ai/business-card", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur IA");
      }
      const data = (await res.json()) as { contact: BusinessCardResult };
      onExtracted(data.contact || {});
      addToast("Carte de visite importée", "success");
      setOpen(false);
      setPreview(null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Erreur OCR", "error");
    } finally {
      setScanning(false);
    }
  }

  if (aiAvailable === false) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-brand-300 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-100 dark:border-brand-600 dark:bg-brand-900/30 dark:text-brand-200"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
        </svg>
        Scanner une carte de visite
      </button>

      <Modal
        open={open}
        onClose={() => {
          if (!scanning) {
            setOpen(false);
            setPreview(null);
          }
        }}
        title="Scanner une carte de visite"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Prenez la carte en photo, l&apos;IA remplira les champs du contact.
          </p>

          {preview && (
            <div className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700">
              <img src={preview} alt="Carte" className="max-h-56 w-full object-contain bg-stone-100 dark:bg-anthracite-800" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={() => fileRef.current?.click()}
              disabled={scanning}
              className="w-full"
            >
              {scanning ? "Analyse…" : "Prendre en photo"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const alt = document.getElementById("card-gallery-input") as HTMLInputElement | null;
                alt?.click();
              }}
              disabled={scanning}
              className="w-full"
            >
              Depuis la galerie
            </Button>
          </div>

          {scanning && (
            <div className="flex items-center gap-2 rounded-lg bg-brand-50 p-3 text-sm text-brand-800 dark:bg-brand-900/30 dark:text-brand-200">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              L&apos;IA lit la carte…
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <input
          id="card-gallery-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </Modal>
    </>
  );
}
