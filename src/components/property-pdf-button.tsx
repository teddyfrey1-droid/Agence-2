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
  VENTE: "À VENDRE", LOCATION: "À LOUER", CESSION_BAIL: "CESSION DE BAIL",
  FOND_DE_COMMERCE: "FONDS DE COMMERCE",
};

function fmtPrice(val: number | null) {
  if (!val) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val);
}

// Helper pour charger l'image du logo
const loadImage = (url: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });
};

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
      
      // Couleurs DA issues de tailwind.config.ts
      const BRAND_COLOR: [number, number, number] = [136, 106, 75]; // #886a4b (Brand 700)
      const ANTHRACITE: [number, number, number] = [51, 53, 65]; // #333541 (Anthracite 900)

      // 1. En-tête : Titre principal de transaction
      doc.setFont("times", "bold");
      doc.setFontSize(28);
      doc.setTextColor(...ANTHRACITE);
      const mainTitle = `${TYPE_LABELS[property.type]?.toUpperCase() || "BIEN"} \n${TX_LABELS[property.transactionType] || "SUR LE MARCHÉ"}`;
      doc.text(mainTitle, 14, 25);

      // Chargement et ajout du Logo
      const logoImg = await loadImage("/logo-mark.png");
      if (logoImg) {
        doc.addImage(logoImg, "PNG", pageWidth - 45, 15, 30, 30);
      } else {
        // Fallback texte si le logo ne charge pas
        doc.setFontSize(14);
        doc.setTextColor(...BRAND_COLOR);
        doc.text("QG PARTNERS", pageWidth - 14, 25, { align: "right" });
      }

      // Ligne décorative séparatrice
      doc.setDrawColor(...BRAND_COLOR);
      doc.setLineWidth(0.5);
      doc.line(14, 45, pageWidth - 14, 45);

      // 2. Zone Photo (Placeholder élégant)
      doc.setFillColor(248, 247, 244); // Stone-50
      doc.rect(14, 52, pageWidth - 28, 90, "F");
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Visuel non contractuel / Espace photo", pageWidth / 2, 97, { align: "center" });

      let currentY = 155;

      // 3. Informations générales et Contact (Disposition en 2 colonnes)
      // Colonne Gauche : Titre, Réf, Adresse
      doc.setFont("times", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...ANTHRACITE);
      doc.text(property.title, 14, currentY);
      
      currentY += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`RÉF. ${property.reference}`, 14, currentY);
      
      currentY += 5;
      const locationParts = [property.address, property.district, `${property.zipCode} ${property.city}`].filter(Boolean);
      doc.text(locationParts.join(" — "), 14, currentY);

      // Colonne Droite : Contact
      doc.setFont("times", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...BRAND_COLOR);
      doc.text("VOTRE CONTACT", pageWidth - 14, currentY - 11, { align: "right" });
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...ANTHRACITE);
      const agentName = property.assignedTo ? `${property.assignedTo.firstName} ${property.assignedTo.lastName}` : "L'équipe";
      doc.text(agentName, pageWidth - 14, currentY - 4, { align: "right" });

      currentY += 15;

      // 4. Description du bien
      if (property.description) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...ANTHRACITE);
        const lines = doc.splitTextToSize(property.description, pageWidth - 28);
        doc.text(lines, 14, currentY);
        currentY += lines.length * 4.5 + 10;
      }

      // 5. Tableaux de caractéristiques (Style épuré type fiche commerciale)
      const featuresRows: string[][] = [];
      if (property.surfaceTotal) featuresRows.push(["Surface totale", `${property.surfaceTotal} m²`]);
      if (property.surfaceCommercial) featuresRows.push(["Surface de vente", `${property.surfaceCommercial} m²`]);
      if (property.surfaceStorage) featuresRows.push(["Surface stockage", `${property.surfaceStorage} m²`]);
      if (property.floor != null) featuresRows.push(["Étage", property.floor === 0 ? "RDC" : `${property.floor}e`]);
      
      const featuresExtra = [];
      if (property.hasExtraction) featuresExtra.push("Extraction");
      if (property.hasTerrace) featuresExtra.push("Terrasse");
      if (property.hasParking) featuresExtra.push("Parking");
      if (featuresExtra.length > 0) featuresRows.push(["Équipements", featuresExtra.join(", ")]);

      autoTable(doc, {
        startY: currentY,
        head: [["SURFACES & PRESTATIONS", ""]],
        body: featuresRows,
        theme: "plain",
        headStyles: { textColor: BRAND_COLOR, font: "times", fontStyle: "bold", fontSize: 11 },
        bodyStyles: { textColor: ANTHRACITE, fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
        margin: { left: 14 }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentY = (doc as any).lastAutoTable.finalY + 10;

      // 6. Conditions Financières
      const priceRows: string[][] = [];
      if (property.transactionType === "LOCATION") {
        if (property.rentMonthly) priceRows.push(["Loyer mensuel", fmtPrice(property.rentMonthly)]);
        if (property.charges) priceRows.push(["Charges mensuelles", fmtPrice(property.charges)]);
      } else {
        if (property.price) priceRows.push(["Prix de vente", fmtPrice(property.price)]);
        if (property.charges) priceRows.push(["Charges", `${fmtPrice(property.charges)}/an`]);
      }

      autoTable(doc, {
        startY: currentY,
        head: [["CONDITIONS COMMERCIALES", ""]],
        body: priceRows,
        theme: "plain",
        headStyles: { textColor: BRAND_COLOR, font: "times", fontStyle: "bold", fontSize: 11 },
        bodyStyles: { textColor: ANTHRACITE, fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
        margin: { left: 14 }
      });

      // 7. Footer professionnel
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFillColor(...ANTHRACITE);
      doc.rect(0, pageHeight - 20, pageWidth, 20, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      
      const footerText = `Agence Plus - Document non contractuel — Édité le ${new Date().toLocaleDateString("fr-FR")}`;
      doc.text(footerText, pageWidth / 2, pageHeight - 8, { align: "center" });

      doc.save(`Fiche-Client-${property.reference}.pdf`);
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
