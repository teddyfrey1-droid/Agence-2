import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { createSearchRequestSchema } from "@/modules/search-requests/search-requests.schema";
import { createSearchRequest } from "@/modules/search-requests";
import { generateReference } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
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

    return NextResponse.json(sr, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
