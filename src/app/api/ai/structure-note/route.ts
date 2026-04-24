import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActiveSession } from "@/lib/auth";
import { structureVoiceNote, isAIEnabled } from "@/lib/ai";

const schema = z.object({
  raw: z.string().min(1).max(4000),
});

export async function POST(request: NextRequest) {
  const session = await getActiveSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
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
    const result = await structureVoiceNote(parsed.data.raw);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[ai/structure-note] error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur IA" },
      { status: 500 }
    );
  }
}
