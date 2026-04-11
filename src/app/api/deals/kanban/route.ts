import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { Prisma, DealStage } from "@prisma/client";

/**
 * Kanban view of active deals, grouped by stage.
 *
 * We cap the number of cards per stage to keep the payload bounded — a healthy
 * pipeline can have hundreds of deals, which used to be fetched in one go and
 * rendered client-side. The default limit per stage is 50, controllable via
 * ?perStage=<n> up to MAX_PER_STAGE.
 */
const DEFAULT_PER_STAGE = 50;
const MAX_PER_STAGE = 200;

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!hasPermission(session.role, "deal", "read")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const perStageRaw = Number(request.nextUrl.searchParams.get("perStage")) || DEFAULT_PER_STAGE;
    const perStage = Math.min(Math.max(perStageRaw, 1), MAX_PER_STAGE);

    const baseWhere: Prisma.DealWhereInput = {
      status: { in: ["OUVERT", "EN_COURS"] },
    };

    // Limit scope to the user's own deals for non-managers
    const isManager =
      session.role === "SUPER_ADMIN" ||
      session.role === "DIRIGEANT" ||
      session.role === "ASSOCIE" ||
      session.role === "MANAGER";
    if (!isManager) {
      baseWhere.OR = [
        { assignedToId: session.userId },
        { propertyFoundById: session.userId },
        { dealClosedById: session.userId },
      ];
    }

    const allStages: DealStage[] = [
      "PROSPECT",
      "DECOUVERTE",
      "VISITE",
      "NEGOCIATION",
      "OFFRE",
      "COMPROMIS",
      "ACTE",
      "CLOTURE",
    ];

    // Fetch up to `perStage` per stage and aggregate totals in parallel
    const perStageResults = await Promise.all(
      allStages.map((stage) =>
        prisma.deal.findMany({
          where: { ...baseWhere, stage },
          include: {
            property: { select: { title: true, reference: true } },
            contact: { select: { firstName: true, lastName: true } },
            assignedTo: { select: { firstName: true, lastName: true } },
          },
          orderBy: { updatedAt: "desc" },
          take: perStage,
        })
      )
    );

    const totals = await prisma.deal.groupBy({
      by: ["stage"],
      where: baseWhere,
      _count: true,
    });
    const totalsByStage: Record<string, number> = {};
    for (const t of totals) totalsByStage[t.stage] = t._count;

    const grouped: Record<string, { deals: unknown[]; total: number }> = {};
    for (let i = 0; i < allStages.length; i++) {
      grouped[allStages[i]] = {
        deals: perStageResults[i],
        total: totalsByStage[allStages[i]] ?? 0,
      };
    }

    // Flat list (for backwards compatibility with older callers) — capped
    const flat = perStageResults.flat();

    return NextResponse.json({
      deals: flat,
      byStage: grouped,
      perStage,
    });
  } catch (err) {
    console.error("[deals/kanban] error", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
