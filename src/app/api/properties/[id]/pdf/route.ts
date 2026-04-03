import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: { select: { firstName: true, lastName: true, company: true, phone: true, email: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
        media: { where: { isPrimary: true }, take: 1, select: { url: true, isPrimary: true } },
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Bien introuvable" }, { status: 404 });
    }

    return NextResponse.json(property);
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
