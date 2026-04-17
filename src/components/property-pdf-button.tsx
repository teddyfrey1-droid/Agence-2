"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BRAND, loadLogoDataUrl, fmtEUR, todayFR } from "@/lib/pdf-helpers";

interface PropertyForPdf {
  reference: string;
  title: string;
  type: string;
  transactionType: string;
  status: string;
  address: string | null;
  city: string;
  zipCode: string;
  district: string | null;
  quarter: string | null;
  description: string | null;
  surfaceTotal: number | null;
  surfaceMin: number | null;
  surfaceMax: number | null;
  floor: number | null;
  totalFloors: number | null;
  facadeLength: number | null;
  ceilingHeight: number | null;
  price: number | null;
  rentMonthly: number | null;
  rentYearly: number | null;
  charges: number | null;
  deposit: number | null;
  fees: number | null;
  pricePerSqm: number | null;
  hasExtraction: boolean;
  hasTerrace: boolean;
  hasParking: boolean;
  hasLoadingDock: boolean;
  isCoMandat: boolean;
  coMandatAgency: string | null;
  owner: { firstName: string; lastName: string; company: string | null; phone: string | null; email: string } | null;
  assignedTo: { firstName: string; lastName: string; email: string | null; phone: string | null } | null;
  media: { url: string; isPrimary: boolean }[];
}

interface AgencyForPdf {
  name: string;
  legalName: string | null;
  siret: string | null;
  address: string | null;
  city: string | null;
  zipCode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  professionalCardNumber: string | null;
  professionalCardAuthority: string | null;
  financialGuarantee: string | null;
}

interface PdfPayload {
  property: PropertyForPdf;
  agency: AgencyForPdf;
  currentUser: { firstName: string; lastName: string; email: string };
}

const TYPE_LABELS: Record<string, string> = {
  BOUTIQUE: "Boutique", BUREAU: "Bureau", LOCAL_COMMERCIAL: "Local commercial",
  LOCAL_ACTIVITE: "Local d'activité", RESTAURANT: "Restaurant", HOTEL: "Hôtel",
  ENTREPOT: "Entrepôt", PARKING: "Parking", TERRAIN: "Terrain",
  IMMEUBLE: "Immeuble", AUTRE: "Autre",
};

const TX_LABELS: Record<string, string> = {
  VENTE: "À VENDRE", LOCATION: "À LOUER", CESSION_BAIL: "CESSION DE BAIL",
  FOND_DE_COMMERCE: "FONDS DE COMMERCE",
};

const STATUS_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon", ACTIF: "Actif", EN_NEGOCIATION: "En négociation",
  PRENEUR_TROUVE: "Preneur trouvé", SOUS_COMPROMIS: "Sous compromis",
  VENDU: "Vendu", LOUE: "Loué", RETIRE: "Retiré", ARCHIVE: "Archivé",
};

async function loadImageAsDataUrl(url: string): Promise<{ dataUrl: string; w: number; h: number } | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.crossOrigin = "anonymous";
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = objUrl;
      });
      const canvas = document.createElement("canvas");
      const maxW = 1200;
      const scale = img.width > maxW ? maxW / img.width : 1;
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return { dataUrl: canvas.toDataURL("image/jpeg", 0.85), w: canvas.width, h: canvas.height };
    } finally {
      URL.revokeObjectURL(objUrl);
    }
  } catch {
    return null;
  }
}

