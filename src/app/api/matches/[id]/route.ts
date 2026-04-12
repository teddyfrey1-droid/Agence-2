import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "match", "update")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();

    const validStatuses = ["SUGGERE", "VALIDE", "REJETE", "EN_VISITE", "RETENU"];
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const match = await prisma.match.update({
      where: { id },
      data: {
        status: body.status,
        ...(body.status === "REJETE" && body.rejectionReason
          ? { rejectionReason: body.rejectionReason }
          : {}),
      },
    });

    return NextResponse.json(match);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
