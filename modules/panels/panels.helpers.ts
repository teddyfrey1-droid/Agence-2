import { prisma } from "@/lib/prisma";

/**
 * Build the public URL embedded in a panel's QR code.
 * Resolved at scan time → can be remapped to a different property without
 * reprinting the panel.
 */
export function panelScanUrl(code: string): string {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/panneau/${encodeURIComponent(code)}`;
}

/**
 * Sanitize a phone number for use in a wa.me link. Strips non-digits and
 * the leading '+' (wa.me wants raw digits with country code).
 */
export function toWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  // French numbers entered as 06xx... → assume +33 and drop the leading 0.
  if (digits.length === 10 && digits.startsWith("0")) {
    digits = `33${digits.slice(1)}`;
  }
  return digits;
}

/**
 * Build a deep-link URL that opens WhatsApp with a prefilled message.
 * Returns null if the agent has no usable phone number.
 */
export function buildWhatsAppLink(params: {
  phone: string | null | undefined;
  message: string;
}): string | null {
  const phone = toWhatsAppNumber(params.phone);
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(params.message)}`;
}

const TX_LABEL: Record<string, string> = {
  VENTE: "à la vente",
  LOCATION: "à la location",
  CESSION_BAIL: "en cession de bail",
  FOND_DE_COMMERCE: "fonds de commerce",
};

const TYPE_LABEL: Record<string, string> = {
  BOUTIQUE: "Boutique",
  BUREAU: "Bureau",
  LOCAL_COMMERCIAL: "Local commercial",
  LOCAL_ACTIVITE: "Local d'activité",
  RESTAURANT: "Restaurant",
  HOTEL: "Hôtel",
  ENTREPOT: "Entrepôt",
  PARKING: "Parking",
  TERRAIN: "Terrain",
  IMMEUBLE: "Immeuble",
  AUTRE: "Bien",
};

/** Build the WhatsApp message body shown to the prospect. */
export function buildPanelWaMessage(p: {
  reference: string;
  title?: string | null;
  type?: string | null;
  transactionType?: string | null;
  surfaceTotal?: number | null;
  city?: string | null;
  district?: string | null;
}): string {
  const lines: string[] = [];
  const what = TYPE_LABEL[p.type || "AUTRE"] || "Bien";
  const tx = TX_LABEL[p.transactionType || ""] || "";
  const surface = p.surfaceTotal ? `${p.surfaceTotal} m²` : null;
  const where = [p.district, p.city].filter(Boolean).join(", ");

  lines.push(`Bonjour, je suis intéressé par le bien ${p.reference}.`);
  const detail = [what, tx, surface, where].filter(Boolean).join(" • ");
  if (detail) lines.push(detail);
  if (p.title) lines.push(`(${p.title})`);
  lines.push("Pourriez-vous me recontacter ?");
  return lines.join("\n");
}

/**
 * Generate a fresh panel code (PAN-0001, PAN-0002, …) by picking the next
 * integer after the highest existing one. Sequential codes make panels easy
 * to identify on the back of the physical sign.
 */
export async function nextPanelCode(): Promise<string> {
  const last = await prisma.panel.findFirst({
    where: { code: { startsWith: "PAN-" } },
    orderBy: { code: "desc" },
    select: { code: true },
  });
  const num = last ? parseInt(last.code.slice(4), 10) || 0 : 0;
  return `PAN-${String(num + 1).padStart(4, "0")}`;
}
