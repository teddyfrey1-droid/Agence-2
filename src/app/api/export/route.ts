import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { hasMinimumRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

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

function csvResponse(csv: string, filename: string): NextResponse {
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const type = request.nextUrl.searchParams.get("type");

    // Only users with MANAGER+ role can export (prevents AGENT/ASSISTANT/CLIENT from bulk export)
    const canExportAll = hasMinimumRole(session.role, "MANAGER");

    if (type === "contacts") {
      if (!hasPermission(session.role, "contact", "export")) {
        return NextResponse.json({ error: "Permission refusée. L'export nécessite le droit 'export' sur les contacts." }, { status: 403 });
      }

      // Non-managers only see contacts linked to their own search requests or deals
      const where: Prisma.ContactWhereInput = canExportAll
        ? {}
        : {
            OR: [
              { searchRequests: { some: { assignedToId: session.userId } } },
              { deals: { some: { assignedToId: session.userId } } },
              { interactions: { some: { userId: session.userId } } },
            ],
          };

      const contacts = await prisma.contact.findMany({
        where,
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
      return csvResponse(csv, "contacts");
    }

    if (type === "properties") {
      if (!hasPermission(session.role, "property", "export")) {
        return NextResponse.json({ error: "Permission refusée. L'export nécessite le droit 'export' sur les biens." }, { status: 403 });
      }

      // Non-managers only see their assigned properties, never confidential ones
      const where: Prisma.PropertyWhereInput = canExportAll
        ? {}
        : {
            AND: [
              { assignedToId: session.userId },
              { confidentiality: { not: "CONFIDENTIEL" } },
            ],
          };

      const properties = await prisma.property.findMany({
        where,
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
      return csvResponse(csv, "biens");
    }

    if (type === "deals") {
      if (!hasPermission(session.role, "deal", "export")) {
        return NextResponse.json({ error: "Permission refusée. L'export nécessite le droit 'export' sur les dossiers." }, { status: 403 });
      }

      // Non-managers only see deals they're assigned to, found, or closed
      const where: Prisma.DealWhereInput = canExportAll
        ? {}
        : {
            OR: [
              { assignedToId: session.userId },
              { propertyFoundById: session.userId },
              { dealClosedById: session.userId },
            ],
          };

      const deals = await prisma.deal.findMany({
        where,
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
      return csvResponse(csv, "dossiers");
    }

    return NextResponse.json({ error: "Type d'export invalide. Utilisez: contacts, properties, deals" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
