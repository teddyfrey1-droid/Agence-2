import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

function escapeCsv(val: string | number | null | undefined): string {
  if (val == null) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const bom = "\uFEFF"; // UTF-8 BOM for Excel compatibility
  const headerLine = headers.map(escapeCsv).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsv).join(","));
  return bom + [headerLine, ...dataLines].join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const type = request.nextUrl.searchParams.get("type");

    if (type === "contacts") {
      if (!hasPermission(session.role, "contact", "read")) {
        return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
      }
      const contacts = await prisma.contact.findMany({
        orderBy: { createdAt: "desc" },
      });
      const csv = toCsv(
        ["Prénom", "Nom", "Email", "Téléphone", "Mobile", "Type", "Société", "Poste", "Source", "Ville", "Créé le"],
        contacts.map((c) => [
          c.firstName, c.lastName, c.email, c.phone, c.mobile,
          c.type, c.company, c.position, c.source, c.city,
          c.createdAt.toISOString().split("T")[0],
        ])
      );
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="contacts_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    if (type === "properties") {
      if (!hasPermission(session.role, "property", "read")) {
        return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
      }
      const properties = await prisma.property.findMany({
        orderBy: { createdAt: "desc" },
      });
      const csv = toCsv(
        ["Référence", "Titre", "Type", "Transaction", "Statut", "Adresse", "Ville", "Arrondissement", "Surface (m²)", "Prix (€)", "Loyer (€/mois)", "Charges (€/mois)", "Créé le"],
        properties.map((p) => [
          p.reference, p.title, p.type, p.transactionType, p.status,
          p.address, p.city, p.district, p.surfaceTotal, p.price,
          p.rentMonthly, p.charges,
          p.createdAt.toISOString().split("T")[0],
        ])
      );
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="biens_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    if (type === "deals") {
      if (!hasPermission(session.role, "deal", "read")) {
        return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
      }
      const deals = await prisma.deal.findMany({
        include: {
          property: { select: { title: true, reference: true } },
          contact: { select: { firstName: true, lastName: true } },
          assignedTo: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      const csv = toCsv(
        ["Référence", "Titre", "Étape", "Statut", "Valeur estimée (€)", "Commission (€)", "Bien", "Contact", "Assigné à", "Créé le"],
        deals.map((d) => [
          d.reference, d.title, d.stage, d.status, d.estimatedValue,
          d.commission,
          d.property ? `${d.property.reference} - ${d.property.title}` : "",
          d.contact ? `${d.contact.firstName} ${d.contact.lastName}` : "",
          d.assignedTo ? `${d.assignedTo.firstName} ${d.assignedTo.lastName}` : "",
          d.createdAt.toISOString().split("T")[0],
        ])
      );
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="dossiers_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: "Type d'export invalide. Utilisez: contacts, properties, deals" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
