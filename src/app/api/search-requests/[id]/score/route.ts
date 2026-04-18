import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { rescoreSearchRequest } from "@/modules/search-requests";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const score = await rescoreSearchRequest(id);
    if (score === null) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }
    return NextResponse.json({ score });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
