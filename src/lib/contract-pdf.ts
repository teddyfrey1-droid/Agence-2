"use client";

import { BRAND, loadLogoDataUrl, fmtEUR, fmtDateFR, todayFR } from "@/lib/pdf-helpers";

export type PartyRole = "AGENCE" | "CO_MANDATAIRE" | "PRENEUR" | "BAILLEUR";
export type ContractRecipientType = PartyRole;

export interface ContractParty {
  role: PartyRole;
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
  /** Data URL (PNG/JPG) of a captured signature, if the party has already signed. */
  signatureDataUrl?: string | null;
  signedAt?: string | null; // ISO date
  signedCity?: string | null;
}

export interface NegotiationTerms {
  /** Loyer négocié (locations) — texte libre ("35 000 € HT HC/an", etc.) */
  proposedRent: string;
  /** Prix négocié (ventes / cessions) */
  proposedPrice: string;
  /** Franchise de loyer, ex: "3 mois" */
  freeRent: string;
  /** Travaux à charge du bailleur */
  worksByLandlord: string;
  /** Travaux à charge du preneur */
  worksByTenant: string;
  /** Dépôt de garantie négocié */
  deposit: string;
  /** Durée du bail, ex: "9 ans (3/6/9)" */
  leaseDuration: string;
  /** Date d'entrée en jouissance (ISO yyyy-mm-dd) */
  entryDate: string;
  /** Autres clauses */
  clauses: string;
}

export interface ContractFormData {
  recipientType: ContractRecipientType;
  /** Ordered list of parties. AGENCE is usually first. Up to 4 parties. */
  parties: ContractParty[];
  signedBy: string; // current agent full name

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

  mandateKind: "SIMPLE" | "EXCLUSIF" | "CO_MANDAT" | "ENGAGEMENT_LOCATION" | "ENGAGEMENT_VENTE";
  startDate: string; // ISO
  endDate: string;   // ISO
  city: string;      // lieu de signature

  // Honoraires — jamais affichés aux rôles PRENEUR, BAILLEUR, AGENCE (internal-copy-not-for-principal)
  feesPercent: string;
  feesAmount: string;
  feesPayer: "PRENEUR" | "BAILLEUR" | "ACQUEREUR" | "VENDEUR" | "PARTAGE";
  splitUsPct: string;
  splitThemPct: string;

  negotiation: NegotiationTerms;

  /** Document title override (eg. "Feuille d'engagement"). */
  title?: string;
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
  ENGAGEMENT_LOCATION: "Feuille d'engagement — Location",
  ENGAGEMENT_VENTE: "Feuille d'engagement — Vente",
};

const ROLE_LABELS: Record<PartyRole, string> = {
  AGENCE: "L'AGENCE MANDATAIRE",
  CO_MANDATAIRE: "L'AGENCE CO-MANDATAIRE",
  PRENEUR: "LE PRENEUR",
  BAILLEUR: "LE BAILLEUR",
};

