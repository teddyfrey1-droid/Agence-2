import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { publishProperty, unpublishProperty } from "@/modules/properties/properties.service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "property", "publish")) {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission de publier" },
        { status: 403 }
      );
    }
    const { id } = await params;
    const body = await request.json();

    const property = body.publish
      ? await publishProperty(id)
      : await unpublishProperty(id);

    return NextResponse.json(property);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
