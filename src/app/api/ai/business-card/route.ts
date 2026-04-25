import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { validateImageFile } from "@/lib/file-validation";
import { extractBusinessCard, isAIEnabled } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const session = await getActiveSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!hasPermission(session.role, "contact", "create")) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
  }
  if (!isAIEnabled()) {
    return NextResponse.json(
      { error: "L'IA n'est pas configurée sur ce serveur (ANTHROPIC_API_KEY manquant)." },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Image requise" }, { status: 400 });
  }

  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Image trop volumineuse (max 8 Mo)" }, { status: 400 });
  }

  const validation = await validateImageFile(file, ["jpeg", "png", "webp"]);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const mediaTypeByKind: Record<string, "image/jpeg" | "image/png" | "image/webp"> = {
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  const mediaType = mediaTypeByKind[validation.kind];
  if (!mediaType) {
    return NextResponse.json({ error: "Format non supporté" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const data = await extractBusinessCard(base64, mediaType);
    return NextResponse.json({ contact: data });
  } catch (err) {
    console.error("[ai/business-card] error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur IA" },
      { status: 500 }
    );
  }
}
