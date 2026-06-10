import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import {
  createMandate,
  findMandates,
  createMandateSchema,
} from "@/modules/mandates";

export async function GET(request: NextRequest) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "deal", "read")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10) || 1, 1);
    const perPage = Math.min(
      Math.max(parseInt(searchParams.get("perPage") || "20", 10) || 20, 1),
      100
    );

    const result = await findMandates(
      {
        status: searchParams.get("status")?.trim() || undefined,
        kind: searchParams.get("kind")?.trim() || undefined,
        contactId: searchParams.get("contactId")?.trim() || undefined,
        propertyId: searchParams.get("propertyId")?.trim() || undefined,
        search: searchParams.get("search")?.trim() || undefined,
      },
      page,
      perPage
    );

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "deal", "create")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createMandateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const mandate = await createMandate({
      kind: data.kind,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      feesPercent: data.feesPercent || null,
      feesAmount: data.feesAmount || null,
      feesPayer: data.feesPayer || null,
      notes: data.notes || null,
      contact: { connect: { id: data.contactId } },
      ...(data.propertyId ? { property: { connect: { id: data.propertyId } } } : {}),
      createdBy: { connect: { id: session.userId } },
    });

    return NextResponse.json(mandate, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
