import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { createPanel, listPanels } from "@/modules/panels";

const createPanelSchema = z.object({
  code: z.string().trim().min(2).max(40).optional(),
  label: z.string().trim().max(120).optional(),
  propertyId: z.string().trim().min(1).optional(),
  agentOverrideId: z.string().trim().min(1).optional(),
  notes: z.string().trim().max(500).optional(),
});

export async function GET() {
  const session = await getActiveSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!hasPermission(session.role, "property", "read")) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
  }
  const panels = await listPanels();
  return NextResponse.json({ panels });
}

export async function POST(req: NextRequest) {
  const session = await getActiveSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!hasPermission(session.role, "property", "create")) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createPanelSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const panel = await createPanel({
      ...parsed.data,
      assignedById: session.userId,
    });
    return NextResponse.json(panel, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    // Unique constraint on `code` → 409
    if (message.includes("Unique") || message.includes("unique")) {
      return NextResponse.json({ error: "Code déjà utilisé" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
