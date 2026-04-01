import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { findFieldSpottingById, updateFieldSpotting } from "@/modules/field-spotting";
import { updateFieldSpottingSchema } from "@/modules/field-spotting/field-spotting.schema";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "field_spotting", "read")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    const spot = await findFieldSpottingById(id);
    if (!spot) {
      return NextResponse.json({ error: "Repérage introuvable" }, { status: 404 });
    }
    return NextResponse.json(spot);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "field_spotting", "update")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const parsed = updateFieldSpottingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const spot = await updateFieldSpotting(id, parsed.data as never);
    return NextResponse.json(spot);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "field_spotting", "delete")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    await prisma.fieldSpotting.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
