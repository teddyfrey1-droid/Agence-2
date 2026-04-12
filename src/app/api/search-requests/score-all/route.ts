import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Pre-validated query shape so TypeScript can derive a concrete payload type
// for the paginated batches below without having to unify two findMany call
// sites through a ternary.
const searchRequestScoreInclude = Prisma.validator<Prisma.SearchRequestInclude>()({
  contact: { select: { company: true, phone: true, mobile: true, email: true } },
  matches: { select: { id: true }, take: 1 },
  interactions: { select: { id: true }, take: 10 },
});

type SearchRequestForScoring = Prisma.SearchRequestGetPayload<{
  include: typeof searchRequestScoreInclude;
}>;

function calculateQualificationScore(searchRequest: {
  budgetMin: number | null;
  budgetMax: number | null;
  surfaceMin: number | null;
  surfaceMax: number | null;
  districts: string[];
  activity: string | null;
  description: string | null;
  notes: string | null;
  propertyTypes: string[];
  contact: {
    company: string | null;
    phone: string | null;
    mobile: string | null;
    email: string | null;
  } | null;
  matches: { id: string }[];
  interactions: { id: string }[];
}): number {
  let score = 0;
  if (searchRequest.budgetMin || searchRequest.budgetMax) score += 15;
  if (searchRequest.surfaceMin || searchRequest.surfaceMax) score += 10;
  if (searchRequest.districts.length > 0) score += 15;
  if (searchRequest.activity) score += 10;
  if (searchRequest.propertyTypes.length > 0) score += Math.min(searchRequest.propertyTypes.length * 3, 10);
  if (searchRequest.contact) {
    if (searchRequest.contact.company) score += 5;
    if (searchRequest.contact.phone || searchRequest.contact.mobile) score += 10;
    if (searchRequest.contact.email) score += 5;
  }
  if (searchRequest.description || searchRequest.notes) score += 5;
  if (searchRequest.matches.length > 0) score += 5;
  if (searchRequest.interactions.length > 0) score += Math.min(searchRequest.interactions.length * 2, 10);
  return Math.min(score, 100);
}

const DEFAULT_BATCH_SIZE = 100;
const MAX_BATCH_SIZE = 500;

export async function POST(request: NextRequest) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!hasPermission(session.role, "search_request", "update")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    // Optional pagination — loop over pages until done (or client-specified slice).
    const body = await request.json().catch(() => ({}));
    const rawBatch = Number(body?.batchSize);
    const batchSize = Number.isFinite(rawBatch)
      ? Math.min(Math.max(rawBatch, 1), MAX_BATCH_SIZE)
      : DEFAULT_BATCH_SIZE;

    const totalCount = await prisma.searchRequest.count({
      where: { status: { in: ["NOUVELLE", "QUALIFIEE", "EN_COURS"] } },
    });

    let updated = 0;
    let cursor: string | undefined = undefined;

    while (true) {
      const batch: SearchRequestForScoring[] = await prisma.searchRequest.findMany({
        where: { status: { in: ["NOUVELLE", "QUALIFIEE", "EN_COURS"] } },
        include: searchRequestScoreInclude,
        orderBy: { id: "asc" },
        take: batchSize,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });

      if (batch.length === 0) break;

      // Batch the updates in a single transaction per page
      await prisma.$transaction(
        batch.map((sr) =>
          prisma.searchRequest.update({
            where: { id: sr.id },
            data: { qualificationScore: calculateQualificationScore(sr) },
          })
        )
      );

      updated += batch.length;
      cursor = batch[batch.length - 1].id;

      if (batch.length < batchSize) break;
    }

    return NextResponse.json({ updated, total: totalCount });
  } catch (err) {
    console.error("[score-all] error:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
