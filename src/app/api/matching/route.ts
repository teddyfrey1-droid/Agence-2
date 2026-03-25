import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { runMatchingForProperty, runMatchingForSearchRequest } from "@/modules/matching";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, searchRequestId } = body;

    if (propertyId) {
      const results = await runMatchingForProperty(propertyId);
      return NextResponse.json({ matches: results.length, results });
    }

    if (searchRequestId) {
      const results = await runMatchingForSearchRequest(searchRequestId);
      return NextResponse.json({ matches: results.length, results });
    }

    return NextResponse.json(
      { error: "propertyId ou searchRequestId requis" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
