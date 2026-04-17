import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveSession } from "@/lib/auth";
import { getAgencyInfo } from "@/lib/agency";
import { sendContractEmail } from "@/lib/email";

// Hard cap on PDF size to protect the server/Brevo payload (~8 MB base64 ≈ 6 MB pdf)
const MAX_PDF_BASE64_BYTES = 8 * 1024 * 1024;

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function sanitizeFileName(name: unknown, fallback: string): string {
  const n = typeof name === "string" ? name.trim() : "";
  const cleaned = n.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 120);
  if (!cleaned) return fallback;
  return /\.pdf$/i.test(cleaned) ? cleaned : `${cleaned}.pdf`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getActiveSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id: propertyId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const to = b.to;
  if (!isValidEmail(to)) {
    return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });
  }

  const recipientType = b.recipientType;
  if (
    recipientType !== "PRENEUR" &&
    recipientType !== "BAILLEUR" &&
    recipientType !== "CO_MANDATAIRE" &&
    recipientType !== "AGENCE"
  ) {
    return NextResponse.json({ error: "Type de destinataire invalide" }, { status: 400 });
  }

  const pdfBase64 = b.pdfBase64;
  if (typeof pdfBase64 !== "string" || pdfBase64.length === 0) {
    return NextResponse.json({ error: "PDF manquant" }, { status: 400 });
  }
  if (pdfBase64.length > MAX_PDF_BASE64_BYTES) {
    return NextResponse.json({ error: "Pièce jointe trop volumineuse" }, { status: 413 });
  }
  if (!/^[A-Za-z0-9+/=\r\n]+$/.test(pdfBase64)) {
    return NextResponse.json({ error: "PDF invalide" }, { status: 400 });
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, reference: true, title: true },
  });
  if (!property) {
    return NextResponse.json({ error: "Bien introuvable" }, { status: 404 });
  }

  const agency = await getAgencyInfo();

  const fileName = sanitizeFileName(b.fileName, `Contrat-${property.reference}.pdf`);
  const recipientName =
    typeof b.recipientName === "string" && b.recipientName.trim().length > 0
      ? b.recipientName.trim().slice(0, 200)
      : "";
  const subject =
    typeof b.subject === "string" && b.subject.trim().length > 0
      ? b.subject.trim().slice(0, 200)
      : `Contrat d'engagement — ${property.reference} ${property.title}`;
  const message = typeof b.message === "string" ? b.message.slice(0, 2000) : "";

  const senderName = `${session.firstName} ${session.lastName}`.trim() || agency.name;
  const senderEmail = session.email || agency.email || "";

  const ok = await sendContractEmail({
    to,
    subject,
    message,
    recipientName,
    recipientType,
    senderName,
    senderEmail,
    agencyName: agency.name,
    propertyRef: property.reference,
    propertyTitle: property.title,
    fileName,
    pdfBase64: pdfBase64.replace(/\s+/g, ""),
  });

  if (!ok) {
    return NextResponse.json({ error: "Échec de l'envoi de l'email" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
