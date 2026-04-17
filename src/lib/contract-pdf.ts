"use client";

import { BRAND, loadLogoDataUrl, fmtEUR, fmtDateFR, todayFR } from "@/lib/pdf-helpers";

export type ContractRecipientType = "BAILLEUR" | "CO_MANDATAIRE";

export interface ContractParty {
  /** Company / agency / individual name */
  name: string;
  legalForm?: string;
  address?: string;
  zipCode?: string;
  city?: string;
  siret?: string;
  professionalCard?: string;
  representative?: string;
  email?: string;
  phone?: string;
}

export interface ContractFormData {
  recipientType: ContractRecipientType;
  // Agency side (automatically filled)
  agency: ContractParty;
  signedBy: string; // Current agent name

  // Counterparty (either the bailleur or the co-agency)
  counterparty: ContractParty;

  // Property (passed in)
  property: {
    reference: string;
    title: string;
    type: string;
    transactionType: string;
    address: string | null;
    city: string;
    zipCode: string;
    district: string | null;
    surfaceTotal: number | null;
    floor: number | null;
    price: number | null;
    rentMonthly: number | null;
    rentYearly: number | null;
    charges: number | null;
    deposit: number | null;
  };

  // Mandate parameters
  mandateKind: "SIMPLE" | "EXCLUSIF" | "CO_MANDAT";
  startDate: string; // ISO yyyy-mm-dd
  endDate: string;   // ISO yyyy-mm-dd
  city: string;      // "Fait à …"

  // Fees (hidden for BAILLEUR)
  feesPercent: string;    // e.g. "8" or "8%"
  feesAmount: string;     // e.g. "25000 €" or free text
  feesPayer: "PRENEUR" | "BAILLEUR" | "ACQUEREUR" | "VENDEUR" | "PARTAGE";
  // Co-mandat split (only meaningful for CO_MANDATAIRE)
  splitUsPct: string;     // "50"
  splitThemPct: string;   // "50"

  // Free-form
  specialConditions: string;
}

const TYPE_LABELS: Record<string, string> = {
  BOUTIQUE: "Boutique", BUREAU: "Bureau", LOCAL_COMMERCIAL: "Local commercial",
  LOCAL_ACTIVITE: "Local d'activité", RESTAURANT: "Restaurant", HOTEL: "Hôtel",
  ENTREPOT: "Entrepôt", PARKING: "Parking", TERRAIN: "Terrain",
  IMMEUBLE: "Immeuble", AUTRE: "Autre",
};

const TX_LABELS: Record<string, string> = {
  VENTE: "Vente", LOCATION: "Location", CESSION_BAIL: "Cession de bail",
  FOND_DE_COMMERCE: "Fonds de commerce",
};

const MANDATE_LABELS: Record<ContractFormData["mandateKind"], string> = {
  SIMPLE: "Mandat simple de commercialisation",
  EXCLUSIF: "Mandat exclusif de commercialisation",
  CO_MANDAT: "Convention de co-mandat",
};

const PAYER_LABELS: Record<ContractFormData["feesPayer"], string> = {
  PRENEUR: "à la charge du preneur",
  BAILLEUR: "à la charge du bailleur",
  ACQUEREUR: "à la charge de l'acquéreur",
  VENDEUR: "à la charge du vendeur",
  PARTAGE: "partagés entre les parties",
};

function joinLines(lines: (string | null | undefined)[]): string {
  return lines.filter(Boolean).join("\n");
}

function partyBlock(p: ContractParty): string {
  const lines: (string | null | undefined)[] = [p.name];
  if (p.legalForm) lines.push(p.legalForm);
  if (p.address || p.city || p.zipCode) {
    lines.push([p.address, [p.zipCode, p.city].filter(Boolean).join(" ")].filter(Boolean).join(" — "));
  }
  if (p.siret) lines.push(`SIRET : ${p.siret}`);
  if (p.professionalCard) lines.push(`Carte professionnelle : ${p.professionalCard}`);
  if (p.representative) lines.push(`Représentée par : ${p.representative}`);
  const contact = [p.phone, p.email].filter(Boolean).join(" · ");
  if (contact) lines.push(contact);
  return joinLines(lines);
}

