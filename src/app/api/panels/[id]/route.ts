import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { assignPanel, findPanelById, retirePanel } from "@/modules/panels";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  // null clears the assignment
  propertyId: z.string().trim().min(1).nullable().optional(),
  agentOverrideId: z.string().trim().min(1).nullable().optional(),
  label: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
  reason: z.string().trim().max(120).optional(),
  retire: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getActiveSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!hasPermission(session.role, "property", "read")) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
  }
  const { id } = await params;
  const panel = await findPanelById(id);
  if (!panel) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(panel);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getActiveSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!hasPermission(session.role, "property", "update")) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  if (data.retire) {
    const panel = await retirePanel(id, data.reason);
    return NextResponse.json(panel);
  }

  // Reassign (or clear) the panel
  if (data.propertyId !== undefined || data.agentOverrideId !== undefined) {
    // Preserve fields that weren't explicitly provided — otherwise changing
    // only the agent override would accidentally detach the property.
    const current = await prisma.panel.findUnique({
      where: { id },
      select: { propertyId: true, agentOverrideId: true },
    });
    if (!current) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    const nextPropertyId =
      data.propertyId === undefined ? current.propertyId : data.propertyId;
    const nextAgentOverrideId =
      data.agentOverrideId === undefined ? current.agentOverrideId : data.agentOverrideId;
    try {
      const panel = await assignPanel({
        panelId: id,
        propertyId: nextPropertyId,
        agentOverrideId: nextAgentOverrideId,
        assignedById: session.userId,
        reason: data.reason,
      });
      // Allow updating label/notes in the same call.
      if (data.label !== undefined || data.notes !== undefined) {
        await prisma.panel.update({
          where: { id: panel.id },
          data: {
            ...(data.label !== undefined && { label: data.label }),
            ...(data.notes !== undefined && { notes: data.notes }),
          },
        });
      }
      return NextResponse.json(panel);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur interne";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  // Metadata-only update
  const panel = await prisma.panel.update({
    where: { id },
    data: {
      ...(data.label !== undefined && { label: data.label }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });
  return NextResponse.json(panel);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getActiveSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!hasPermission(session.role, "property", "delete")) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.panel.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
