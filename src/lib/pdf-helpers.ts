/**
 * PDF helpers — shared utilities for client-side jsPDF document generation
 * (property fiches, engagement contracts, etc.).
 *
 * Must only be imported from client components ("use client").
 */

// ─── Brand palette ──────────────────────────────────────────────────
export const BRAND = {
  dark: [32, 31, 29] as [number, number, number],        // #201f1d — logo dark
  gold: [166, 138, 78] as [number, number, number],      // #a68a4e — logo gold
  text: [35, 33, 30] as [number, number, number],
  muted: [110, 105, 95] as [number, number, number],
  rule: [220, 215, 205] as [number, number, number],
  softBg: [249, 246, 240] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

/**
 * Load the Retail Avenue SVG logo as a PNG data URL so it can be embedded
 * with jsPDF's addImage(). Cached per-session.
 */
let logoCache: string | null = null;
export async function loadLogoDataUrl(targetWidth = 720): Promise<string | null> {
  if (logoCache) return logoCache;
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/logo-mark.svg");
    if (!res.ok) return null;
    const svgText = await res.text();
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = url;
      });
      const aspect = img.width && img.height ? img.height / img.width : 296 / 1708;
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = Math.round(targetWidth * aspect);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      logoCache = canvas.toDataURL("image/png");
      return logoCache;
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return null;
  }
}

export function fmtEUR(val: number | null | undefined): string {
  if (val == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(val);
}

export function fmtDateFR(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function todayFR(): string {
  return fmtDateFR(new Date());
}
