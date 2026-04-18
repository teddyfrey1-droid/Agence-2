import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import {
  findSearchRequestById,
  updateSearchRequest,
  rescoreSearchRequest,
} from "@/modules/search-requests";
import { updateSearchRequestSchema } from "@/modules/search-requests/search-requests.schema";
import { prisma } from "@/lib/prisma";
import {
  runMatchingForSearchRequest,
  cleanupMatchesForInactiveSearchRequest,
} from "@/modules/matching";

// Criteria fields that materially change who a search request matches against.
// Touching any of them triggers a fresh matching pass.
const CRITERIA_FIELDS = [
  "propertyTypes",
  "transactionType",
  "budgetMin",
  "budgetMax",
  "surfaceMin",
  "surfaceMax",
  "districts",
  "quarters",
  "cities",
  "needsExtraction",
  "needsTerrace",
  "needsParking",
  "needsLoadingDock",
] as const;

const ACTIVE_STATUSES = new Set(["NOUVELLE", "QUALIFIEE", "EN_COURS"]);
const INACTIVE_STATUSES = new Set(["EN_PAUSE", "SATISFAITE", "ABANDONNEE", "ARCHIVEE"]);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "search_request", "read")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    const request = await findSearchRequestById(id);
    if (!request) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }
    return NextResponse.json(request);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "search_request", "update")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSearchRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // Snapshot pre-update status so we can detect activation transitions.
    const before = await prisma.searchRequest.findUnique({
      where: { id },
      select: { status: true },
    });

    const updated = await updateSearchRequest(id, {
      ...(data.propertyTypes !== undefined && { propertyTypes: data.propertyTypes as never }),
      ...(data.transactionType !== undefined && { transactionType: data.transactionType as never }),
      ...(data.budgetMin !== undefined && { budgetMin: data.budgetMin }),
      ...(data.budgetMax !== undefined && { budgetMax: data.budgetMax }),
      ...(data.surfaceMin !== undefined && { surfaceMin: data.surfaceMin }),
      ...(data.surfaceMax !== undefined && { surfaceMax: data.surfaceMax }),
      ...(data.activity !== undefined && { activity: data.activity }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.districts !== undefined && { districts: data.districts }),
      ...(data.quarters !== undefined && { quarters: data.quarters }),
      ...(data.cities !== undefined && { cities: data.cities }),
      ...(data.needsExtraction !== undefined && { needsExtraction: data.needsExtraction }),
      ...(data.needsTerrace !== undefined && { needsTerrace: data.needsTerrace }),
      ...(data.needsParking !== undefined && { needsParking: data.needsParking }),
      ...(data.needsLoadingDock !== undefined && { needsLoadingDock: data.needsLoadingDock }),
      ...(data.status !== undefined && { status: data.status as never }),
    });

    // Proactive reaction to what just changed:
    //   1. Criteria changed  → rerun matching against the full catalog.
    //   2. Status → active   → rerun matching (e.g. qualifying a NOUVELLE).
    //   3. Status → inactive → wipe suggested matches to clean up the inbox.
    const criteriaChanged = CRITERIA_FIELDS.some((k) => data[k] !== undefined);
    const wasActive = before ? ACTIVE_STATUSES.has(before.status) : false;
    const nowActive =
      data.status !== undefined ? ACTIVE_STATUSES.has(data.status) : wasActive;
    const becameActive = !wasActive && nowActive;
    const becameInactive = wasActive && data.status !== undefined && INACTIVE_STATUSES.has(data.status);

    if (nowActive && (criteriaChanged || becameActive)) {
      runMatchingForSearchRequest(id).catch((err) =>
        console.error("[search-requests PATCH] re-match failed", err)
      );
    } else if (becameInactive) {
      cleanupMatchesForInactiveSearchRequest(id).catch((err) =>
        console.error("[search-requests PATCH] cleanup failed", err)
      );
    }

    // Keep the qualification score fresh whenever criteria change.
    if (criteriaChanged) {
      rescoreSearchRequest(id).catch((err) =>
        console.error("[search-requests PATCH] rescoring failed", err)
      );
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "search_request", "delete")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    await prisma.searchRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
