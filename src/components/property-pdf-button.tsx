"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

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
  hasExtraction: boolean;
  hasTerrace: boolean;
  hasParking: boolean;
  hasLoadingDock: boolean;
  isCoMandat: boolean;
  coMandatAgency: string | null;
  owner: { firstName: string; lastName: string; company: string | null; phone: string | null; email: string } | null;
  assignedTo: { firstName: string; lastName: string } | null;
  media: { url: string; isPrimary: boolean }[];
}

const TYPE_LABELS: Record<string, string> = {
  BOUTIQUE: "Boutique", BUREAU: "Bureau", LOCAL_COMMERCIAL: "Local commercial",
  LOCAL_ACTIVITE: "Local d'activité", RESTAURANT: "Restaurant", HOTEL: "Hôtel",
  ENTREPOT: "Entrepôt", PARKING: "Parking", TERRAIN: "Terrain",
  IMMEUBLE: "Immeuble", AUTRE: "Autre",
};

const TX_LABELS: Record<string, string> = {
  VENTE: "Vente", LOCATION: "Location", CESSION_BAIL: "Cession de bail",
  FOND_DE_COMMERCE: "Fond de commerce",
};

const STATUS_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon", ACTIF: "Actif", EN_NEGOCIATION: "En négociation",
  PRENEUR_TROUVE: "Preneur trouvé", SOUS_COMPROMIS: "Sous compromis",
  VENDU: "Vendu", LOUE: "Loué", RETIRE: "Retiré", ARCHIVE: "Archivé",
};

function fmtPrice(val: number | null) {
  if (!val) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val);
}

