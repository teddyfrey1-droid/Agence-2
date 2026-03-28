import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { updateDeal } from "@/modules/deals";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!hasPermission(session.role, "deal", "update")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const deal = await updateDeal(id, {
      ...(body.stage !== undefined && { stage: body.stage }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.estimatedValue !== undefined && { estimatedValue: body.estimatedValue }),
      ...(body.description !== undefined && { description: body.description }),
    });

    return NextResponse.json(deal);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
