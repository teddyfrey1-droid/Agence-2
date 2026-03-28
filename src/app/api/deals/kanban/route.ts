import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const deals = await prisma.deal.findMany({
      where: { status: { in: ["OUVERT", "EN_COURS"] } },
      include: {
        property: { select: { title: true, reference: true } },
        contact: { select: { firstName: true, lastName: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(deals);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
