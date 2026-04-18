import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getAgencyInfo } from "@/lib/agency";
import { findPanelById } from "@/modules/panels";
import { panelScanUrl } from "@/modules/panels";

export const runtime = "nodejs";

/**
 * Generate a print-ready A4 PDF of a panel: agency branding + the QR.
 *
 * The PDF intentionally carries no per-property info so the same printed
 * panel can be reassigned to a new bien at any time without reprinting.
 * Property details, agent name and phone are rendered dynamically after the
 * scan.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getActiveSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!hasPermission(session.role, "property", "read")) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
  }

  const { id } = await params;
  const panel = await findPanelById(id);
  if (!panel) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const agency = await getAgencyInfo();
  const url = panelScanUrl(panel.code);

  // High error-correction so the QR survives lamination, glare, weather.
  const qrDataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 1024,
    color: { dark: "#1a1a2e", light: "#ffffff" },
  });

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Header — agency name, large
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(26, 26, 46);
  doc.text(agency.name.toUpperCase(), pageW / 2, 30, { align: "center" });

  if (agency.description) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(110, 105, 95);
    const tag = doc.splitTextToSize(agency.description, pageW - 40);
    doc.text(tag, pageW / 2, 40, { align: "center" });
  }

  // Big tagline
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(139, 105, 20);
  doc.text("Scannez ce QR code", pageW / 2, 70, { align: "center" });
  doc.setFontSize(14);
  doc.setTextColor(60, 56, 50);
  doc.text("Détails du bien & contact direct par WhatsApp", pageW / 2, 80, {
    align: "center",
  });

  // QR — centered, large (12 cm)
  const qrSize = 120;
  const qrX = (pageW - qrSize) / 2;
  const qrY = 95;
  doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  // Panel code under the QR (so an agent can identify the panel from the back)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(26, 26, 46);
  doc.text(panel.code, pageW / 2, qrY + qrSize + 12, { align: "center" });

  if (panel.label) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110, 105, 95);
    doc.text(panel.label, pageW / 2, qrY + qrSize + 19, { align: "center" });
  }

  // Footer — contact
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 105, 95);
  const contactBits = [agency.phone, agency.email, agency.website].filter(Boolean);
  if (contactBits.length > 0) {
    doc.text(contactBits.join("  •  "), pageW / 2, pageH - 18, { align: "center" });
  }
  doc.setFontSize(8);
  doc.text(url, pageW / 2, pageH - 12, { align: "center" });

  const buffer = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${panel.code}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