export async function generateContractPdf(data: ContractFormData): Promise<Blob> {
  const jspdfModule = await import("jspdf");
  const jsPDF = jspdfModule.default;
  const autoTableModule = await import("jspdf-autotable");
  const autoTable = autoTableModule.default;

  const logo = await loadLogoDataUrl(1000);
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  const isBailleur = data.recipientType === "BAILLEUR";

  // ─── Header ───
  doc.setFillColor(...BRAND.softBg);
  doc.rect(0, 0, pageWidth, 32, "F");
  doc.setFillColor(...BRAND.gold);
  doc.rect(0, 32, pageWidth, 0.8, "F");

  if (logo) {
    const logoW = 50;
    const logoH = logoW * (296 / 1708);
    doc.addImage(logo, "PNG", margin, 12, logoW, logoH);
  } else {
    doc.setTextColor(...BRAND.dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(data.agency.name, margin, 20);
  }

  doc.setTextColor(...BRAND.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("CONTRAT D'ENGAGEMENT", pageWidth - margin, 14, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.text);
  doc.text(MANDATE_LABELS[data.mandateKind], pageWidth - margin, 20, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  doc.text(`Réf. bien : ${data.property.reference}`, pageWidth - margin, 26, { align: "right" });
  doc.text(todayFR(), pageWidth - margin, 30, { align: "right" });

  // ─── Title ───
  let y = 48;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...BRAND.text);
  doc.text(MANDATE_LABELS[data.mandateKind].toUpperCase(), pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text(
    isBailleur
      ? "Entre l'Agence et le Bailleur / Propriétaire"
      : "Convention de partenariat entre agences",
    pageWidth / 2,
    y,
    { align: "center" }
  );
  y += 10;

  // ─── Parties ───
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.gold);
  doc.text("ENTRE LES SOUSSIGNÉS", margin, y);
  y += 2;

  const party1Label = "L'AGENCE MANDATAIRE";
  const party2Label = isBailleur
    ? "LE BAILLEUR / PROPRIÉTAIRE"
    : "L'AGENCE CO-MANDATAIRE";

  autoTable(doc, {
    startY: y + 2,
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 4, textColor: BRAND.text, lineColor: BRAND.rule, lineWidth: 0.1, valign: "top" },
    columnStyles: { 0: { cellWidth: contentWidth / 2 }, 1: { cellWidth: contentWidth / 2 } },
    head: [[party1Label, party2Label]],
    headStyles: { fillColor: BRAND.softBg, textColor: BRAND.gold, fontStyle: "bold", fontSize: 8 },
    body: [[partyBlock(data.agency), partyBlock(data.counterparty)]],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 3;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...BRAND.muted);
  doc.text(
    `Ci-après désignées ensemble "les Parties". Agence représentée par ${data.signedBy}.`,
    margin,
    y + 3
  );
  y += 10;

  // ─── Property description ───
  if (y > pageHeight - 80) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.gold);
  doc.text("ARTICLE 1 — DÉSIGNATION DU BIEN", margin, y);
  y += 2;

  const p = data.property;
  const propRows: string[][] = [
    ["Référence", p.reference],
    ["Désignation", p.title],
    ["Type", TYPE_LABELS[p.type] || p.type],
    ["Opération", TX_LABELS[p.transactionType] || p.transactionType],
    ["Adresse", [p.address, [p.zipCode, p.city].filter(Boolean).join(" "), p.district].filter(Boolean).join(" — ")],
  ];
  if (p.surfaceTotal) propRows.push(["Surface", `${p.surfaceTotal} m²`]);
  if (p.floor != null) propRows.push(["Étage", p.floor === 0 ? "RDC" : `${p.floor}e étage`]);
  if (p.transactionType === "LOCATION") {
    if (p.rentMonthly) propRows.push(["Loyer mensuel HC", fmtEUR(p.rentMonthly)]);
    if (p.rentYearly) propRows.push(["Loyer annuel HC", fmtEUR(p.rentYearly)]);
    if (p.charges) propRows.push(["Charges mensuelles", fmtEUR(p.charges)]);
    if (p.deposit) propRows.push(["Dépôt de garantie", fmtEUR(p.deposit)]);
  } else if (p.price) {
    propRows.push(["Prix demandé", fmtEUR(p.price)]);
  }

  autoTable(doc, {
    startY: y + 3,
    theme: "plain",
    body: propRows,
    styles: { fontSize: 9, cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 }, textColor: BRAND.text },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55, textColor: BRAND.muted },
      1: { textColor: BRAND.text },
    },
    alternateRowStyles: { fillColor: BRAND.softBg },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8;

  // ─── Article 2 — Object ───
  if (y > pageHeight - 50) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.gold);
  doc.text("ARTICLE 2 — OBJET DU CONTRAT", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...BRAND.text);
  doc.setLineHeightFactor(1.55);
  const objectText = isBailleur
    ? `Le Bailleur / Propriétaire confie à l'Agence, qui l'accepte, un ${MANDATE_LABELS[data.mandateKind].toLowerCase()} portant sur le bien désigné à l'article 1. L'Agence s'engage à mettre en œuvre tous les moyens professionnels nécessaires à la commercialisation du bien : diffusion, recherche de candidats, qualification, visites, négociation.`
    : `Les deux Agences conviennent d'une ${MANDATE_LABELS[data.mandateKind].toLowerCase()} en vue de la commercialisation conjointe du bien désigné à l'article 1. Elles s'engagent à collaborer loyalement, à partager les informations utiles à la transaction et à se tenir mutuellement informées de toute avancée commerciale.`;
  const objLines = doc.splitTextToSize(objectText, contentWidth);
  objLines.forEach((line: string) => {
    if (y > pageHeight - 25) { doc.addPage(); y = 20; }
    doc.text(line, margin, y);
    y += 5;
  });
  y += 4;

  // ─── Article 3 — Durée ───
  if (y > pageHeight - 40) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.gold);
  doc.text("ARTICLE 3 — DURÉE", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...BRAND.text);
  const durationText = `Le présent contrat prend effet le ${fmtDateFR(data.startDate)} et prendra fin le ${fmtDateFR(data.endDate)}. Passé ce terme, il pourra être renouvelé par accord écrit des Parties.`;
  const durLines = doc.splitTextToSize(durationText, contentWidth);
  durLines.forEach((line: string) => {
    if (y > pageHeight - 25) { doc.addPage(); y = 20; }
    doc.text(line, margin, y);
    y += 5;
  });
  y += 4;

  // ─── Article 4 — Honoraires (CACHÉ pour BAILLEUR) ───
  if (!isBailleur) {
    if (y > pageHeight - 60) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.gold);
    doc.text("ARTICLE 4 — HONORAIRES ET RÉPARTITION", margin, y);
    y += 3;

    const feeRows: string[][] = [];
    if (data.feesPercent.trim()) feeRows.push(["Taux d'honoraires", data.feesPercent.trim()]);
    if (data.feesAmount.trim()) feeRows.push(["Montant des honoraires", data.feesAmount.trim()]);
    feeRows.push(["Partie redevable", PAYER_LABELS[data.feesPayer]]);
    if (data.mandateKind === "CO_MANDAT" || data.recipientType === "CO_MANDATAIRE") {
      feeRows.push(["Quote-part Agence mandataire", `${data.splitUsPct.replace(/[^\d.,]/g, "") || "50"} %`]);
      feeRows.push(["Quote-part Agence co-mandataire", `${data.splitThemPct.replace(/[^\d.,]/g, "") || "50"} %`]);
    }

    autoTable(doc, {
      startY: y + 3,
      theme: "plain",
      body: feeRows,
      styles: { fontSize: 9, cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 }, textColor: BRAND.text },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 70, textColor: BRAND.muted },
        1: { fontStyle: "bold", textColor: BRAND.text },
      },
      alternateRowStyles: { fillColor: BRAND.softBg },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 4;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND.muted);
    const feeNote = "Les honoraires ne sont dus qu'en cas de réalisation effective de l'opération. La présente répartition est strictement confidentielle entre les Agences signataires et ne sera pas communiquée au bailleur / propriétaire ni au preneur / acquéreur.";
    const feeNoteLines = doc.splitTextToSize(feeNote, contentWidth);
    feeNoteLines.forEach((l: string) => { doc.text(l, margin, y); y += 4; });
    y += 4;
  }

  // ─── Article suivant — Engagements ───
  const commitArtNum = isBailleur ? 4 : 5;
  if (y > pageHeight - 60) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.gold);
  doc.text(`ARTICLE ${commitArtNum} — ENGAGEMENTS DES PARTIES`, margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...BRAND.text);
  const commitText = isBailleur
    ? "Le Bailleur / Propriétaire s'engage à fournir toutes les informations et documents utiles à la commercialisation, à informer l'Agence de toute offre reçue et à ne pas entraver son action. L'Agence s'engage à agir dans le strict respect de la déontologie professionnelle, à rendre compte de sa mission et à préserver la confidentialité des informations reçues."
    : "Chaque Agence s'engage à respecter la présente convention, à collaborer loyalement, à informer l'autre partie de toute piste qualifiée et à ne pas contourner l'autre partie dans la transaction. Toute contrepartie commerciale devra être portée à la connaissance de l'autre Agence.";
  const commitLines = doc.splitTextToSize(commitText, contentWidth);
  commitLines.forEach((line: string) => {
    if (y > pageHeight - 25) { doc.addPage(); y = 20; }
    doc.text(line, margin, y);
    y += 5;
  });
  y += 4;

  // ─── Conditions particulières ───
  if (data.specialConditions.trim()) {
    const specArtNum = commitArtNum + 1;
    if (y > pageHeight - 40) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.gold);
    doc.text(`ARTICLE ${specArtNum} — CONDITIONS PARTICULIÈRES`, margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...BRAND.text);
    const specLines = doc.splitTextToSize(data.specialConditions.trim(), contentWidth);
    specLines.forEach((line: string) => {
      if (y > pageHeight - 25) { doc.addPage(); y = 20; }
      doc.text(line, margin, y);
      y += 5;
    });
    y += 4;
  }

  // ─── Signatures ───
  const neededSpace = 55;
  if (y > pageHeight - neededSpace) { doc.addPage(); y = 20; }
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.gold);
  doc.text("SIGNATURES", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...BRAND.text);
  doc.text(`Fait à ${data.city || "Paris"}, le ${todayFR()}, en deux exemplaires originaux.`, margin, y);
  y += 10;

  const boxW = (contentWidth - 8) / 2;
  const boxH = 38;
  // Left box — Agency
  doc.setDrawColor(...BRAND.rule);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, boxW, boxH, 2, 2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.gold);
  doc.text("POUR L'AGENCE MANDATAIRE", margin + 3, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.text);
  doc.text(data.signedBy, margin + 3, y + 12);
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  doc.text(data.agency.name, margin + 3, y + 17);
  doc.setFontSize(7.5);
  doc.text('Précédé de la mention "Lu et approuvé"', margin + 3, y + boxH - 3);

  // Right box — Counterparty
  const rx = margin + boxW + 8;
  doc.roundedRect(rx, y, boxW, boxH, 2, 2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.gold);
  doc.text(`POUR ${isBailleur ? "LE BAILLEUR / PROPRIÉTAIRE" : "L'AGENCE CO-MANDATAIRE"}`, rx + 3, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.text);
  doc.text(data.counterparty.representative || data.counterparty.name, rx + 3, y + 12);
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  if (data.counterparty.representative) doc.text(data.counterparty.name, rx + 3, y + 17);
  doc.setFontSize(7.5);
  doc.text('Précédé de la mention "Lu et approuvé"', rx + 3, y + boxH - 3);

  // ─── Footer ───
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BRAND.gold);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.text);
    doc.text(data.agency.name, margin, pageHeight - 15);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.muted);
    const bits: string[] = [];
    if (data.agency.address || data.agency.city) {
      bits.push([data.agency.address, [data.agency.zipCode, data.agency.city].filter(Boolean).join(" ")].filter(Boolean).join(" · "));
    }
    if (data.agency.phone) bits.push(data.agency.phone);
    if (data.agency.email) bits.push(data.agency.email);
    if (data.agency.siret) bits.push(`SIRET ${data.agency.siret}`);
    if (data.agency.professionalCard) bits.push(`Carte pro ${data.agency.professionalCard}`);
    let fy = pageHeight - 11;
    bits.forEach((b) => { doc.text(b, margin, fy); fy += 3.2; });

    doc.setTextColor(...BRAND.muted);
    doc.setFontSize(7.5);
    doc.text(`Page ${i}/${pageCount}`, pageWidth - margin, pageHeight - 15, { align: "right" });
    doc.text(
      isBailleur ? "Exemplaire bailleur" : "Exemplaire inter-agences — confidentiel",
      pageWidth - margin,
      pageHeight - 11,
      { align: "right" }
    );
  }

  return doc.output("blob");
}

export function contractFileName(data: ContractFormData): string {
  const suffix = data.recipientType === "BAILLEUR" ? "Bailleur" : "CoMandat";
  return `Contrat-${suffix}-${data.property.reference}.pdf`;
}
