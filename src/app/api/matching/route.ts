import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { runMatchingForProperty, runMatchingForSearchRequest } from "@/modules/matching";

const matchingSchema = z
  .object({
    propertyId: z.string().cuid().optional(),
    searchRequestId: z.string().cuid().optional(),
  })
  .refine((d) => Boolean(d.propertyId) !== Boolean(d.searchRequestId), {
    message: "propertyId ou searchRequestId requis (exactement un)",
  });

export async function POST(request: NextRequest) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Only users who can update matches may trigger re-matching
    if (!hasPermission(session.role, "match", "update") && !hasPermission(session.role, "match", "create")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = matchingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { propertyId, searchRequestId } = parsed.data;

    if (propertyId) {
      const results = await runMatchingForProperty(propertyId);
      return NextResponse.json({ matches: results.length, results });
    }

    // searchRequestId guaranteed by the refine
    const results = await runMatchingForSearchRequest(searchRequestId!);
    return NextResponse.json({ matches: results.length, results });
  } catch (err) {
    console.error("[api/matching] error:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