export function PropertyPdfButton({ propertyId }: { propertyId: string }) {
  const [loading, setLoading] = useState(false);

  async function generatePdf() {
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/pdf`);
      if (!res.ok) return;
      const { property, agency }: PdfPayload = await res.json();

      const jspdfModule = await import("jspdf");
      const jsPDF = jspdfModule.default;
      const autoTableModule = await import("jspdf-autotable");
      const autoTable = autoTableModule.default;

      const [logo, cover] = await Promise.all([
        loadLogoDataUrl(1000),
        property.media[0]?.url ? loadImageAsDataUrl(property.media[0].url) : Promise.resolve(null),
      ]);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;

      // ─── Header ───
      // Soft ivory band
      doc.setFillColor(...BRAND.softBg);
      doc.rect(0, 0, pageWidth, 32, "F");
      // Gold accent line
      doc.setFillColor(...BRAND.gold);
      doc.rect(0, 32, pageWidth, 0.8, "F");

      if (logo) {
        // logo SVG aspect ≈ 1708:296
        const logoW = 48;
        const logoH = logoW * (296 / 1708);
        doc.addImage(logo, "PNG", margin, 12, logoW, logoH);
      } else {
        doc.setTextColor(...BRAND.dark);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("RETAIL AVENUE", margin, 20);
      }

      // Reference + Date on right
      doc.setTextColor(...BRAND.muted);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("FICHE COMMERCIALE", pageWidth - margin, 12, { align: "right" });
      doc.setTextColor(...BRAND.text);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`Réf. ${property.reference}`, pageWidth - margin, 18, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...BRAND.muted);
      doc.text(todayFR(), pageWidth - margin, 24, { align: "right" });
      doc.text(STATUS_LABELS[property.status] || property.status, pageWidth - margin, 29, { align: "right" });

      // ─── Title section ───
      let y = 46;
      doc.setTextColor(...BRAND.text);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      const titleLines = doc.splitTextToSize(property.title, contentWidth);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 7 + 2;

      // Transaction + Type chip
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...BRAND.gold);
      doc.text(`${TX_LABELS[property.transactionType] || property.transactionType} · ${TYPE_LABELS[property.type] || property.type}`, margin, y);
      y += 6;

      // Location
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...BRAND.muted);
      const locParts = [property.address, property.district, `${property.zipCode} ${property.city}`, property.quarter].filter(Boolean);
      const locLines = doc.splitTextToSize(locParts.join(" — "), contentWidth);
      doc.text(locLines, margin, y);
      y += locLines.length * 5;

      // Co-mandat banner
      if (property.isCoMandat) {
        y += 2;
        doc.setFillColor(240, 244, 252);
        doc.setDrawColor(180, 200, 230);
        doc.setLineWidth(0.2);
        doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, "FD");
        doc.setTextColor(40, 80, 150);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text(
          `Co-mandat${property.coMandatAgency ? ` — en partenariat avec ${property.coMandatAgency}` : ""}`,
          margin + 3,
          y + 4.8
        );
        y += 10;
      } else {
        y += 4;
      }

      // ─── Cover photo ───
      if (cover) {
        const maxImgH = 70;
        const imgAspect = cover.h / cover.w;
        const imgW = contentWidth;
        const imgH = Math.min(imgW * imgAspect, maxImgH);
        doc.addImage(cover.dataUrl, "JPEG", margin, y, imgW, imgH);
        y += imgH + 6;
      }

      // ─── Key figures band ───
      const priceLabel = property.transactionType === "LOCATION" ? "Loyer mensuel HC" : "Prix";
      const priceValue = property.transactionType === "LOCATION" ? fmtEUR(property.rentMonthly) : fmtEUR(property.price);
      const surfaceValue = property.surfaceTotal ? `${property.surfaceTotal} m²` : "—";

      if (y > pageHeight - 40) { doc.addPage(); y = 20; }
      doc.setFillColor(...BRAND.softBg);
      doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "F");
      const colW = contentWidth / 3;
      const cols: [string, string][] = [
        [priceLabel, priceValue],
        ["Surface", surfaceValue],
        ["Emplacement", property.district || property.city || "—"],
      ];
      cols.forEach(([label, value], i) => {
        const cx = margin + i * colW + colW / 2;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...BRAND.muted);
        doc.text(label.toUpperCase(), cx, y + 7, { align: "center" });
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(...BRAND.text);
        doc.text(value, cx, y + 15, { align: "center" });
      });
      y += 28;

      // ─── Characteristics ───
      const charRows: string[][] = [];
      if (property.surfaceTotal) charRows.push(["Surface totale", `${property.surfaceTotal} m²`]);
      if (property.surfaceMin) charRows.push(["Surface minimale", `${property.surfaceMin} m²`]);
      if (property.surfaceMax) charRows.push(["Surface maximale", `${property.surfaceMax} m²`]);
      if (property.floor != null) charRows.push(["Étage", property.floor === 0 ? "RDC" : `${property.floor}e étage`]);
      if (property.totalFloors) charRows.push(["Nombre d'étages", `${property.totalFloors}`]);
      if (property.facadeLength) charRows.push(["Linéaire de façade", `${property.facadeLength} m`]);
      if (property.ceilingHeight) charRows.push(["Hauteur sous plafond", `${property.ceilingHeight} m`]);

      const features: string[] = [];
      if (property.hasExtraction) features.push("Extraction / Ventilation");
      if (property.hasTerrace) features.push("Terrasse");
      if (property.hasParking) features.push("Parking");
      if (property.hasLoadingDock) features.push("Quai de chargement");
      if (features.length > 0) charRows.push(["Équipements", features.join(" · ")]);

      if (charRows.length > 0) {
        if (y > pageHeight - 50) { doc.addPage(); y = 20; }
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...BRAND.gold);
        doc.text("CARACTÉRISTIQUES", margin, y);
        y += 3;
        autoTable(doc, {
          startY: y,
          body: charRows,
          theme: "plain",
          styles: { fontSize: 9, cellPadding: { top: 2.8, bottom: 2.8, left: 4, right: 4 }, textColor: BRAND.text },
          columnStyles: {
            0: { fontStyle: "bold", cellWidth: 55, textColor: BRAND.muted },
            1: { textColor: BRAND.text },
          },
          alternateRowStyles: { fillColor: BRAND.softBg },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      // ─── Financial ───
      const finRows: string[][] = [];
      if (property.transactionType === "LOCATION") {
        if (property.rentMonthly) finRows.push(["Loyer mensuel HC", fmtEUR(property.rentMonthly)]);
        if (property.rentYearly) finRows.push(["Loyer annuel HC", fmtEUR(property.rentYearly)]);
        if (property.charges) finRows.push(["Charges mensuelles", fmtEUR(property.charges)]);
        if (property.deposit) finRows.push(["Dépôt de garantie", fmtEUR(property.deposit)]);
        if (property.fees) finRows.push(["Honoraires", fmtEUR(property.fees)]);
      } else {
        if (property.price) finRows.push(["Prix de vente", fmtEUR(property.price)]);
        if (property.pricePerSqm) finRows.push(["Prix au m²", fmtEUR(property.pricePerSqm)]);
        if (property.fees) finRows.push(["Honoraires", fmtEUR(property.fees)]);
      }

      if (finRows.length > 0) {
        if (y > pageHeight - 50) { doc.addPage(); y = 20; }
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...BRAND.gold);
        doc.text("CONDITIONS FINANCIÈRES", margin, y);
        y += 3;
        autoTable(doc, {
          startY: y,
          body: finRows,
          theme: "plain",
          styles: { fontSize: 9, cellPadding: { top: 2.8, bottom: 2.8, left: 4, right: 4 }, textColor: BRAND.text },
          columnStyles: {
            0: { fontStyle: "bold", cellWidth: 55, textColor: BRAND.muted },
            1: { fontStyle: "bold", textColor: BRAND.text },
          },
          alternateRowStyles: { fillColor: BRAND.softBg },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      // ─── Description ───
      if (property.description) {
        if (y > pageHeight - 60) { doc.addPage(); y = 20; }
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...BRAND.gold);
        doc.text("DESCRIPTION", margin, y);
        y += 6;
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...BRAND.text);
        doc.setLineHeightFactor(1.5);
        const descLines = doc.splitTextToSize(property.description, contentWidth);
        descLines.forEach((line: string) => {
          if (y > pageHeight - 30) { doc.addPage(); y = 20; }
          doc.text(line, margin, y);
          y += 4.8;
        });
        doc.setLineHeightFactor(1.15);
        y += 4;
      }

      // ─── Interlocutor ───
      if (property.assignedTo) {
        if (y > pageHeight - 45) { doc.addPage(); y = 20; }
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...BRAND.gold);
        doc.text("VOTRE INTERLOCUTEUR", margin, y);
        y += 6;

        doc.setFillColor(...BRAND.softBg);
        doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "F");
        doc.setFontSize(10.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...BRAND.text);
        doc.text(`${property.assignedTo.firstName} ${property.assignedTo.lastName}`, margin + 5, y + 8);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...BRAND.muted);
        const details = [property.assignedTo.phone, property.assignedTo.email].filter(Boolean);
        if (details.length > 0) {
          doc.text(details.join("  ·  "), margin + 5, y + 15);
        }
        y += 28;
      }

      // ─── Footer on every page ───
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(...BRAND.gold);
        doc.setLineWidth(0.4);
        doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...BRAND.text);
        doc.text(agency.name, margin, pageHeight - 15);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...BRAND.muted);
        const legalBits = [
          [agency.address, agency.zipCode, agency.city].filter(Boolean).join(" · "),
          agency.phone,
          agency.email,
          agency.siret ? `SIRET ${agency.siret}` : null,
          agency.professionalCardNumber ? `Carte pro ${agency.professionalCardNumber}${agency.professionalCardAuthority ? ` (${agency.professionalCardAuthority})` : ""}` : null,
        ].filter(Boolean) as string[];
        let fy = pageHeight - 11;
        legalBits.forEach((b) => {
          doc.text(b, margin, fy);
          fy += 3.2;
        });

        doc.setTextColor(...BRAND.muted);
        doc.setFontSize(7.5);
        doc.text(`Page ${i}/${pageCount}`, pageWidth - margin, pageHeight - 15, { align: "right" });
        doc.text("Document confidentiel — " + todayFR(), pageWidth - margin, pageHeight - 11, { align: "right" });
      }

      doc.save(`Fiche-${property.reference}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" className="w-full justify-start" onClick={generatePdf} disabled={loading}>
      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
      {loading ? "Génération..." : "Fiche PDF Commerciale"}
    </Button>
  );
}
