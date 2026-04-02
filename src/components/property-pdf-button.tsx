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
  surfaceCommercial: number | null;
  surfaceStorage: number | null;
  floor: number | null;
  price: number | null;
  rentMonthly: number | null;
  rentYearly: number | null;
  charges: number | null;
  hasExtraction: boolean;
  hasTerrace: boolean;
  hasParking: boolean;
  hasLoadingDock: boolean;
  facade: number | null;
  height: number | null;
  owner: { firstName: string; lastName: string; company: string | null; phone: string | null; email: string } | null;
  assignedTo: { firstName: string; lastName: string } | null;
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

      // Header bar
      doc.setFillColor(136, 106, 75); // brand color #886a4b
      doc.rect(0, 0, pageWidth, 35, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("FICHE TECHNIQUE", 14, 16);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Réf. ${property.reference}`, 14, 25);
      doc.text(new Date().toLocaleDateString("fr-FR"), pageWidth - 14, 25, { align: "right" });

      // Title
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(property.title, 14, 48);

      // Location
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      const locationParts = [property.address, property.district, `${property.zipCode} ${property.city}`].filter(Boolean);
      doc.text(locationParts.join(" — "), 14, 56);

      // Main info table
      const mainRows: string[][] = [];
      mainRows.push(["Type de bien", TYPE_LABELS[property.type] || property.type]);
      mainRows.push(["Transaction", TX_LABELS[property.transactionType] || property.transactionType]);
      if (property.surfaceTotal) mainRows.push(["Surface totale", `${property.surfaceTotal} m²`]);
      if (property.surfaceCommercial) mainRows.push(["Surface commerciale", `${property.surfaceCommercial} m²`]);
      if (property.surfaceStorage) mainRows.push(["Surface stockage", `${property.surfaceStorage} m²`]);
      if (property.floor != null) mainRows.push(["Étage", property.floor === 0 ? "RDC" : `${property.floor}e`]);
      if (property.facade) mainRows.push(["Linéaire de façade", `${property.facade} m`]);
      if (property.height) mainRows.push(["Hauteur sous plafond", `${property.height} m`]);

      autoTable(doc, {
        startY: 62,
        head: [["Caractéristique", "Détail"]],
        body: mainRows,
        theme: "striped",
        headStyles: { fillColor: [136, 106, 75], textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
      });

      // Price table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let currentY = (doc as any).lastAutoTable.finalY + 10;
      const priceRows: string[][] = [];
      if (property.transactionType === "LOCATION") {
        if (property.rentMonthly) priceRows.push(["Loyer mensuel", fmtPrice(property.rentMonthly)]);
        if (property.rentYearly) priceRows.push(["Loyer annuel", fmtPrice(property.rentYearly)]);
      } else {
        if (property.price) priceRows.push(["Prix", fmtPrice(property.price)]);
      }
      if (property.charges) priceRows.push(["Charges", `${fmtPrice(property.charges)}/mois`]);

      if (priceRows.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [["Conditions financières", "Montant"]],
          body: priceRows,
          theme: "striped",
          headStyles: { fillColor: [136, 106, 75], textColor: [255, 255, 255], fontStyle: "bold" },
          styles: { fontSize: 9, cellPadding: 4 },
          columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Features
      const features = [];
      if (property.hasExtraction) features.push("Extraction");
      if (property.hasTerrace) features.push("Terrasse");
      if (property.hasParking) features.push("Parking");
      if (property.hasLoadingDock) features.push("Quai de chargement");

      if (features.length > 0) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(136, 106, 75);
        doc.text("Équipements", 14, currentY);
        currentY += 6;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        features.forEach((f) => {
          doc.text(`• ${f}`, 18, currentY);
          currentY += 5;
        });
        currentY += 5;
      }

      // Description
      if (property.description) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(136, 106, 75);
        doc.text("Description", 14, currentY);
        currentY += 6;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        const lines = doc.splitTextToSize(property.description, pageWidth - 28);
        doc.text(lines, 14, currentY);
        currentY += lines.length * 4.5 + 5;
      }

      // Footer
      doc.setFillColor(136, 106, 75);
      doc.rect(0, doc.internal.pageSize.getHeight() - 15, pageWidth, 15, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(
        "Agence Immobilière — Document confidentiel — " + new Date().toLocaleDateString("fr-FR"),
        pageWidth / 2, doc.internal.pageSize.getHeight() - 6,
        { align: "center" }
      );

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
