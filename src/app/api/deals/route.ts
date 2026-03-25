import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { createDealSchema } from "@/modules/deals/deals.schema";
import { createDeal } from "@/modules/deals";
import { generateReference } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!hasPermission(session.role, "deal", "create")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createDealSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const deal = await createDeal({
      reference: generateReference("DS"),
      title: data.title,
      stage: data.stage as never,
      status: "OUVERT",
      estimatedValue: data.estimatedValue ?? null,
      commission: data.commission ?? null,
      description: data.description ?? null,
      notes: data.notes ?? null,
      expectedCloseAt: data.expectedCloseAt ? new Date(data.expectedCloseAt) : null,
      ...(data.propertyId ? { property: { connect: { id: data.propertyId } } } : {}),
      ...(data.contactId ? { contact: { connect: { id: data.contactId } } } : {}),
      ...(data.searchRequestId ? { searchRequest: { connect: { id: data.searchRequestId } } } : {}),
      ...(data.assignedToId
        ? { assignedTo: { connect: { id: data.assignedToId } } }
        : { assignedTo: { connect: { id: session.userId } } }),
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
