import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createEventSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["VISITE", "REUNION", "RELANCE", "SIGNATURE", "AUTRE"]).default("VISITE"),
  description: z.string().optional(),
  startAt: z.string().min(1),
  endAt: z.string().optional(),
  allDay: z.boolean().default(false),
  color: z.string().optional(),
  contactId: z.string().optional(),
  propertyId: z.string().optional(),
  dealId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const where: Record<string, unknown> = { userId: session.userId };
    if (start && end) {
      where.startAt = { gte: new Date(start), lte: new Date(end) };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        contact: { select: { firstName: true, lastName: true } },
        property: { select: { title: true, reference: true } },
        deal: { select: { title: true, reference: true } },
      },
      orderBy: { startAt: "asc" },
    });

    return NextResponse.json(events);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const event = await prisma.event.create({
      data: {
        title: data.title,
        type: data.type,
        description: data.description || null,
        startAt: new Date(data.startAt),
        endAt: data.endAt ? new Date(data.endAt) : null,
        allDay: data.allDay,
        color: data.color || null,
        userId: session.userId,
        contactId: data.contactId || null,
        propertyId: data.propertyId || null,
        dealId: data.dealId || null,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