export function PropertyPdfButton({ propertyId }: { propertyId: string }) {
  const [loading, setLoading] = useState(false);

  async function generatePdf() {
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/pdf`);
      if (!res.ok) return;
      const property: PropertyForPdf = await res.json();

      const jspdfModule = await import("jspdf");
      const jsPDF = jspdfModule.default;
      const autoTableModule = await import("jspdf-autotable");
      const autoTable = autoTableModule.default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;

      // ─── Brand colors ───
      const brandRgb: [number, number, number] = [136, 106, 75];
      const darkText: [number, number, number] = [40, 40, 40];
      const grayText: [number, number, number] = [100, 100, 100];
      const lightBg: [number, number, number] = [248, 247, 244];

      // ─── Header band ───
      doc.setFillColor(...brandRgb);
      doc.rect(0, 0, pageWidth, 40, "F");

      // Subtle accent line
      doc.setFillColor(255, 255, 255);
      doc.setGState(doc.GState({ opacity: 0.15 }));
      doc.rect(0, 36, pageWidth, 4, "F");
      doc.setGState(doc.GState({ opacity: 1 }));

      // Agency name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("LA PLACE — Immobilier commercial", margin, 12);

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("FICHE TECHNIQUE", margin, 25);

      // Reference + Date on right
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Réf. ${property.reference}`, pageWidth - margin, 12, { align: "right" });
      doc.text(new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }), pageWidth - margin, 19, { align: "right" });
      doc.text(STATUS_LABELS[property.status] || property.status, pageWidth - margin, 26, { align: "right" });

      // ─── Property title section ───
      let y = 50;
      doc.setTextColor(...darkText);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      const titleLines = doc.splitTextToSize(property.title, contentWidth);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 7 + 3;

      // Location line
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...grayText);
      const locationParts = [property.address, property.district, `${property.zipCode} ${property.city}`].filter(Boolean);
      doc.text(locationParts.join(" — "), margin, y);
      y += 5;

      // Type + Transaction tag
      doc.setFontSize(9);
      doc.setTextColor(...brandRgb);
      doc.setFont("helvetica", "bold");
      doc.text(`${TYPE_LABELS[property.type] || property.type} · ${TX_LABELS[property.transactionType] || property.transactionType}`, margin, y);
      y += 4;

      // Co-mandat tag
      if (property.isCoMandat) {
        doc.setTextColor(37, 99, 235);
        doc.text(`Co-mandat${property.coMandatAgency ? ` — ${property.coMandatAgency}` : ""}`, margin, y);
        y += 4;
      }

      // ─── Separator ───
      y += 4;
      doc.setDrawColor(220, 220, 215);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      // ─── Characteristics table ───
      const charRows: string[][] = [];
      if (property.surfaceTotal) charRows.push(["Surface totale", `${property.surfaceTotal} m²`]);
      if (property.surfaceMin) charRows.push(["Surface min.", `${property.surfaceMin} m²`]);
      if (property.surfaceMax) charRows.push(["Surface max.", `${property.surfaceMax} m²`]);
      if (property.floor != null) charRows.push(["Étage", property.floor === 0 ? "RDC" : `${property.floor}e étage`]);
      if (property.totalFloors) charRows.push(["Nombre d'étages", `${property.totalFloors}`]);
      if (property.facadeLength) charRows.push(["Linéaire de façade", `${property.facadeLength} m`]);
      if (property.ceilingHeight) charRows.push(["Hauteur sous plafond", `${property.ceilingHeight} m`]);

      if (charRows.length > 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...brandRgb);
        doc.text("CARACTÉRISTIQUES", margin, y);
        y += 2;

        autoTable(doc, {
          startY: y,
          body: charRows,
          theme: "plain",
          styles: { fontSize: 9, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }, textColor: darkText },
          columnStyles: {
            0: { fontStyle: "bold", cellWidth: 55, textColor: grayText },
            1: { textColor: darkText },
          },
          alternateRowStyles: { fillColor: lightBg },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      // ─── Financial table ───
      const finRows: string[][] = [];
      if (property.transactionType === "LOCATION") {
        if (property.rentMonthly) finRows.push(["Loyer mensuel HC", fmtPrice(property.rentMonthly)]);
        if (property.rentYearly) finRows.push(["Loyer annuel HC", fmtPrice(property.rentYearly)]);
        if (property.charges) finRows.push(["Charges/mois", fmtPrice(property.charges)]);
        if (property.deposit) finRows.push(["Dépôt de garantie", fmtPrice(property.deposit)]);
      } else {
        if (property.price) finRows.push(["Prix de vente", fmtPrice(property.price)]);
        if (property.fees) finRows.push(["Honoraires", fmtPrice(property.fees)]);
      }

      if (finRows.length > 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...brandRgb);
        doc.text("CONDITIONS FINANCIÈRES", margin, y);
        y += 2;

        autoTable(doc, {
          startY: y,
          body: finRows,
          theme: "plain",
          styles: { fontSize: 9, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }, textColor: darkText },
          columnStyles: {
            0: { fontStyle: "bold", cellWidth: 55, textColor: grayText },
            1: { fontStyle: "bold", textColor: darkText },
          },
          alternateRowStyles: { fillColor: lightBg },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      // ─── Equipment ───
      const features = [];
      if (property.hasExtraction) features.push("Extraction / Ventilation");
      if (property.hasTerrace) features.push("Terrasse");
      if (property.hasParking) features.push("Parking");
      if (property.hasLoadingDock) features.push("Quai de chargement");

      if (features.length > 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...brandRgb);
        doc.text("ÉQUIPEMENTS", margin, y);
        y += 6;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...darkText);
        features.forEach((f) => {
          doc.setFillColor(...brandRgb);
          doc.circle(margin + 2, y - 1.2, 1.2, "F");
          doc.text(f, margin + 7, y);
          y += 5;
        });
        y += 4;
      }

      // ─── Description ───
      if (property.description) {
        if (y > pageHeight - 60) { doc.addPage(); y = 20; }
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...brandRgb);
        doc.text("DESCRIPTION", margin, y);
        y += 6;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...darkText);
        doc.setLineHeightFactor(1.5);
        const descLines = doc.splitTextToSize(property.description, contentWidth);
        doc.text(descLines, margin, y);
        y += descLines.length * 4.5 + 6;
        doc.setLineHeightFactor(1.15);
      }

      // ─── Contact info ───
      if (property.assignedTo) {
        if (y > pageHeight - 40) { doc.addPage(); y = 20; }
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...brandRgb);
        doc.text("VOTRE INTERLOCUTEUR", margin, y);
        y += 6;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...darkText);
        doc.text(`${property.assignedTo.firstName} ${property.assignedTo.lastName}`, margin, y);
        y += 5;
      }

      // ─── Footer ───
      doc.setFillColor(...brandRgb);
      doc.rect(0, pageHeight - 18, pageWidth, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(
        "LA PLACE — Immobilier commercial & professionnel à Paris",
        pageWidth / 2, pageHeight - 11,
        { align: "center" }
      );
      doc.text(
        "Document confidentiel — " + new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
        pageWidth / 2, pageHeight - 6,
        { align: "center" }
      );

      // Thin brand line at the very top of footer
      doc.setFillColor(255, 255, 255);
      doc.setGState(doc.GState({ opacity: 0.2 }));
      doc.rect(0, pageHeight - 18, pageWidth, 1, "F");
      doc.setGState(doc.GState({ opacity: 1 }));

      doc.save(`fiche-${property.reference}.pdf`);
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
      {loading ? "Génération..." : "Fiche PDF"}
    </Button>
  );
}
