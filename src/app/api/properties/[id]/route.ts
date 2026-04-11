import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { findPropertyById, updateProperty, deleteProperty } from "@/modules/properties";
import { updatePropertySchema } from "@/modules/properties/properties.schema";
import {
  runMatchingForProperty,
  cleanupMatchesForInactiveProperty,
} from "@/modules/matching";

// Property statuses that should NOT surface active matches.
const NON_MATCHABLE_STATUSES = new Set([
  "ARCHIVE",
  "RETIRE",
  "VENDU",
  "LOUE",
  "PRENEUR_TROUVE",
  "SOUS_COMPROMIS",
]);

// Fields whose change should invalidate existing matches.
const MATCH_RELEVANT_FIELDS = [
  "type",
  "transactionType",
  "city",
  "district",
  "quarter",
  "surfaceTotal",
  "surfaceMin",
  "surfaceMax",
  "price",
  "rentMonthly",
  "rentYearly",
  "hasExtraction",
  "hasTerrace",
  "hasParking",
  "hasLoadingDock",
  "status",
] as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "property", "read")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    const property = await findPropertyById(id);
    if (!property) {
      return NextResponse.json({ error: "Bien introuvable" }, { status: 404 });
    }
    return NextResponse.json(property);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "property", "update")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const parsed = updatePropertySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Did any matching-relevant field change? If so, we must re-run the matcher.
    const shouldRematch = MATCH_RELEVANT_FIELDS.some(
      (f) => (parsed.data as Record<string, unknown>)[f] !== undefined
    );

    const property = await updateProperty(id, parsed.data as never);

    if (shouldRematch) {
      // Fire-and-forget: don't block the response, but catch errors so a
      // failing matcher doesn't poison the API response.
      const newStatus = (parsed.data as { status?: string }).status;
      if (newStatus && NON_MATCHABLE_STATUSES.has(newStatus)) {
        cleanupMatchesForInactiveProperty(id).catch((err) =>
          console.error("[properties/:id] cleanup matches failed", err)
        );
      } else {
        runMatchingForProperty(id).catch((err) =>
          console.error("[properties/:id] re-matching failed", err)
        );
      }
    }

    return NextResponse.json(property);
  } catch (err) {
    console.error("[properties/:id] PATCH error", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "property", "delete")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    await deleteProperty(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
