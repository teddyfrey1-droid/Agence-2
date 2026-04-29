import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { hasMinimumRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

function escapeCsv(val: string | number | Date | null | undefined): string {
  if (val == null) return "";
  const str = val instanceof Date ? val.toISOString().split("T")[0] : String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvLine(row: (string | number | Date | null | undefined)[]): string {
  return row.map(escapeCsv).join(",");
}

const BATCH_SIZE = 1000;
const MAX_ROWS = 50_000;

function csvHeaders(filename: string): HeadersInit {
  return {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}_${new Date().toISOString().split("T")[0]}.csv"`,
    "Cache-Control": "no-store",
  };
}

/**
 * Stream CSV in batches to avoid loading the full dataset in memory.
 * Each batch is fetched with a (skip, take) cursor and serialised to bytes
 * before yielding the next batch.
 */
function streamCsv<T>(
  filename: string,
  headerRow: string[],
  fetchBatch: (skip: number, take: number) => Promise<T[]>,
  rowMapper: (row: T) => (string | number | Date | null | undefined)[]
): NextResponse {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // UTF-8 BOM for Excel compatibility + header line
        controller.enqueue(encoder.encode("﻿" + toCsvLine(headerRow) + "\n"));
        let skip = 0;
        while (skip < MAX_ROWS) {
          const batch = await fetchBatch(skip, BATCH_SIZE);
          if (batch.length === 0) break;
          const chunk = batch.map((r) => toCsvLine(rowMapper(r))).join("\n") + "\n";
          controller.enqueue(encoder.encode(chunk));
          if (batch.length < BATCH_SIZE) break;
          skip += BATCH_SIZE;
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new NextResponse(stream, { headers: csvHeaders(filename) });
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

      return streamCsv(
        "contacts",
        ["Prénom", "Nom", "Email", "Téléphone", "Mobile", "Type", "Société", "Poste", "Source", "Ville", "Créé le"],
        (skip, take) =>
          prisma.contact.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
          }),
        (c) => [
          c.firstName, c.lastName, c.email, c.phone, c.mobile,
          c.type, c.company, c.position, c.source, c.city,
          c.createdAt,
        ]
      );
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

      return streamCsv(
        "biens",
        ["Référence", "Titre", "Type", "Transaction", "Statut", "Adresse", "Ville", "Arrondissement", "Surface (m²)", "Prix (€)", "Loyer (€/mois)", "Charges (€/mois)", "Créé le"],
        (skip, take) =>
          prisma.property.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
          }),
        (p) => [
          p.reference, p.title, p.type, p.transactionType, p.status,
          p.address, p.city, p.district, p.surfaceTotal, p.price,
          p.rentMonthly, p.charges,
          p.createdAt,
        ]
      );
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

      return streamCsv(
        "dossiers",
        ["Référence", "Titre", "Étape", "Statut", "Valeur estimée (€)", "Commission (€)", "Bien", "Contact", "Assigné à", "Créé le"],
        (skip, take) =>
          prisma.deal.findMany({
            where,
            include: {
              property: { select: { title: true, reference: true } },
              contact: { select: { firstName: true, lastName: true } },
              assignedTo: { select: { firstName: true, lastName: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take,
          }),
        (d) => [
          d.reference, d.title, d.stage, d.status, d.estimatedValue,
          d.commission,
          d.property ? `${d.property.reference} - ${d.property.title}` : "",
          d.contact ? `${d.contact.firstName} ${d.contact.lastName}` : "",
          d.assignedTo ? `${d.assignedTo.firstName} ${d.assignedTo.lastName}` : "",
          d.createdAt,
        ]
      );
    }

    return NextResponse.json({ error: "Type d'export invalide. Utilisez: contacts, properties, deals" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
