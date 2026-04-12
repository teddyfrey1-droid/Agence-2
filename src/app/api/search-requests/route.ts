import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { createSearchRequestSchema } from "@/modules/search-requests/search-requests.schema";
import { createSearchRequest } from "@/modules/search-requests";
import { generateReference } from "@/lib/utils";
import { runMatchingForSearchRequest } from "@/modules/matching";

export async function POST(request: NextRequest) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!hasPermission(session.role, "search_request", "create")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createSearchRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const sr = await createSearchRequest({
      reference: generateReference("DR"),
      status: "NOUVELLE",
      source: "AUTRE",
      propertyTypes: data.propertyTypes as never[],
      transactionType: data.transactionType as never,
      budgetMin: data.budgetMin ?? null,
      budgetMax: data.budgetMax ?? null,
      surfaceMin: data.surfaceMin ?? null,
      surfaceMax: data.surfaceMax ?? null,
      districts: data.districts,
      quarters: data.quarters,
      cities: data.cities,
      activity: data.activity ?? null,
      description: data.description ?? null,
      notes: data.notes ?? null,
      ...(data.contactId ? { contact: { connect: { id: data.contactId } } } : {}),
      ...(data.assignedToId ? { assignedTo: { connect: { id: data.assignedToId } } } : {}),
    });

    // Trigger initial matching in the background. We don't await it so the
    // request doesn't block on what can be a heavy job, but we catch errors
    // so a matcher crash doesn't surface as a failed POST.
    runMatchingForSearchRequest(sr.id).catch((err) =>
      console.error("[search-requests POST] initial matching failed", err)
    );

    return NextResponse.json(sr, { status: 201 });
  } catch (err) {
    console.error("[search-requests POST] error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
