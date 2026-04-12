import { NextRequest, NextResponse } from "next/server";
import { getActiveSession } from "@/lib/auth";
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

    const { id } = await params;
    const body = await request.json();

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json({ error: "Événement introuvable" }, { status: 404 });
    }
    if (event.userId !== session.userId) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }

    // Validate dates if provided
    if (body.startAt !== undefined) {
      const d = new Date(body.startAt);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "Date de début invalide" }, { status: 400 });
      }
    }
    if (body.endAt !== undefined && body.endAt !== null) {
      const d = new Date(body.endAt);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "Date de fin invalide" }, { status: 400 });
      }
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: String(body.title).slice(0, 200) }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.startAt !== undefined && { startAt: new Date(body.startAt) }),
        ...(body.endAt !== undefined && { endAt: body.endAt ? new Date(body.endAt) : null }),
        ...(body.allDay !== undefined && { allDay: Boolean(body.allDay) }),
        ...(body.color !== undefined && { color: String(body.color).slice(0, 20) }),
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getActiveSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json({ error: "Événement introuvable" }, { status: 404 });
    }
    if (event.userId !== session.userId) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
    }
    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