const ROLE_LABELS_SHORT: Record<PartyRole, string> = {
  AGENCE: "Agence",
  CO_MANDATAIRE: "Co-mandataire",
  PRENEUR: "Preneur",
  BAILLEUR: "Bailleur",
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

/** Honoraires doivent rester invisibles pour ces rôles. */
function feesHiddenFor(role: ContractRecipientType): boolean {
  return role === "PRENEUR" || role === "BAILLEUR" || role === "AGENCE";
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

  const agency = data.parties.find((p) => p.role === "AGENCE");
  const docTitle = (data.title && data.title.trim()) || MANDATE_LABELS[data.mandateKind];
  const recipientPartyLabel = data.parties.find((p) => p.role === data.recipientType)?.name || "";

  // ─── Header ───
  doc.setFillColor(...BRAND.softBg);
  doc.rect(0, 0, pageWidth, 32, "F");
  doc.setFillColor(...BRAND.gold);
  doc.rect(0, 32, pageWidth, 0.8, "F");

  if (logo) {
    const logoW = 50;
    const logoH = logoW * (296 / 1708);
    doc.addImage(logo, "PNG", margin, 12, logoW, logoH);
  } else if (agency) {
    doc.setTextColor(...BRAND.dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(agency.name, margin, 20);
  }

  doc.setTextColor(...BRAND.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("DOCUMENT CONTRACTUEL", pageWidth - margin, 14, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.text);
  doc.text(docTitle, pageWidth - margin, 20, { align: "right" });
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
  doc.text(docTitle.toUpperCase(), pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  const nbParties = data.parties.length;
  const subtitle =
    nbParties <= 2 ? "Entre les deux parties désignées ci-dessous"
    : nbParties === 3 ? "Convention tripartite entre les parties désignées ci-dessous"
    : "Convention multipartite entre les parties désignées ci-dessous";
  doc.text(subtitle, pageWidth / 2, y, { align: "center" });
  y += 10;

  // ─── Parties table ───
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.gold);
  doc.text("ENTRE LES SOUSSIGNÉS", margin, y);
  y += 2;

  // Render parties as stacked boxes (one per party) — more readable than a wide grid.
  const box = {
    labelH: 5,
    padding: 3,
    minH: 20,
  };
  data.parties.forEach((p) => {
    if (y > pageHeight - 50) { doc.addPage(); y = 20; }
    const block = partyBlock(p);
    const lines = doc.splitTextToSize(block, contentWidth - box.padding * 2 - 42);
    const blockH = Math.max(box.minH, box.labelH + 3 + lines.length * 3.8 + box.padding);
    // Label strip
    doc.setFillColor(...BRAND.softBg);
    doc.roundedRect(margin, y + 2, contentWidth, blockH, 1.8, 1.8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.gold);
    doc.text(ROLE_LABELS[p.role], margin + box.padding, y + 2 + box.labelH + 0.8);
    // Body
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.text);
    let ty = y + 2 + box.labelH + 4;
    lines.forEach((l: string) => { doc.text(l, margin + box.padding, ty); ty += 3.8; });
    // Signature badge on right if signed
    if (p.signatureDataUrl) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(16, 128, 80);
      doc.text(
        `Signé${p.signedCity ? ` à ${p.signedCity}` : ""}${p.signedAt ? ` le ${fmtDateFR(p.signedAt)}` : ""}`,
        margin + contentWidth - box.padding,
        y + 2 + box.labelH + 0.8,
        { align: "right" }
      );
    }
    y += blockH + 3;
  });
  y += 2;

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...BRAND.muted);
  doc.text(
    `Ci-après désignées ensemble "les Parties". Agence représentée par ${data.signedBy}.`,
    margin,
    y + 3
  );
  y += 10;

  // ─── Article 1 — Property ───
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
    if (p.rentMonthly) propRows.push(["Loyer mensuel HC (demande initiale)", fmtEUR(p.rentMonthly)]);
    if (p.rentYearly) propRows.push(["Loyer annuel HC (demande initiale)", fmtEUR(p.rentYearly)]);
    if (p.charges) propRows.push(["Charges mensuelles", fmtEUR(p.charges)]);
    if (p.deposit) propRows.push(["Dépôt de garantie (demande initiale)", fmtEUR(p.deposit)]);
  } else if (p.price) {
    propRows.push(["Prix (demande initiale)", fmtEUR(p.price)]);
  }

  autoTable(doc, {
    startY: y + 3,
    theme: "plain",
    body: propRows,
    styles: { fontSize: 9, cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 }, textColor: BRAND.text },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 70, textColor: BRAND.muted },
      1: { textColor: BRAND.text },
    },
    alternateRowStyles: { fillColor: BRAND.softBg },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8;

  // ─── Article 2 — Object ───
  const isEngagement = data.mandateKind === "ENGAGEMENT_LOCATION" || data.mandateKind === "ENGAGEMENT_VENTE";
  if (y > pageHeight - 50) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.gold);
  doc.text("ARTICLE 2 — OBJET", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...BRAND.text);
  doc.setLineHeightFactor(1.55);

  const roleList = data.parties.map((pa) => ROLE_LABELS_SHORT[pa.role]).join(", ");
  const objectText = isEngagement
    ? `Les Parties (${roleList}) arrêtent, dans le cadre d'une négociation commerciale, les conditions d'engagement réciproques décrites ci-après pour la ${data.mandateKind === "ENGAGEMENT_LOCATION" ? "prise à bail" : "cession / acquisition"} du bien désigné à l'article 1. Le présent document vaut engagement des Parties sous réserve de la signature du bail définitif (resp. de l'acte authentique).`
    : data.mandateKind === "CO_MANDAT"
      ? `Les Parties conviennent d'une ${MANDATE_LABELS[data.mandateKind].toLowerCase()} en vue de la commercialisation conjointe du bien désigné à l'article 1. Elles s'engagent à collaborer loyalement, à partager les informations utiles à la transaction et à se tenir mutuellement informées de toute avancée commerciale.`
      : `Le Bailleur / Propriétaire confie à l'Agence, qui l'accepte, un ${MANDATE_LABELS[data.mandateKind].toLowerCase()} portant sur le bien désigné à l'article 1. L'Agence s'engage à mettre en œuvre tous les moyens professionnels nécessaires à la commercialisation du bien : diffusion, recherche de candidats, qualification, visites, négociation.`;
  const objLines = doc.splitTextToSize(objectText, contentWidth);
  objLines.forEach((line: string) => {
    if (y > pageHeight - 25) { doc.addPage(); y = 20; }
    doc.text(line, margin, y);
    y += 5;
  });
  y += 4;

  // ─── Article 3 — Conditions négociées (visible seulement si au moins un champ est rempli) ───
  const n = data.negotiation;
  const negoRows: string[][] = [];
  if (n.proposedRent.trim()) negoRows.push(["Loyer proposé", n.proposedRent.trim()]);
  if (n.proposedPrice.trim()) negoRows.push(["Prix proposé", n.proposedPrice.trim()]);
  if (n.freeRent.trim()) negoRows.push(["Franchise de loyer", n.freeRent.trim()]);
  if (n.deposit.trim()) negoRows.push(["Dépôt de garantie", n.deposit.trim()]);
  if (n.leaseDuration.trim()) negoRows.push(["Durée du bail", n.leaseDuration.trim()]);
  if (n.entryDate) negoRows.push(["Date d'entrée en jouissance", fmtDateFR(n.entryDate)]);
  if (n.worksByLandlord.trim()) negoRows.push(["Travaux à charge du bailleur", n.worksByLandlord.trim()]);
  if (n.worksByTenant.trim()) negoRows.push(["Travaux à charge du preneur", n.worksByTenant.trim()]);

  let articleNum = 3;
  if (negoRows.length > 0) {
    if (y > pageHeight - 60) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.gold);
    doc.text(`ARTICLE ${articleNum} — CONDITIONS NÉGOCIÉES`, margin, y);
    y += 3;
    autoTable(doc, {
      startY: y + 2,
      theme: "plain",
      body: negoRows,
      styles: { fontSize: 9, cellPadding: { top: 2.8, bottom: 2.8, left: 4, right: 4 }, textColor: BRAND.text },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 70, textColor: BRAND.muted },
        1: { fontStyle: "bold", textColor: BRAND.text },
      },
      alternateRowStyles: { fillColor: BRAND.softBg },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 6;
    articleNum += 1;
  }

  // ─── Article suivant — Durée ───
  if (y > pageHeight - 40) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.gold);
  doc.text(`ARTICLE ${articleNum} — DURÉE DE L'ENGAGEMENT`, margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...BRAND.text);
  const durationText = isEngagement
    ? `Le présent engagement prend effet le ${fmtDateFR(data.startDate)} et devient caduc s'il n'est pas transformé en bail définitif (resp. en acte authentique) au plus tard le ${fmtDateFR(data.endDate)}, sauf prorogation écrite des Parties.`
    : `Le présent contrat prend effet le ${fmtDateFR(data.startDate)} et prendra fin le ${fmtDateFR(data.endDate)}. Passé ce terme, il pourra être renouvelé par accord écrit des Parties.`;
  const durLines = doc.splitTextToSize(durationText, contentWidth);
  durLines.forEach((line: string) => {
    if (y > pageHeight - 25) { doc.addPage(); y = 20; }
    doc.text(line, margin, y);
    y += 5;
  });
  y += 4;
  articleNum += 1;

  // ─── Article — Honoraires (HIDDEN pour PRENEUR, BAILLEUR, AGENCE) ───
  const showFees = !feesHiddenFor(data.recipientType);
  if (showFees) {
    if (y > pageHeight - 60) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.gold);
    doc.text(`ARTICLE ${articleNum} — HONORAIRES ET RÉPARTITION`, margin, y);
    y += 3;

    const feeRows: string[][] = [];
    if (data.feesPercent.trim()) feeRows.push(["Taux d'honoraires", data.feesPercent.trim()]);
    if (data.feesAmount.trim()) feeRows.push(["Montant des honoraires", data.feesAmount.trim()]);
    feeRows.push(["Partie redevable", PAYER_LABELS[data.feesPayer]]);
    if (data.parties.some((pa) => pa.role === "CO_MANDATAIRE")) {
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
    const feeNote = "Les honoraires ne sont dus qu'en cas de réalisation effective de l'opération. La présente répartition est strictement confidentielle entre les Agences signataires et ne sera communiquée ni au bailleur / propriétaire, ni au preneur / acquéreur.";
    const feeNoteLines = doc.splitTextToSize(feeNote, contentWidth);
    feeNoteLines.forEach((l: string) => { doc.text(l, margin, y); y += 4; });
    y += 4;
    articleNum += 1;
  }

  // ─── Article — Engagements ───
  if (y > pageHeight - 60) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.gold);
  doc.text(`ARTICLE ${articleNum} — ENGAGEMENTS DES PARTIES`, margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...BRAND.text);
  const commitText = isEngagement
    ? "Chaque Partie s'engage à respecter de bonne foi les conditions arrêtées ci-dessus et à concourir à la régularisation du bail définitif (resp. de l'acte authentique). Toute modification substantielle des conditions devra faire l'objet d'un avenant signé par l'ensemble des Parties."
    : data.mandateKind === "CO_MANDAT"
      ? "Chaque Agence s'engage à respecter la présente convention, à collaborer loyalement, à informer l'autre partie de toute piste qualifiée et à ne pas contourner l'autre partie dans la transaction. Toute contrepartie commerciale devra être portée à la connaissance de l'autre Agence."
      : "Le Bailleur / Propriétaire s'engage à fournir toutes les informations et documents utiles à la commercialisation, à informer l'Agence de toute offre reçue et à ne pas entraver son action. L'Agence s'engage à agir dans le strict respect de la déontologie professionnelle, à rendre compte de sa mission et à préserver la confidentialité des informations reçues.";
  const commitLines = doc.splitTextToSize(commitText, contentWidth);
  commitLines.forEach((line: string) => {
    if (y > pageHeight - 25) { doc.addPage(); y = 20; }
    doc.text(line, margin, y);
    y += 5;
  });
  y += 4;
  articleNum += 1;

  // ─── Clauses particulières ───
  if (n.clauses.trim()) {
    if (y > pageHeight - 40) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.gold);
    doc.text(`ARTICLE ${articleNum} — CLAUSES PARTICULIÈRES`, margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...BRAND.text);
    const specLines = doc.splitTextToSize(n.clauses.trim(), contentWidth);
    specLines.forEach((line: string) => {
      if (y > pageHeight - 25) { doc.addPage(); y = 20; }
      doc.text(line, margin, y);
      y += 5;
    });
    y += 4;
  }

  // ─── Signatures ───
  const nbSigs = data.parties.length;
  const perRow = nbSigs <= 2 ? 2 : nbSigs === 3 ? 3 : 2;
  const nbRows = Math.ceil(nbSigs / perRow);
  const boxW = (contentWidth - (perRow - 1) * 6) / perRow;
  const boxH = 48;
  const neededSpace = 20 + nbRows * (boxH + 6);
  if (y > pageHeight - neededSpace) { doc.addPage(); y = 20; }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.gold);
  doc.text("SIGNATURES", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...BRAND.text);
  doc.text(
    `Fait à ${data.city || "Paris"}, le ${todayFR()}, en ${nbSigs} exemplaires originaux.`,
    margin,
    y
  );
  y += 8;

  data.parties.forEach((p, idx) => {
    const col = idx % perRow;
    const row = Math.floor(idx / perRow);
    const bx = margin + col * (boxW + 6);
    const by = y + row * (boxH + 6);

    doc.setDrawColor(...BRAND.rule);
    doc.setLineWidth(0.3);
    doc.roundedRect(bx, by, boxW, boxH, 2, 2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.gold);
    doc.text(`POUR ${ROLE_LABELS[p.role]}`, bx + 3, by + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.text);
    const nameLine = p.representative || p.name;
    doc.text(nameLine, bx + 3, by + 11);
    if (p.representative && p.name && p.representative !== p.name) {
      doc.setFontSize(8);
      doc.setTextColor(...BRAND.muted);
      doc.text(p.name, bx + 3, by + 15);
    }

    // Signature image (if captured)
    if (p.signatureDataUrl) {
      try {
        const imgY = by + 18;
        const imgH = boxH - 26;
        const imgW = boxW - 6;
        doc.addImage(p.signatureDataUrl, bx + 3, imgY, imgW, imgH, undefined, "FAST");
      } catch {
        // fallback: show text
      }
    }

    // Footer line
    doc.setFontSize(7);
    doc.setTextColor(...BRAND.muted);
    if (p.signatureDataUrl && p.signedAt) {
      doc.text(
        `Signé${p.signedCity ? ` à ${p.signedCity}` : ""} le ${fmtDateFR(p.signedAt)}`,
        bx + 3,
        by + boxH - 3
      );
    } else {
      doc.text('Précédé de la mention "Lu et approuvé" · Date :', bx + 3, by + boxH - 3);
    }
  });

  y += nbRows * (boxH + 6);

  // ─── Footer on each page ───
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BRAND.gold);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.text);
    doc.text(agency?.name || "Retail Avenue", margin, pageHeight - 15);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.muted);
    const bits: string[] = [];
    if (agency) {
      if (agency.address || agency.city) {
        bits.push([agency.address, [agency.zipCode, agency.city].filter(Boolean).join(" ")].filter(Boolean).join(" · "));
      }
      if (agency.phone) bits.push(agency.phone);
      if (agency.email) bits.push(agency.email);
      if (agency.siret) bits.push(`SIRET ${agency.siret}`);
      if (agency.professionalCard) bits.push(`Carte pro ${agency.professionalCard}`);
    }
    let fy = pageHeight - 11;
    bits.forEach((b) => { doc.text(b, margin, fy); fy += 3.2; });

    doc.setTextColor(...BRAND.muted);
    doc.setFontSize(7.5);
    doc.text(`Page ${i}/${pageCount}`, pageWidth - margin, pageHeight - 15, { align: "right" });
    const copyLabel =
      data.recipientType === "CO_MANDATAIRE"
        ? "Exemplaire inter-agences — honoraires confidentiels"
        : `Exemplaire pour ${ROLE_LABELS_SHORT[data.recipientType]}${recipientPartyLabel ? ` — ${recipientPartyLabel}` : ""}`;
    doc.text(copyLabel, pageWidth - margin, pageHeight - 11, { align: "right" });
  }

  return doc.output("blob");
}

export function contractFileName(data: ContractFormData): string {
  const map: Record<PartyRole, string> = {
    AGENCE: "Interne",
    CO_MANDATAIRE: "CoMandat",
    PRENEUR: "Preneur",
    BAILLEUR: "Bailleur",
  };
  return `Engagement-${map[data.recipientType]}-${data.property.reference}.pdf`;
}
