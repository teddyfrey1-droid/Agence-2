import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { createInteractionSchema } from "@/modules/interactions/interactions.schema";
import { createInteraction } from "@/modules/interactions";

export async function POST(request: NextRequest) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!hasPermission(session.role, "interaction", "create")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createInteractionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const interaction = await createInteraction({
      type: data.type as never,
      subject: data.subject ?? null,
      content: data.content ?? null,
      date: data.date ? new Date(data.date) : new Date(),
      user: { connect: { id: session.userId } },
      ...(data.contactId ? { contact: { connect: { id: data.contactId } } } : {}),
      ...(data.propertyId ? { property: { connect: { id: data.propertyId } } } : {}),
      ...(data.searchRequestId ? { searchRequest: { connect: { id: data.searchRequestId } } } : {}),
      ...(data.dealId ? { deal: { connect: { id: data.dealId } } } : {}),
    });

    return NextResponse.json(interaction, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
