import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { createFieldSpottingSchema } from "@/modules/field-spotting/field-spotting.schema";
import { createFieldSpotting, findFieldSpottings } from "@/modules/field-spotting";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "field_spotting", "read")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { items } = await findFieldSpottings({}, 1, 500);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!hasPermission(session.role, "field_spotting", "create")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createFieldSpottingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const spotting = await createFieldSpotting({
      address: data.address,
      city: data.city,
      zipCode: data.zipCode ?? null,
      district: data.district ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      photoUrl: data.photoUrl ?? null,
      notes: data.notes ?? null,
      propertyType: (data.propertyType as never) ?? null,
      transactionType: (data.transactionType as never) ?? null,
      surface: data.surface ?? null,
      status: "REPERE",
      ...(data.assignedToId
        ? { assignedTo: { connect: { id: data.assignedToId } } }
        : { assignedTo: { connect: { id: session.userId } } }),
    });

    return NextResponse.json(spotting, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
