import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { generateListing, isAIEnabled } from "@/lib/ai";

const schema = z.object({
  type: z.string().optional(),
  transactionType: z.string().optional(),
  surface: z.number().positive().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  quarter: z.string().optional(),
  price: z.number().nonnegative().optional(),
  rentMonthly: z.number().nonnegative().optional(),
  hasExtraction: z.boolean().optional(),
  hasTerrace: z.boolean().optional(),
  hasParking: z.boolean().optional(),
  hasLoadingDock: z.boolean().optional(),
  floor: z.number().int().optional(),
  facadeLength: z.number().positive().optional(),
  ceilingHeight: z.number().positive().optional(),
  notes: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getActiveSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!hasPermission(session.role, "property", "update")) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
  }
  if (!isAIEnabled()) {
    return NextResponse.json(
      { error: "L'IA n'est pas configurée sur ce serveur (ANTHROPIC_API_KEY manquant)." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const listing = await generateListing(parsed.data);
    return NextResponse.json(listing);
  } catch (err) {
    console.error("[ai/generate-listing] error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur IA" },
      { status: 500 }
    );
  }
}
