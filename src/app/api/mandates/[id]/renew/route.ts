import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { renewMandate } from "@/modules/mandates";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "deal", "create")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    const mandate = await renewMandate(id, session.userId);
    if (!mandate) {
      return NextResponse.json({ error: "Mandat introuvable" }, { status: 404 });
    }
    return NextResponse.json(mandate, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
