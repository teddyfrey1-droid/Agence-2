import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { findDealById, updateDeal } from "@/modules/deals";
import { updateDealSchema } from "@/modules/deals/deals.schema";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "deal", "read")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    const deal = await findDealById(id);
    if (!deal) {
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    }
    return NextResponse.json(deal);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "deal", "update")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const parsed = updateDealSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const deal = await updateDeal(id, {
      ...(data.stage !== undefined && { stage: data.stage as never }),
      ...(data.status !== undefined && { status: data.status as never }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.estimatedValue !== undefined && { estimatedValue: data.estimatedValue }),
      ...(data.finalValue !== undefined && { finalValue: data.finalValue }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.lostReason !== undefined && { lostReason: data.lostReason }),
    });
    return NextResponse.json(deal);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    if (!hasPermission(session.role, "deal", "delete")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    const { id } = await params;
    await prisma.deal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
