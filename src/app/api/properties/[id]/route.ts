import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { findPropertyById, updateProperty, deleteProperty } from "@/modules/properties";
import { updatePropertySchema } from "@/modules/properties/properties.schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "property", "read")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    const property = await findPropertyById(id);
    if (!property) {
      return NextResponse.json({ error: "Bien introuvable" }, { status: 404 });
    }
    return NextResponse.json(property);
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
    if (!hasPermission(session.role, "property", "update")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const parsed = updatePropertySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const property = await updateProperty(id, parsed.data as never);
    return NextResponse.json(property);
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
    if (!hasPermission(session.role, "property", "delete")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    await deleteProperty(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
